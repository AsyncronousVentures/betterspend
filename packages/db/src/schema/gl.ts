import { pgTable, uuid, varchar, text, boolean, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { invoices } from './invoices';

// Maps internal GL account codes to external accounting system account codes
export const glMappings = pgTable('gl_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  glAccount: varchar('gl_account', { length: 100 }).notNull(),
  glAccountName: varchar('gl_account_name', { length: 255 }),
  targetSystem: varchar('target_system', { length: 20 }).notNull(), // 'qbo' | 'xero'
  externalAccountCode: varchar('external_account_code', { length: 100 }).notNull(),
  externalAccountName: varchar('external_account_name', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Records each GL export attempt for an approved invoice
export const glExportJobs = pgTable('gl_export_jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id),
  targetSystem: varchar('target_system', { length: 20 }).notNull(), // 'qbo' | 'xero'
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending | exported | failed | skipped
  attempts: integer('attempts').notNull().default(0),
  exportedAt: timestamp('exported_at', { withTimezone: true }),
  errorMessage: text('error_message'),
  payload: jsonb('payload'),     // the mapped GL lines sent to the external system
  externalId: varchar('external_id', { length: 255 }), // bill/transaction ID returned by target system
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
