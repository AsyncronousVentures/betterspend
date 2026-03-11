import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import { SequenceService } from '../../common/services/sequence.service';
import { WebhookEventService } from '../webhooks/webhook-event.service';
import type { Db } from '@betterspend/db';
import { purchaseOrders, poLines, poVersions, requisitions } from '@betterspend/db';
import { z } from 'zod';

const createPoSchema = z.object({
  vendorId: z.string().uuid(),
  requisitionId: z.string().uuid().optional(),
  paymentTerms: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  notes: z.string().optional(),
  poType: z.enum(['standard', 'blanket']).default('standard'),
  shippingAddress: z.record(z.unknown()).optional(),
  billingAddress: z.record(z.unknown()).optional(),
  // Blanket PO fields
  blanketStartDate: z.string().datetime().optional(),
  blanketEndDate: z.string().datetime().optional(),
  blanketTotalLimit: z.number().optional(),
  lines: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitOfMeasure: z.string().default('each'),
    unitPrice: z.number().nonnegative(),
    glAccount: z.string().optional(),
    catalogItemId: z.string().uuid().optional(),
    requisitionLineId: z.string().uuid().optional(),
  })).min(1),
});

const changeOrderSchema = z.object({
  changeReason: z.string().min(1),
  lines: z.array(z.object({
    id: z.string().uuid().optional(), // existing line ID to update
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitOfMeasure: z.string().default('each'),
    unitPrice: z.number().nonnegative(),
    glAccount: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
  paymentTerms: z.string().optional(),
});

export type CreatePoInput = z.infer<typeof createPoSchema>;
export type ChangeOrderInput = z.infer<typeof changeOrderSchema>;
export { createPoSchema, changeOrderSchema };

@Injectable()
export class PurchaseOrdersService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly sequenceService: SequenceService,
    private readonly webhookEvents: WebhookEventService,
  ) {}

  async findAll(organizationId: string, filters?: { status?: string; vendorId?: string }) {
    return this.db.query.purchaseOrders.findMany({
      where: (po, { and, eq }) => {
        const conditions = [eq(po.organizationId, organizationId)];
        if (filters?.status) conditions.push(eq(po.status, filters.status));
        if (filters?.vendorId) conditions.push(eq(po.vendorId, filters.vendorId));
        return and(...conditions);
      },
      with: { vendor: true, lines: true },
      orderBy: (po, { desc }) => desc(po.createdAt),
    });
  }

  async findOne(id: string, organizationId: string) {
    const po = await this.db.query.purchaseOrders.findFirst({
      where: (po, { and, eq }) => and(eq(po.id, id), eq(po.organizationId, organizationId)),
      with: { vendor: true, lines: true, versions: true },
    });
    if (!po) throw new NotFoundException(`Purchase Order ${id} not found`);
    return po;
  }

  async create(organizationId: string, issuedBy: string, input: CreatePoInput) {
    const number = await this.sequenceService.next(organizationId, 'purchase_order');

    const createdId = await this.db.transaction(async (tx) => {
      const subtotal = input.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);

      const [po] = await tx.insert(purchaseOrders).values({
        organizationId,
        vendorId: input.vendorId,
        requisitionId: input.requisitionId,
        number,
        version: 1,
        poType: input.poType ?? 'standard',
        status: 'draft',
        paymentTerms: input.paymentTerms,
        currency: input.currency ?? 'USD',
        notes: input.notes,
        shippingAddress: input.shippingAddress ?? {},
        billingAddress: input.billingAddress ?? {},
        subtotal: String(subtotal),
        taxAmount: '0',
        totalAmount: String(subtotal),
        blanketStartDate: input.blanketStartDate ? new Date(input.blanketStartDate) : null,
        blanketEndDate: input.blanketEndDate ? new Date(input.blanketEndDate) : null,
        blanketTotalLimit: input.blanketTotalLimit ? String(input.blanketTotalLimit) : null,
      }).returning();

      await tx.insert(poLines).values(
        input.lines.map((l, i) => ({
          purchaseOrderId: po.id,
          lineNumber: i + 1,
          description: l.description,
          quantity: String(l.quantity),
          unitOfMeasure: l.unitOfMeasure,
          unitPrice: String(l.unitPrice),
          totalPrice: String(l.quantity * l.unitPrice),
          glAccount: l.glAccount,
          catalogItemId: l.catalogItemId,
          requisitionLineId: l.requisitionLineId,
        })),
      );

      // If created from a requisition, mark it as converted
      if (input.requisitionId) {
        await tx.update(requisitions)
          .set({ status: 'converted', updatedAt: new Date() })
          .where(eq(requisitions.id, input.requisitionId));
      }

      return po.id;
    });

    return this.findOne(createdId, organizationId);
  }

  async issue(id: string, organizationId: string, issuedBy: string) {
    const po = await this.findOne(id, organizationId);
    if (!['draft', 'approved'].includes(po.status)) {
      throw new BadRequestException(`Cannot issue a PO with status "${po.status}"`);
    }

    const [updated] = await this.db.update(purchaseOrders)
      .set({ status: 'issued', issuedBy, issuedAt: new Date(), updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    this.webhookEvents.emit(organizationId, 'po.issued', { purchaseOrder: updated });
    return updated;
  }

  async createChangeOrder(id: string, organizationId: string, changedBy: string, input: ChangeOrderInput) {
    const po = await this.findOne(id, organizationId);

    if (['closed', 'cancelled'].includes(po.status)) {
      throw new BadRequestException(`Cannot create change order for ${po.status} PO`);
    }

    return this.db.transaction(async (tx) => {
      // Snapshot current state before modifying
      await tx.insert(poVersions).values({
        purchaseOrderId: id,
        version: po.version,
        changeReason: input.changeReason,
        changedBy,
        snapshot: { po, lines: po.lines } as any,
        diffSummary: {
          previousVersion: po.version,
          notes: input.notes,
          linesChanged: !!input.lines,
        } as any,
      });

      const newVersion = po.version + 1;

      if (input.lines) {
        await tx.delete(poLines).where(eq(poLines.purchaseOrderId, id));
        const subtotal = input.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
        await tx.insert(poLines).values(
          input.lines.map((l, i) => ({
            purchaseOrderId: id,
            lineNumber: i + 1,
            description: l.description,
            quantity: String(l.quantity),
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: String(l.unitPrice),
            totalPrice: String(l.quantity * l.unitPrice),
            glAccount: l.glAccount,
          })),
        );

        const subtotalStr = String(subtotal);
        await tx.update(purchaseOrders).set({
          version: newVersion,
          notes: input.notes ?? po.notes,
          paymentTerms: input.paymentTerms ?? po.paymentTerms,
          subtotal: subtotalStr,
          totalAmount: subtotalStr,
          status: 'draft', // Change orders reset to draft for re-approval
          updatedAt: new Date(),
        }).where(eq(purchaseOrders.id, id));
      } else {
        await tx.update(purchaseOrders).set({
          version: newVersion,
          notes: input.notes ?? po.notes,
          paymentTerms: input.paymentTerms ?? po.paymentTerms,
          status: 'draft',
          updatedAt: new Date(),
        }).where(eq(purchaseOrders.id, id));
      }

    });

    return this.findOne(id, organizationId);
  }

  async cancel(id: string, organizationId: string) {
    const po = await this.findOne(id, organizationId);
    if (['closed', 'cancelled', 'received', 'invoiced'].includes(po.status)) {
      throw new BadRequestException(`Cannot cancel a ${po.status} PO`);
    }
    const [updated] = await this.db.update(purchaseOrders)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(purchaseOrders.id, id))
      .returning();
    return updated;
  }

  async getVersionHistory(id: string, organizationId: string) {
    await this.findOne(id, organizationId); // verify exists + org access
    return this.db.query.poVersions.findMany({
      where: eq(poVersions.purchaseOrderId, id),
      orderBy: (v, { asc }) => asc(v.version),
    });
  }
}
