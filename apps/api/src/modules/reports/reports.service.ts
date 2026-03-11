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

  async exportBudgets(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        b.name            AS "Budget Name",
        b.budget_type     AS "Type",
        b.fiscal_year     AS "Fiscal Year",
        b.total_amount    AS "Allocated",
        b.spent_amount    AS "Spent",
        (b.total_amount - b.spent_amount)::numeric AS "Remaining",
        ROUND((b.spent_amount / NULLIF(b.total_amount, 0)) * 100, 1) AS "Utilization %",
        b.currency        AS "Currency",
        d.name            AS "Department",
        p.name            AS "Project",
        b.created_at      AS "Created At"
      FROM budgets b
      LEFT JOIN departments d ON d.id = b.department_id
      LEFT JOIN projects    p ON p.id = b.project_id
      WHERE b.organization_id = ${organizationId}
      ORDER BY b.fiscal_year DESC, "Utilization %" DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportDepartmentSpend(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        COALESCE(d.name, 'Unassigned')             AS "Department",
        COUNT(DISTINCT po.id)::int                  AS "PO Count",
        SUM(po.total_amount)::numeric               AS "PO Total",
        COUNT(DISTINCT r.id)::int                   AS "Requisition Count",
        SUM(r.total_amount)::numeric                AS "Req Total"
      FROM departments d
      FULL OUTER JOIN requisitions r ON r.department_id = d.id AND r.organization_id = ${organizationId}
      LEFT JOIN purchase_orders po ON po.requisition_id = r.id
        AND po.status NOT IN ('draft', 'cancelled')
      WHERE d.organization_id = ${organizationId} OR r.organization_id = ${organizationId}
      GROUP BY d.name
      ORDER BY "PO Total" DESC NULLS LAST
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportApAging(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        i.internal_number      AS "Invoice Number",
        i.invoice_number       AS "Vendor Invoice #",
        v.name                 AS "Vendor",
        i.status               AS "Status",
        i.due_date             AS "Due Date",
        i.total_amount         AS "Amount",
        CASE
          WHEN i.due_date IS NULL THEN 'No Due Date'
          WHEN NOW() - i.due_date <= INTERVAL '30 days'  THEN '0-30 days overdue'
          WHEN NOW() - i.due_date <= INTERVAL '60 days'  THEN '31-60 days overdue'
          WHEN NOW() - i.due_date <= INTERVAL '90 days'  THEN '61-90 days overdue'
          ELSE 'Over 90 days overdue'
        END                    AS "Aging Bucket",
        EXTRACT(EPOCH FROM (NOW() - i.due_date))::int / 86400 AS "Days Overdue"
      FROM invoices i
      LEFT JOIN vendors v ON v.id = i.vendor_id
      WHERE i.organization_id = ${organizationId}
        AND i.status NOT IN ('approved', 'paid', 'cancelled')
        AND (i.due_date IS NULL OR i.due_date < NOW())
      ORDER BY i.due_date ASC NULLS LAST
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }

  async exportGrnSummary(organizationId: string): Promise<string> {
    const rows = await this.db.execute(sql`
      SELECT
        gr.grn_number                 AS "GRN Number",
        po.internal_number            AS "PO Number",
        v.name                        AS "Vendor",
        gr.status                     AS "Status",
        gr.received_at                AS "Received At",
        u.name                        AS "Received By",
        COUNT(grl.id)::int            AS "Line Count",
        SUM(grl.quantity_received)::numeric AS "Total Qty Received"
      FROM goods_receipts gr
      JOIN purchase_orders po ON po.id = gr.purchase_order_id
      LEFT JOIN vendors v ON v.id = po.vendor_id
      LEFT JOIN users u ON u.id = gr.received_by
      LEFT JOIN goods_receipt_lines grl ON grl.goods_receipt_id = gr.id
      WHERE gr.organization_id = ${organizationId}
      GROUP BY gr.id, gr.grn_number, po.internal_number, v.name, gr.status, gr.received_at, u.name
      ORDER BY gr.received_at DESC
    `);
    return toCsv(rows as Record<string, unknown>[]);
  }
}
