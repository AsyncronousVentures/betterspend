import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import {
  rfqRequests, rfqLines, rfqInvitations, rfqResponses, rfqResponseLines,
  vendors, users, sequences,
} from '@betterspend/db';

@Injectable()
export class RfqService {
  constructor(@Inject(DB_TOKEN) private db: Db) {}

  private async nextNumber(orgId: string): Promise<string> {
    const year = new Date().getFullYear();
    const rows = await this.db
      .update(sequences)
      .set({ lastValue: sql`${sequences.lastValue} + 1`, updatedAt: new Date() })
      .where(and(eq(sequences.organizationId, orgId), eq(sequences.entityType, 'rfq'), eq(sequences.year, year)))
      .returning();
    if (!rows.length) {
      await this.db.insert(sequences).values({
        organizationId: orgId,
        entityType: 'rfq',
        year,
        lastValue: 1,
      });
      return `RFQ-${year}-0001`;
    }
    return `RFQ-${year}-${String(rows[0].lastValue).padStart(4, '0')}`;
  }

  async list(orgId: string) {
    const rows = await this.db
      .select({
        rfq: rfqRequests,
        requester: { id: users.id, name: users.name, email: users.email },
        awardedVendor: { id: vendors.id, name: vendors.name },
      })
      .from(rfqRequests)
      .leftJoin(users, eq(rfqRequests.requesterId, users.id))
      .leftJoin(vendors, eq(rfqRequests.awardedVendorId, vendors.id))
      .where(eq(rfqRequests.organizationId, orgId))
      .orderBy(desc(rfqRequests.createdAt));

    // Attach invitation/response counts
    const rfqIds = rows.map((r) => r.rfq.id);
    if (!rfqIds.length) return [];

    const invCounts = await this.db
      .select({ rfqId: rfqInvitations.rfqId, count: sql<number>`COUNT(*)` })
      .from(rfqInvitations)
      .where(inArray(rfqInvitations.rfqId, rfqIds))
      .groupBy(rfqInvitations.rfqId);

    const resCounts = await this.db
      .select({ rfqId: rfqResponses.rfqId, count: sql<number>`COUNT(*)` })
      .from(rfqResponses)
      .where(inArray(rfqResponses.rfqId, rfqIds))
      .groupBy(rfqResponses.rfqId);

    const invMap = Object.fromEntries(invCounts.map((r) => [r.rfqId, Number(r.count)]));
    const resMap = Object.fromEntries(resCounts.map((r) => [r.rfqId, Number(r.count)]));

    return rows.map((r) => ({
      ...r.rfq,
      requester: r.requester,
      awardedVendor: r.awardedVendor,
      invitationCount: invMap[r.rfq.id] ?? 0,
      responseCount: resMap[r.rfq.id] ?? 0,
    }));
  }

  async findOne(orgId: string, id: string) {
    const [row] = await this.db
      .select({
        rfq: rfqRequests,
        requester: { id: users.id, name: users.name, email: users.email },
        awardedVendor: { id: vendors.id, name: vendors.name },
      })
      .from(rfqRequests)
      .leftJoin(users, eq(rfqRequests.requesterId, users.id))
      .leftJoin(vendors, eq(rfqRequests.awardedVendorId, vendors.id))
      .where(and(eq(rfqRequests.organizationId, orgId), eq(rfqRequests.id, id)));

    if (!row) throw new NotFoundException('RFQ not found');

    const lines = await this.db
      .select()
      .from(rfqLines)
      .where(eq(rfqLines.rfqId, id))
      .orderBy(rfqLines.lineNumber);

    const invitations = await this.db
      .select({ inv: rfqInvitations, vendor: { id: vendors.id, name: vendors.name } })
      .from(rfqInvitations)
      .leftJoin(vendors, eq(rfqInvitations.vendorId, vendors.id))
      .where(eq(rfqInvitations.rfqId, id));

    const responses = await this.db
      .select({ res: rfqResponses, vendor: { id: vendors.id, name: vendors.name } })
      .from(rfqResponses)
      .leftJoin(vendors, eq(rfqResponses.vendorId, vendors.id))
      .where(eq(rfqResponses.rfqId, id))
      .orderBy(rfqResponses.totalAmount);

    return {
      ...row.rfq,
      requester: row.requester,
      awardedVendor: row.awardedVendor,
      lines,
      invitations: invitations.map((i) => ({ ...i.inv, vendor: i.vendor })),
      responses: responses.map((r) => ({ ...r.res, vendor: r.vendor })),
    };
  }

