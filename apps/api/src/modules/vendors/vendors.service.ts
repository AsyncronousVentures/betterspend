import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { vendors } from '@betterspend/db';

@Injectable()
export class VendorsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string) {
    return this.db.query.vendors.findMany({
      where: eq(vendors.organizationId, organizationId),
      orderBy: (v, { asc }) => asc(v.name),
    });
  }

  async findOne(id: string, organizationId: string) {
    const vendor = await this.db.query.vendors.findFirst({
      where: (v, { and, eq }) =>
        and(eq(v.id, id), eq(v.organizationId, organizationId)),
    });

    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }

  async create(data: typeof vendors.$inferInsert) {
    const [vendor] = await this.db.insert(vendors).values(data).returning();
    return vendor;
  }

  async update(id: string, organizationId: string, data: Partial<typeof vendors.$inferInsert>) {
    const [vendor] = await this.db
      .update(vendors)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vendors.id, id))
      .returning();

    if (!vendor) throw new NotFoundException(`Vendor ${id} not found`);
    return vendor;
  }
}
