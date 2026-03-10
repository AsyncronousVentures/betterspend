import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const sequences = pgTable('sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // requisition|purchase_order|grn|invoice
  year: integer('year').notNull(),
  lastValue: integer('last_value').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
