import { pgTable, uuid, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { users } from './users';

export const approvalDelegations = pgTable('approval_delegations', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  delegatorId: uuid('delegator_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  delegateeId: uuid('delegate_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  reason: text('reason'),
  active: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
