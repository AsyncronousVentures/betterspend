import { Injectable, Inject } from '@nestjs/common';
import { eq, and, isNull, desc, sql } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { notifications } from '@betterspend/db';

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(DB_TOKEN) private readonly db: Db,
  ) {}

  async create(
    orgId: string,
    userId: string,
    type: string,
    title: string,
    body?: string,
    entityType?: string,
    entityId?: string,
  ) {
    const [notification] = await this.db
      .insert(notifications)
      .values({
        organizationId: orgId,
        userId,
        type,
        title,
        body: body ?? null,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
      })
      .returning();
    return notification;
  }

  async list(
    orgId: string,
    userId: string,
    options?: { unreadOnly?: boolean; limit?: number },
  ) {
    const limit = options?.limit ?? 50;
    const rows = await this.db.query.notifications.findMany({
      where: (n, { and, eq, isNull }) => {
        const conditions = [
          eq(n.organizationId, orgId),
          eq(n.userId, userId),
        ];
        if (options?.unreadOnly) {
          conditions.push(isNull(n.readAt));
        }
        return and(...conditions);
      },
      orderBy: (n, { desc }) => desc(n.createdAt),
      limit,
    });
    return rows;
  }

  async markRead(id: string, userId: string) {
    const [updated] = await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId), isNull(notifications.readAt)))
      .returning();
    return updated;
  }

  async markAllRead(orgId: string, userId: string) {
    await this.db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.organizationId, orgId),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      );
    return { success: true };
  }

  async getUnreadCount(orgId: string, userId: string): Promise<{ count: number }> {
    const result = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.organizationId, orgId),
          eq(notifications.userId, userId),
          isNull(notifications.readAt),
        ),
      );
    return { count: result[0]?.count ?? 0 };
  }
}
