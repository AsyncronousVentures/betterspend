import { Injectable, Inject } from '@nestjs/common';
import { ilike, or, eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { requisitions, purchaseOrders, invoices, vendors, catalogItems } from '@betterspend/db';

@Injectable()
export class SearchService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async search(query: string, organizationId: string, limit = 20) {
    const q = `%${query}%`;

    const [reqs, pos, invs, vens, cats] = await Promise.all([
      this.db.query.requisitions.findMany({
        where: (r, { and, eq: eqFn, ilike: ilikeFn }) =>
          and(eqFn(r.organizationId, organizationId), or(ilikeFn(r.title, q), ilikeFn(r.number, q))),
        columns: { id: true, number: true, title: true, status: true, totalAmount: true, currency: true, createdAt: true },
        limit,
      }),
      this.db.query.purchaseOrders.findMany({
        where: (r, { and, eq: eqFn, ilike: ilikeFn }) =>
          and(eqFn(r.organizationId, organizationId), or(ilikeFn(r.number, q), ilikeFn(r.notes, q))),
        columns: { id: true, number: true, status: true, totalAmount: true, currency: true, createdAt: true },
        limit,
      }),
      this.db.query.invoices.findMany({
        where: (r, { and, eq: eqFn, ilike: ilikeFn }) =>
          and(eqFn(r.organizationId, organizationId), or(ilikeFn(r.invoiceNumber, q), ilikeFn(r.internalNumber, q))),
        columns: { id: true, internalNumber: true, invoiceNumber: true, status: true, totalAmount: true, currency: true, createdAt: true },
        limit,
      }),
      this.db.query.vendors.findMany({
        where: (r, { and, eq: eqFn, ilike: ilikeFn }) =>
          and(eqFn(r.organizationId, organizationId), or(ilikeFn(r.name, q), ilikeFn(r.code, q))),
        columns: { id: true, name: true, code: true, status: true },
        limit,
      }),
      this.db.query.catalogItems.findMany({
        where: (r, { and, eq: eqFn, ilike: ilikeFn }) =>
          and(eqFn(r.organizationId, organizationId), or(ilikeFn(r.name, q), ilikeFn(r.sku, q), ilikeFn(r.description, q))),
        columns: { id: true, name: true, sku: true, category: true, unitPrice: true, currency: true },
        limit,
      }),
    ]);

    return {
      requisitions: reqs.map((r) => ({ ...r, _type: 'requisition', _label: `${r.number} — ${r.title}`, _href: `/requisitions/${r.id}` })),
      purchaseOrders: pos.map((r) => ({ ...r, _type: 'purchase_order', _label: r.number, _href: `/purchase-orders/${r.id}` })),
      invoices: invs.map((r) => ({ ...r, _type: 'invoice', _label: `${r.internalNumber} / ${r.invoiceNumber}`, _href: `/invoices/${r.id}` })),
      vendors: vens.map((r) => ({ ...r, _type: 'vendor', _label: r.name, _href: `/vendors/${r.id}` })),
      catalogItems: cats.map((r) => ({ ...r, _type: 'catalog_item', _label: r.name, _href: `/catalog/${r.id}` })),
    };
  }
}
