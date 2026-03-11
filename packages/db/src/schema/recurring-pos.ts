import { pgTable, uuid, varchar, text, numeric, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';
import { vendors } from './vendors';

export const recurringPos = pgTable('recurring_pos', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  frequency: varchar('frequency', { length: 30 }).notNull(), // weekly | monthly | quarterly | annually
  dayOfMonth: integer('day_of_month'), // 1-28 for monthly/quarterly/annually
  nextRunAt: timestamp('next_run_at', { withTimezone: true }).notNull(),
  lastRunAt: timestamp('last_run_at', { withTimezone: true }),
  active: boolean('active').notNull().default(true),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  lines: jsonb('lines').notNull().default([]), // array of { description, quantity, unitPrice, unitOfMeasure }
  glAccount: varchar('gl_account', { length: 50 }),
  notes: text('notes'),
  runCount: integer('run_count').notNull().default(0),
  maxRuns: integer('max_runs'), // null = unlimited
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
