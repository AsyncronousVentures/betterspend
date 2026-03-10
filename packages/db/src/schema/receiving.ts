import { pgTable, uuid, varchar, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { purchaseOrders, poLines } from './purchase-orders';

export const goodsReceipts = pgTable('goods_receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  purchaseOrderId: uuid('purchase_order_id').notNull().references(() => purchaseOrders.id),
  number: varchar('number', { length: 50 }).notNull().unique(),
  receivedBy: uuid('received_by').notNull().references(() => users.id),
  receivedDate: timestamp('received_date', { withTimezone: true }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('draft'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const goodsReceiptLines = pgTable('goods_receipt_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  goodsReceiptId: uuid('goods_receipt_id').notNull().references(() => goodsReceipts.id),
  poLineId: uuid('po_line_id').notNull().references(() => poLines.id),
  quantityReceived: numeric('quantity_received', { precision: 10, scale: 2 }).notNull(),
  quantityRejected: numeric('quantity_rejected', { precision: 10, scale: 2 }).notNull().default('0'),
  rejectionReason: text('rejection_reason'),
  storageLocation: varchar('storage_location', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
