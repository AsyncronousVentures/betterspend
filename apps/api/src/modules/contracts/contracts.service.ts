import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { contracts, contractLines, contractAmendments } from '@betterspend/db';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ContractsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, filters?: { status?: string; vendorId?: string; type?: string }) {
    const rows = await this.db.query.contracts.findMany({
      where: (c, { and, eq }) => {
        const conditions = [eq(c.organizationId, organizationId)];
        if (filters?.status) conditions.push(eq(c.status, filters.status));
        if (filters?.vendorId) conditions.push(eq(c.vendorId, filters.vendorId));
        if (filters?.type) conditions.push(eq(c.type, filters.type));
        return and(...conditions);
      },
      with: {
        vendor: true,
        owner: true,
      },
      orderBy: (c, { desc }) => desc(c.createdAt),
    });
    return rows;
  }

  async findOne(id: string, organizationId: string) {
    const contract = await this.db.query.contracts.findFirst({
      where: (c, { and, eq }) => and(eq(c.id, id), eq(c.organizationId, organizationId)),
      with: {
        vendor: true,
        owner: true,
        createdByUser: true,
        lines: { orderBy: (l, { asc }) => asc(l.lineNumber) },
        amendments: { orderBy: (a, { desc }) => desc(a.amendmentNumber) },
      },
    });
    if (!contract) throw new NotFoundException(`Contract ${id} not found`);
    return contract;
  }

  async create(data: typeof contracts.$inferInsert) {
    // Auto-generate contract number
    const [{ count }] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(contracts)
      .where(eq(contracts.organizationId, data.organizationId));

    const year = new Date().getFullYear();
    const num = (Number(count) + 1).toString().padStart(4, '0');
    const contractNumber = `CTR-${year}-${num}`;

    const [contract] = await this.db
      .insert(contracts)
      .values({ ...data, contractNumber })
      .returning();

    this.auditService.log(data.organizationId, data.createdBy, 'contract', contract.id, 'created').catch(() => {});

    return this.findOne(contract.id, data.organizationId);
  }

  async update(id: string, organizationId: string, userId: string, data: Partial<typeof contracts.$inferInsert>) {
    const existing = await this.findOne(id, organizationId);

    const [updated] = await this.db
      .update(contracts)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(contracts.id, id), eq(contracts.organizationId, organizationId)))
      .returning();

    if (!updated) throw new NotFoundException(`Contract ${id} not found`);

    this.auditService.log(organizationId, userId, 'contract', id, 'updated').catch(() => {});

    return this.findOne(id, organizationId);
  }

  async activate(id: string, organizationId: string, userId: string) {
    const contract = await this.findOne(id, organizationId);
    if (!['draft', 'pending_approval'].includes(contract.status)) {
      throw new BadRequestException(`Cannot activate a contract in status: ${contract.status}`);
    }
    return this.update(id, organizationId, userId, {
      status: 'active',
      approvedBy: userId,
      approvedAt: new Date(),
    });
  }

  async terminate(id: string, organizationId: string, userId: string, reason: string) {
    const contract = await this.findOne(id, organizationId);
    if (!['active', 'expiring_soon'].includes(contract.status)) {
      throw new BadRequestException(`Cannot terminate a contract in status: ${contract.status}`);
    }
    return this.update(id, organizationId, userId, {
      status: 'terminated',
      terminatedBy: userId,
      terminatedAt: new Date(),
      terminationReason: reason,
    });
  }

  async addLine(contractId: string, organizationId: string, data: typeof contractLines.$inferInsert) {
    await this.findOne(contractId, organizationId); // verify ownership
    const [line] = await this.db.insert(contractLines).values({ ...data, contractId }).returning();
    return line;
  }

  async addAmendment(contractId: string, organizationId: string, userId: string, data: { title: string; description?: string | null; effectiveDate?: Date | null; valueChange?: string | null; newEndDate?: Date | null }) {
    await this.findOne(contractId, organizationId);

    // get next amendment number
    const [{ maxNum }] = await this.db
      .select({ maxNum: sql<number>`coalesce(max(amendment_number), 0)` })
      .from(contractAmendments)
      .where(eq(contractAmendments.contractId, contractId));

    const [amendment] = await this.db
      .insert(contractAmendments)
      .values({ ...data, contractId, createdBy: userId, amendmentNumber: Number(maxNum) + 1 })
      .returning();

    // If there's a value change, update contract total
    if (data.valueChange) {
      const contract = await this.findOne(contractId, organizationId);
      const currentValue = parseFloat(contract.totalValue ?? '0');
      const delta = parseFloat(String(data.valueChange));
      await this.db
        .update(contracts)
        .set({ totalValue: (currentValue + delta).toFixed(2), updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
    }

    // If new end date, update contract
    if (data.newEndDate) {
      await this.db
        .update(contracts)
        .set({ endDate: new Date(data.newEndDate as unknown as string), updatedAt: new Date() })
        .where(eq(contracts.id, contractId));
    }

    return amendment;
  }

  async getExpiringContracts(organizationId: string, daysAhead = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);
    const now = new Date();

    return this.db.query.contracts.findMany({
      where: (c, { and, eq, lte, gt }) =>
        and(
          eq(c.organizationId, organizationId),
          eq(c.status, 'active'),
          lte(c.endDate, cutoff),
          gt(c.endDate, now),
        ),
      with: { vendor: true },
      orderBy: (c, { asc }) => asc(c.endDate),
    });
  }

  async syncExpiringStatus(organizationId: string) {
    const now = new Date();
    const cutoff30 = new Date();
    cutoff30.setDate(cutoff30.getDate() + 30);

    // Mark expired
    await this.db
      .update(contracts)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(
        and(
          eq(contracts.organizationId, organizationId),
          eq(contracts.status, 'active'),
          sql`${contracts.endDate} < ${now}`,
        ),
      );

    // Mark expiring_soon (within 30 days)
    await this.db
      .update(contracts)
      .set({ status: 'expiring_soon', updatedAt: new Date() })
      .where(
        and(
          eq(contracts.organizationId, organizationId),
          eq(contracts.status, 'active'),
          sql`${contracts.endDate} >= ${now}`,
          sql`${contracts.endDate} <= ${cutoff30}`,
        ),
      );
  }
}
