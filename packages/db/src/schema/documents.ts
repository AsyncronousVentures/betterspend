import { pgTable, uuid, varchar, bigint, timestamp } from 'drizzle-orm/pg-core';

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  uploadedBy: uuid('uploaded_by').notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
