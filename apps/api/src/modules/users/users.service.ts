import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { users, userRoles } from '@betterspend/db';

@Injectable()
export class UsersService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string) {
    return this.db.query.users.findMany({
      where: eq(users.organizationId, organizationId),
      with: { userRoles: true },
      orderBy: (u, { asc }) => asc(u.name),
    });
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.db.query.users.findFirst({
      where: (u, { and, eq }) =>
        and(eq(u.id, id), eq(u.organizationId, organizationId)),
      with: { userRoles: true },
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(
    id: string,
    organizationId: string,
    data: { name?: string; departmentId?: string; isActive?: boolean },
  ) {
    await this.findOne(id, organizationId);
    const [updated] = await this.db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(users.id, id), eq(users.organizationId, organizationId)))
      .returning();
    return this.findOne(updated.id, organizationId);
  }

  async addRole(
    userId: string,
    organizationId: string,
    data: { role: string; scopeType?: string; scopeId?: string },
  ) {
    await this.findOne(userId, organizationId);
    const [role] = await this.db
      .insert(userRoles)
      .values({
        userId,
        role: data.role,
        scopeType: data.scopeType ?? 'global',
        scopeId: data.scopeId ?? null,
      })
      .returning();
    return role;
  }

  async removeRole(userId: string, roleId: string, organizationId: string) {
    await this.findOne(userId, organizationId);
    await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.id, roleId), eq(userRoles.userId, userId)));
  }
}
