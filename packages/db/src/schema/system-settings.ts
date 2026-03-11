import { pgTable, uuid, varchar, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const systemSettings = pgTable('system_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  key: varchar('key', { length: 100 }).notNull(),
  value: text('value'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueOrgKey: unique('system_settings_org_key').on(table.organizationId, table.key),
}));
