import { pgTable, uuid, varchar, text, numeric, integer, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { vendors } from './vendors';

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  // Type: msa | sow | nda | sla | purchase_agreement | framework | other
  type: varchar('type', { length: 50 }).notNull().default('purchase_agreement'),
  // Status: draft | pending_approval | active | expiring_soon | expired | terminated | cancelled
  status: varchar('status', { length: 30 }).notNull().default('draft'),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  ownerId: uuid('owner_id').references(() => users.id),
  startDate: timestamp('start_date', { withTimezone: true }),
  endDate: timestamp('end_date', { withTimezone: true }),
  totalValue: numeric('total_value', { precision: 14, scale: 2 }),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  // Renewal settings
  autoRenew: boolean('auto_renew').notNull().default(false),
  renewalNoticeDays: integer('renewal_notice_days').notNull().default(30),
  renewalTermMonths: integer('renewal_term_months'),
  // Terms and notes
  terms: text('terms'),
  internalNotes: text('internal_notes'),
  // Approval tracking
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  terminatedBy: uuid('terminated_by').references(() => users.id),
  terminatedAt: timestamp('terminated_at', { withTimezone: true }),
  terminationReason: text('termination_reason'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contractLines = pgTable('contract_lines', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  lineNumber: integer('line_number').notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }),
  unitPrice: numeric('unit_price', { precision: 14, scale: 2 }),
  totalPrice: numeric('total_price', { precision: 14, scale: 2 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contractAmendments = pgTable('contract_amendments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id),
  amendmentNumber: integer('amendment_number').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  effectiveDate: timestamp('effective_date', { withTimezone: true }),
  valueChange: numeric('value_change', { precision: 14, scale: 2 }),
  newEndDate: timestamp('new_end_date', { withTimezone: true }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
