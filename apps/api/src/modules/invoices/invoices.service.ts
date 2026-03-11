import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { invoices, invoiceLines, purchaseOrders, requisitions } from '@betterspend/db';
import { SequenceService } from '../../common/services/sequence.service';
import { MatchingService } from './matching.service';
import { WebhookEventService } from '../webhooks/webhook-event.service';
import { GlExportService } from '../gl/gl-export.service';
import { BudgetsService } from '../budgets/budgets.service';

export interface CreateInvoiceInput {
  purchaseOrderId?: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  currency?: string;
  lines: Array<{
    poLineId?: string;
    lineNumber: number;
    description: string;
    quantity: number;
    unitPrice: number;
    glAccount?: string;
  }>;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly sequenceService: SequenceService,
    private readonly matchingService: MatchingService,
    private readonly webhookEvents: WebhookEventService,
    private readonly glExport: GlExportService,
    private readonly budgets: BudgetsService,
  ) {}

  async findAll(organizationId: string) {
    return this.db.query.invoices.findMany({
      where: (i, { eq }) => eq(i.organizationId, organizationId),
      with: { vendor: true, purchaseOrder: true },
      orderBy: (i, { desc }) => desc(i.createdAt),
    });
  }

  async findOne(id: string, organizationId: string) {
    const invoice = await this.db.query.invoices.findFirst({
      where: (i, { and, eq }) => and(eq(i.id, id), eq(i.organizationId, organizationId)),
      with: {
        vendor: true,
        purchaseOrder: { with: { lines: true } },
        lines: { with: { matchResults: true } },
      },
    });
    if (!invoice) throw new NotFoundException(`Invoice ${id} not found`);
    return invoice;
  }

  async create(organizationId: string, input: CreateInvoiceInput) {
    const internalNumber = await this.sequenceService.next(organizationId, 'invoice');

    const subtotal = input.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
    const totalAmount = subtotal; // no tax calculation for now

    const invoiceId = await this.db.transaction(async (tx) => {
      const [inv] = await tx.insert(invoices).values({
        organizationId,
        purchaseOrderId: input.purchaseOrderId ?? null,
        vendorId: input.vendorId,
        invoiceNumber: input.invoiceNumber,
        internalNumber,
        invoiceDate: new Date(input.invoiceDate),
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        currency: input.currency ?? 'USD',
        subtotal: String(subtotal.toFixed(2)),
        taxAmount: '0',
        totalAmount: String(totalAmount.toFixed(2)),
        status: 'pending_match',
        matchStatus: 'unmatched',
      }).returning();

      if (input.lines.length > 0) {
        await tx.insert(invoiceLines).values(
          input.lines.map((l) => ({
            invoiceId: inv.id,
            poLineId: l.poLineId ?? null,
            lineNumber: String(l.lineNumber),
            description: l.description,
            quantity: String(l.quantity),
            unitPrice: String(l.unitPrice),
            totalPrice: String((l.quantity * l.unitPrice).toFixed(2)),
            glAccount: l.glAccount ?? null,
          })),
        );
      }

      return inv.id;
    });

    // Auto-run 3-way match if PO is linked
    if (input.purchaseOrderId) {
      const matchResult = await this.matchingService.runMatch(invoiceId);
      const newStatus = matchResult.matchStatus === 'full_match' ? 'matched'
        : matchResult.matchStatus === 'exception' ? 'exception'
        : 'partial_match';
      await this.db.update(invoices)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(invoices.id, invoiceId));
    }

    const created = await this.findOne(invoiceId, organizationId);
    if (input.purchaseOrderId) {
      const matchSt = (created as any).matchStatus;
      if (matchSt === 'exception') {
        this.webhookEvents.emit(organizationId, 'invoice.exception', { invoice: created });
      } else {
        this.webhookEvents.emit(organizationId, 'invoice.matched', { invoice: created });
      }
    }
    return created;
  }

  async runMatch(id: string, organizationId: string) {
    await this.findOne(id, organizationId); // validate exists
    return this.matchingService.runMatch(id);
  }

  async approve(id: string, organizationId: string, approverId: string) {
    const invoice = await this.findOne(id, organizationId);
    if (invoice.matchStatus === 'exception') {
      throw new BadRequestException('Cannot approve invoice with unresolved exceptions');
    }
    await this.db.update(invoices)
      .set({ status: 'approved', approvedBy: approverId, approvedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(invoices.id, id), eq(invoices.organizationId, organizationId)));
    const approved = await this.findOne(id, organizationId);
    this.webhookEvents.emit(organizationId, 'invoice.approved', { invoice: approved });
    this.glExport.enqueue(organizationId, id, 'qbo');

    // Auto-track budget spend: resolve department via PO → Requisition
    if ((approved as any).purchaseOrderId) {
      try {
        const po = await this.db.query.purchaseOrders.findFirst({
          where: (p, { eq }) => eq(p.id, (approved as any).purchaseOrderId),
        });
        if (po?.requisitionId) {
          const req = await this.db.query.requisitions.findFirst({
            where: (r, { eq }) => eq(r.id, po.requisitionId!),
          });
          if (req?.departmentId) {
            const fiscalYear = new Date().getFullYear();
            await this.budgets.recordSpend(organizationId, req.departmentId, parseFloat((approved as any).totalAmount ?? '0'), fiscalYear);
          }
        }
      } catch {
        // Budget tracking is best-effort; never fail the approval
      }
    }

    return approved;
  }
}
