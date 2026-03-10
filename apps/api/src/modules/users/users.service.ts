import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { users } from '@betterspend/db';

@Injectable()
export class UsersService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string) {
    return this.db.query.users.findMany({
      where: eq(users.organizationId, organizationId),
      with: { userRoles: true },
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
}
