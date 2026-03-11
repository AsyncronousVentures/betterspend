import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { glExportJobs, invoices } from '@betterspend/db';
import { GlMappingsService } from './gl-mappings.service';
import { OAuthService } from './oauth.service';
import axios from 'axios';

export type GlTargetSystem = 'qbo' | 'xero';

export interface GlExportLine {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  glAccount: string | null;
  externalAccountCode: string | null;
  externalAccountName: string | null;
  unmapped: boolean;
}

export interface GlExportPayload {
  invoiceId: string;
  internalNumber: string;
  invoiceNumber: string;
  vendorName: string;
  invoiceDate: string;
  dueDate: string | null;
  currency: string;
  totalAmount: number;
  lines: GlExportLine[];
  unmappedAccounts: string[];
}

@Injectable()
export class GlExportService {
  private readonly logger = new Logger(GlExportService.name);

  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly glMappingsService: GlMappingsService,
    private readonly oauthService: OAuthService,
    @InjectQueue('gl-export') private readonly glQueue: Queue,
  ) {}

  /**
   * Enqueues a GL export job for a newly approved invoice.
   * Called fire-and-forget from InvoicesService via the invoice.approved webhook event.
   */
  enqueue(organizationId: string, invoiceId: string, targetSystem: GlTargetSystem): void {
    this.glQueue
      .add(
        'process-export',
        { organizationId, invoiceId, targetSystem },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
        },
      )
      .catch((err: unknown) =>
        this.logger.error(`Failed to enqueue GL export for invoice ${invoiceId}: ${String(err)}`),
      );
  }

  async processExport(
    organizationId: string,
    invoiceId: string,
    targetSystem: GlTargetSystem,
  ): Promise<void> {
    // Create pending job record
    const [job] = await this.db
      .insert(glExportJobs)
      .values({ organizationId, invoiceId, targetSystem, status: 'pending', attempts: 0 })
      .returning();

    try {
      const invoice = await this.db.query.invoices.findFirst({
        where: (i, { eq }) => eq(i.id, invoiceId),
        with: { vendor: true, lines: true },
      });

      if (!invoice) {
        await this.markJob(job.id, 'failed', 'Invoice not found', null, null);
        return;
      }

      // Build export lines with GL mapping lookups
      const exportLines: GlExportLine[] = [];
      const unmappedAccounts: string[] = [];

      for (const line of invoice.lines as Array<{
        lineNumber: string;
        description: string;
        quantity: string;
        unitPrice: string;
        totalPrice: string;
        glAccount: string | null;
      }>) {
        let externalCode: string | null = null;
        let externalName: string | null = null;
        let unmapped = false;

        if (line.glAccount) {
          const mapping = await this.glMappingsService.findByGlAccount(
            organizationId,
            line.glAccount,
            targetSystem,
          );
          if (mapping) {
            externalCode = mapping.externalAccountCode;
            externalName = mapping.externalAccountName ?? null;
          } else {
            unmapped = true;
            if (!unmappedAccounts.includes(line.glAccount)) {
              unmappedAccounts.push(line.glAccount);
            }
          }
        } else {
          unmapped = true;
        }

        exportLines.push({
          lineNumber: Number(line.lineNumber),
          description: line.description,
          quantity: parseFloat(line.quantity),
          unitPrice: parseFloat(line.unitPrice),
          totalPrice: parseFloat(line.totalPrice),
          glAccount: line.glAccount,
          externalAccountCode: externalCode,
          externalAccountName: externalName,
          unmapped,
        });
      }

      const vendor = invoice.vendor as { name: string } | null;
      const payload: GlExportPayload = {
        invoiceId: invoice.id,
        internalNumber: invoice.internalNumber,
        invoiceNumber: invoice.invoiceNumber,
        vendorName: vendor?.name ?? 'Unknown Vendor',
        invoiceDate: invoice.invoiceDate.toISOString(),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
        currency: invoice.currency,
        totalAmount: parseFloat(invoice.totalAmount),
        lines: exportLines,
        unmappedAccounts,
      };

      // If all lines have unmapped GL accounts, mark as skipped (cannot export without codes)
      const allUnmapped = exportLines.length > 0 && exportLines.every((l) => l.unmapped);
      if (allUnmapped) {
        await this.markJob(job.id, 'skipped', `No GL mappings found for ${targetSystem}`, payload, null);
        this.logger.warn(`GL export skipped for invoice ${invoice.internalNumber}: no mappings for ${targetSystem}`);
        return;
      }

      // Attempt actual API call; fall back to PENDING placeholder if no tokens configured
      const externalId = await this.sendToExternalSystem(organizationId, targetSystem, payload, job.id);
      await this.markJob(job.id, 'exported', null, payload, externalId);

      this.logger.log(
        `GL export complete for invoice ${invoice.internalNumber} → ${targetSystem} (externalId=${externalId})`,
      );
    } catch (err: unknown) {
      await this.markJob(job.id, 'failed', String(err), null, null);
      throw err;
    }
  }

  /**
   * Sends the export payload to the external GL system (QBO or Xero).
   * Returns the external record ID assigned by the remote API.
   * If OAuth tokens are not configured, returns a PENDING placeholder so the
   * job still records a useful state rather than failing.
   */
  private async sendToExternalSystem(
    organizationId: string,
    targetSystem: GlTargetSystem,
    payload: GlExportPayload,
    jobId: string,
  ): Promise<string> {
    if (targetSystem === 'qbo') {
      return this.sendToQbo(organizationId, payload);
    }
    // targetSystem === 'xero'
    return this.sendToXero(organizationId, payload);
  }

  private async sendToQbo(organizationId: string, payload: GlExportPayload): Promise<string> {
    const tokens = await this.oauthService.getQboToken(organizationId);
    if (!tokens) {
      this.logger.warn(`QBO not connected for org ${organizationId}; using placeholder`);
      return `QBO-PENDING-${payload.internalNumber}`;
    }

    const { accessToken, realmId } = tokens;
    const baseUrl = process.env.QBO_API_URL || 'https://quickbooks.api.intuit.com';

    // Map lines to QBO Bill line items
    const lineItems = payload.lines
      .filter((l) => !l.unmapped && l.externalAccountCode)
      .map((l) => ({
        Amount: l.totalPrice,
        DetailType: 'AccountBasedExpenseLineDetail',
        Description: l.description,
        AccountBasedExpenseLineDetail: {
          AccountRef: { value: l.externalAccountCode },
        },
      }));

    if (lineItems.length === 0) {
      return `QBO-SKIPPED-${payload.internalNumber}`;
    }

    const billBody = {
      VendorRef: { name: payload.vendorName },
      TxnDate: payload.invoiceDate.split('T')[0],
      DueDate: payload.dueDate ? payload.dueDate.split('T')[0] : undefined,
      DocNumber: payload.invoiceNumber,
      CurrencyRef: { value: payload.currency },
      Line: lineItems,
    };

    const res = await axios.post<{ Bill: { Id: string } }>(
      `${baseUrl}/v3/company/${realmId}/bill`,
      billBody,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    const qboId = res.data?.Bill?.Id ?? `QBO-${payload.internalNumber}`;
    this.logger.log(`QBO Bill created: ${qboId} for invoice ${payload.internalNumber}`);
    return `QBO-${qboId}`;
  }

  private async sendToXero(organizationId: string, payload: GlExportPayload): Promise<string> {
    const tokens = await this.oauthService.getXeroToken(organizationId);
    if (!tokens) {
      this.logger.warn(`Xero not connected for org ${organizationId}; using placeholder`);
      return `XERO-PENDING-${payload.internalNumber}`;
    }

    const { accessToken, tenantId } = tokens;

    // Map lines to Xero invoice line items
    const lineItems = payload.lines
      .filter((l) => !l.unmapped && l.externalAccountCode)
      .map((l) => ({
        Description: l.description,
        Quantity: l.quantity,
        UnitAmount: l.unitPrice,
        AccountCode: l.externalAccountCode,
      }));

    if (lineItems.length === 0) {
      return `XERO-SKIPPED-${payload.internalNumber}`;
    }

    const invoiceBody = {
      Type: 'ACCPAY',
      Contact: { Name: payload.vendorName },
      Date: payload.invoiceDate.split('T')[0],
      DueDate: payload.dueDate ? payload.dueDate.split('T')[0] : undefined,
      InvoiceNumber: payload.invoiceNumber,
      CurrencyCode: payload.currency,
      LineItems: lineItems,
      Status: 'AUTHORISED',
    };

    const res = await axios.post<{ Invoices: Array<{ InvoiceID: string }> }>(
      'https://api.xero.com/api.xro/2.0/Invoices',
      { Invoices: [invoiceBody] },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'xero-tenant-id': tenantId,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    const xeroId = res.data?.Invoices?.[0]?.InvoiceID ?? `XERO-${payload.internalNumber}`;
    this.logger.log(`Xero Invoice created: ${xeroId} for invoice ${payload.internalNumber}`);
    return `XERO-${xeroId}`;
  }

  async findJobsForInvoice(invoiceId: string) {
    return this.db.query.glExportJobs.findMany({
      where: (j, { eq }) => eq(j.invoiceId, invoiceId),
      orderBy: (j, { desc }) => desc(j.createdAt),
    });
  }

  async retryJob(jobId: string, organizationId: string): Promise<void> {
    const job = await this.db.query.glExportJobs.findFirst({
      where: (j, { and, eq: eqFn }) => and(eqFn(j.id, jobId), eqFn(j.organizationId, organizationId)),
    });
    if (!job) throw new Error(`GL export job ${jobId} not found`);
    // Reset to pending then re-process
    await this.db.update(glExportJobs).set({ status: 'pending', errorMessage: null, updatedAt: new Date() }).where(eq(glExportJobs.id, jobId));
    await this.glQueue.add(
      'retry-export',
      { jobId, organizationId, invoiceId: job.invoiceId, targetSystem: job.targetSystem as GlTargetSystem },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }

  async processExportForJob(jobId: string, organizationId: string, invoiceId: string, targetSystem: GlTargetSystem): Promise<void> {
    try {
      const invoice = await this.db.query.invoices.findFirst({
        where: (i, { eq: eqFn }) => eqFn(i.id, invoiceId),
        with: { vendor: true, lines: true },
      });
      if (!invoice) { await this.markJobById(jobId, 'failed', 'Invoice not found', null, null); return; }

      const exportLines: GlExportLine[] = [];
      const unmappedAccounts: string[] = [];
      for (const line of invoice.lines as Array<{ lineNumber: string; description: string; quantity: string; unitPrice: string; totalPrice: string; glAccount: string | null; }>) {
        let externalCode: string | null = null;
        let externalName: string | null = null;
        let unmapped = false;
        if (line.glAccount) {
          const mapping = await this.glMappingsService.findByGlAccount(organizationId, line.glAccount, targetSystem);
          if (mapping) { externalCode = mapping.externalAccountCode; externalName = mapping.externalAccountName ?? null; }
          else { unmapped = true; if (!unmappedAccounts.includes(line.glAccount)) unmappedAccounts.push(line.glAccount); }
        } else { unmapped = true; }
        exportLines.push({ lineNumber: Number(line.lineNumber), description: line.description, quantity: parseFloat(line.quantity), unitPrice: parseFloat(line.unitPrice), totalPrice: parseFloat(line.totalPrice), glAccount: line.glAccount, externalAccountCode: externalCode, externalAccountName: externalName, unmapped });
      }
      const vendor = invoice.vendor as { name: string } | null;
      const payload: GlExportPayload = {
        invoiceId: invoice.id, internalNumber: invoice.internalNumber, invoiceNumber: invoice.invoiceNumber,
        vendorName: vendor?.name ?? 'Unknown Vendor', invoiceDate: invoice.invoiceDate.toISOString(),
        dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null, currency: invoice.currency,
        totalAmount: parseFloat(invoice.totalAmount), lines: exportLines, unmappedAccounts,
      };
      const allUnmapped = exportLines.length > 0 && exportLines.every((l) => l.unmapped);
      if (allUnmapped) { await this.markJobById(jobId, 'skipped', `No GL mappings found for ${targetSystem}`, payload, null); return; }

      const externalId = await this.sendToExternalSystem(organizationId, targetSystem, payload, jobId);
      await this.markJobById(jobId, 'exported', null, payload, externalId);
    } catch (err: unknown) {
      await this.markJobById(jobId, 'failed', String(err), null, null);
    }
  }

  private async markJobById(id: string, status: string, errorMessage: string | null, payload: GlExportPayload | null, externalId: string | null) {
    await this.db.update(glExportJobs).set({
      status, attempts: 1, errorMessage, payload: payload as Record<string, unknown> | null,
      externalId, exportedAt: status === 'exported' ? new Date() : null, updatedAt: new Date(),
    }).where(eq(glExportJobs.id, id));
  }

  async findAll(organizationId: string) {
    return this.db.query.glExportJobs.findMany({
      where: (j, { eq }) => eq(j.organizationId, organizationId),
      with: { invoice: true },
      orderBy: (j, { desc }) => desc(j.createdAt),
      limit: 100,
    });
  }

  private async markJob(
    id: string,
    status: string,
    errorMessage: string | null,
    payload: GlExportPayload | null,
    externalId: string | null,
  ) {
    await this.db
      .update(glExportJobs)
      .set({
        status,
        attempts: 1,
        errorMessage,
        payload: payload as Record<string, unknown> | null,
        externalId,
        exportedAt: status === 'exported' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(glExportJobs.id, id));
  }
}
