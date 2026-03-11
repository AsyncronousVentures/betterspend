import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
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

  async getTransactions(id: string, organizationId: string) {
    await this.findOne(id, organizationId);

    const [invoiceRows, poRows] = await Promise.all([
      this.db.execute(sql`
        SELECT
          i.id, i.internal_number AS number, i.invoice_number AS "vendorInvoiceNumber",
          i.status, i.match_status AS "matchStatus", i.total_amount::numeric AS amount,
          i.invoice_date AS date, i.approved_at AS "approvedAt"
        FROM invoices i
        WHERE i.vendor_id = ${id} AND i.organization_id = ${organizationId}
        ORDER BY i.created_at DESC
        LIMIT 50
      `),
      this.db.execute(sql`
        SELECT
          po.id, po.internal_number AS number, po.status,
          po.total_amount::numeric AS amount, po.issued_at AS "issuedAt", po.created_at AS date
        FROM purchase_orders po
        WHERE po.vendor_id = ${id} AND po.organization_id = ${organizationId}
        ORDER BY po.created_at DESC
        LIMIT 50
      `),
    ]);

    return { invoices: invoiceRows, purchaseOrders: poRows };
  }
}
