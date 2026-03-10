import { pgTable, uuid, varchar, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const vendors = pgTable('vendors', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 255 }).notNull(),
  code: varchar('code', { length: 50 }),
  taxId: varchar('tax_id', { length: 100 }),
  paymentTerms: varchar('payment_terms', { length: 100 }),
  address: jsonb('address').default({}),
  contactInfo: jsonb('contact_info').default({}),
  status: varchar('status', { length: 20 }).notNull().default('active'), // active|inactive|blocked
  punchoutEnabled: boolean('punchout_enabled').notNull().default(false),
  punchoutConfig: jsonb('punchout_config'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const catalogItems = pgTable('catalog_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  sku: varchar('sku', { length: 100 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  category: varchar('category', { length: 100 }),
  unitOfMeasure: varchar('unit_of_measure', { length: 50 }).notNull().default('each'),
  unitPrice: varchar('unit_price', { length: 20 }).notNull().default('0'), // stored as string, use numeric in DB
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  isActive: boolean('is_active').notNull().default(true),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
