import { Injectable, Inject } from '@nestjs/common';
import { sql, eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { purchaseOrders, invoices, requisitions } from '@betterspend/db';

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ];
  return lines.join('\n');
}

@Injectable()
export class ReportsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async exportPOs(organizationId: string, status?: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        po.internal_number AS "PO Number",
        v.name             AS "Vendor",
        po.status          AS "Status",
        po.currency        AS "Currency",
        po.total_amount    AS "Total Amount",
        po.issued_at       AS "Issued At",
        po.created_at      AS "Created At"
      FROM purchase_orders po
      LEFT JOIN vendors v ON v.id = po.vendor_id
      WHERE po.organization_id = ${organizationId}
        ${status ? sql`AND po.status = ${status}` : sql``}
      ORDER BY po.created_at DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportInvoices(organizationId: string, status?: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        i.internal_number  AS "Invoice Number",
        i.invoice_number   AS "Vendor Invoice #",
        v.name             AS "Vendor",
        po.internal_number AS "PO Number",
        i.status           AS "Status",
        i.match_status     AS "Match Status",
        i.currency         AS "Currency",
        i.total_amount     AS "Total Amount",
        i.invoice_date     AS "Invoice Date",
        i.due_date         AS "Due Date",
        i.approved_at      AS "Approved At",
        i.created_at       AS "Created At"
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      LEFT JOIN purchase_orders po ON po.id = i.purchase_order_id
      WHERE i.organization_id = ${organizationId}
        ${status ? sql`AND i.status = ${status}` : sql``}
      ORDER BY i.created_at DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportRequisitions(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        r.internal_number AS "REQ Number",
        r.title           AS "Title",
        r.status          AS "Status",
        r.priority        AS "Priority",
        r.currency        AS "Currency",
        r.total_amount    AS "Total Amount",
        d.name            AS "Department",
        r.created_at      AS "Created At"
      FROM requisitions r
      LEFT JOIN departments d ON d.id = r.department_id
      WHERE r.organization_id = ${organizationId}
      ORDER BY r.created_at DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportSpendSummary(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        v.name             AS "Vendor",
        v.code             AS "Vendor Code",
        COUNT(DISTINCT i.id)::int AS "Invoice Count",
        SUM(i.total_amount)::numeric AS "Total Spend",
        MIN(i.invoice_date) AS "First Invoice",
        MAX(i.invoice_date) AS "Last Invoice"
      FROM invoices i
      JOIN vendors v ON v.id = i.vendor_id
      WHERE i.organization_id = ${organizationId}
        AND i.status = 'approved'
      GROUP BY v.id, v.name, v.code
      ORDER BY "Total Spend" DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }
}