  async create(orgId: string, userId: string, dto: {
    title: string;
    description?: string;
    dueDate?: string;
    currency?: string;
    notes?: string;
    lines: Array<{ description: string; quantity: number; unitOfMeasure?: string; targetPrice?: number }>;
    vendorIds?: string[];
  }) {
    const number = await this.nextNumber(orgId);

    const [rfq] = await this.db
      .insert(rfqRequests)
      .values({
        organizationId: orgId,
        requesterId: userId,
        number,
        title: dto.title,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        currency: dto.currency ?? 'USD',
        notes: dto.notes,
      })
      .returning();

    if (dto.lines?.length) {
      await this.db.insert(rfqLines).values(
        dto.lines.map((l, i) => ({
          rfqId: rfq.id,
          lineNumber: i + 1,
          description: l.description,
          quantity: String(l.quantity),
          unitOfMeasure: l.unitOfMeasure ?? 'each',
          targetPrice: l.targetPrice != null ? String(l.targetPrice) : undefined,
        })),
      );
    }

    if (dto.vendorIds?.length) {
      await this.db.insert(rfqInvitations).values(
        dto.vendorIds.map((vendorId) => ({ rfqId: rfq.id, vendorId })),
      );
    }

    return this.findOne(orgId, rfq.id);
  }

  async update(orgId: string, id: string, dto: {
    title?: string;
    description?: string;
    dueDate?: string;
    notes?: string;
    status?: string;
  }) {
    const [rfq] = await this.db
      .update(rfqRequests)
      .set({
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.status && { status: dto.status }),
        updatedAt: new Date(),
      })
      .where(and(eq(rfqRequests.organizationId, orgId), eq(rfqRequests.id, id)))
      .returning();

    if (!rfq) throw new NotFoundException('RFQ not found');
    return rfq;
  }

  async open(orgId: string, id: string) {
    const rfq = await this.findOne(orgId, id);
    if (rfq.status !== 'draft') throw new BadRequestException('Only draft RFQs can be opened');
    return this.update(orgId, id, { status: 'open' });
  }

  async close(orgId: string, id: string) {
    const rfq = await this.findOne(orgId, id);
    if (rfq.status !== 'open') throw new BadRequestException('Only open RFQs can be closed');
    return this.update(orgId, id, { status: 'closed' });
  }

  async award(orgId: string, id: string, responseId: string) {
    const rfq = await this.findOne(orgId, id);
    if (!['closed', 'open'].includes(rfq.status)) {
      throw new BadRequestException('RFQ must be open or closed to award');
    }

    const [response] = await this.db
      .select()
      .from(rfqResponses)
      .where(and(eq(rfqResponses.id, responseId), eq(rfqResponses.rfqId, id)));

    if (!response) throw new NotFoundException('Response not found');

    await this.db
      .update(rfqResponses)
      .set({ awarded: false })
      .where(eq(rfqResponses.rfqId, id));

    await this.db
      .update(rfqResponses)
      .set({ awarded: true, status: 'accepted' })
      .where(eq(rfqResponses.id, responseId));

    await this.db
      .update(rfqRequests)
      .set({ status: 'awarded', awardedVendorId: response.vendorId, updatedAt: new Date() })
      .where(eq(rfqRequests.id, id));

    return this.findOne(orgId, id);
  }

  async submitResponse(orgId: string, rfqId: string, dto: {
    vendorId: string;
    notes?: string;
    validUntil?: string;
    lines: Array<{ rfqLineId: string; unitPrice: number; leadTimeDays?: number; notes?: string }>;
  }) {
    const rfq = await this.findOne(orgId, rfqId);
    if (rfq.status !== 'open') throw new BadRequestException('RFQ is not open for responses');

    const totalAmount = dto.lines.reduce((sum, l) => sum + l.unitPrice, 0);

    const [response] = await this.db
      .insert(rfqResponses)
      .values({
        rfqId,
        vendorId: dto.vendorId,
        totalAmount: String(totalAmount),
        notes: dto.notes,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      })
      .returning();

    // Get rfq lines to compute total price
    const rfqLinesList = await this.db
      .select()
      .from(rfqLines)
      .where(eq(rfqLines.rfqId, rfqId));
    const lineMap = Object.fromEntries(rfqLinesList.map((l) => [l.id, l]));

    if (dto.lines.length) {
      await this.db.insert(rfqResponseLines).values(
        dto.lines.map((l) => {
          const rfqLine = lineMap[l.rfqLineId];
          const qty = rfqLine ? Number(rfqLine.quantity) : 1;
          return {
            responseId: response.id,
            rfqLineId: l.rfqLineId,
            unitPrice: String(l.unitPrice),
            totalPrice: String(l.unitPrice * qty),
            leadTimeDays: l.leadTimeDays,
            notes: l.notes,
          };
        }),
      );
    }

    // Update invitation respondedAt
    await this.db
      .update(rfqInvitations)
      .set({ respondedAt: new Date() })
      .where(and(eq(rfqInvitations.rfqId, rfqId), eq(rfqInvitations.vendorId, dto.vendorId)));

    return response;
  }
}
