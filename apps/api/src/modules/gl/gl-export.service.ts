import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { glExportJobs, invoices } from '@betterspend/db';
import { GlMappingsService } from './gl-mappings.service';

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

      // In production this would call QBO/Xero API. For now, record the payload
      // and mark as exported (the actual API call is wired in Phase 5b when OAuth is added).
      const externalId = `${targetSystem.toUpperCase()}-PENDING-${invoice.internalNumber}`;
      await this.markJob(job.id, 'exported', null, payload, externalId);

      this.logger.log(
        `GL export queued for invoice ${invoice.internalNumber} → ${targetSystem} (${exportLines.length} lines, ${unmappedAccounts.length} unmapped)`,
      );
    } catch (err: unknown) {
      await this.markJob(job.id, 'failed', String(err), null, null);
      throw err;
    }
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
      const externalId = `${targetSystem.toUpperCase()}-PENDING-${invoice.internalNumber}`;
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
