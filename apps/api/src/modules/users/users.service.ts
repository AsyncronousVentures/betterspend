import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { randomUUID, scrypt, randomBytes } from 'crypto';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { users, userRoles, authAccounts } from '@betterspend/db';

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  // Node's scrypt: promisified version takes (password, salt, keylen, callback)
  // Options must be passed via the promisified wrapper differently
  return new Promise((resolve, reject) => {
    scrypt(
      Buffer.from(password.normalize('NFKC')),
      salt,
      64,
      { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 },
      (err, key) => {
        if (err) reject(err);
        else resolve(`${salt}:${key.toString('hex')}`);
      },
    );
  });
}

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

  async create(organizationId: string, data: { name: string; email: string; password: string; role?: string }) {
    const existing = await this.db.query.users.findFirst({ where: eq(users.email, data.email) });
    if (existing) throw new ConflictException(`Email ${data.email} is already in use`);

    const userId = randomUUID();
    const [user] = await this.db.insert(users).values({
      id: userId,
      organizationId,
      email: data.email,
      name: data.name,
      emailVerified: true,
    }).returning();

    const hashed = await hashPassword(data.password);
    await this.db.insert(authAccounts).values({
      id: randomUUID(),
      userId,
      accountId: data.email,
      providerId: 'credential',
      password: hashed,
    });

    if (data.role) {
      await this.db.insert(userRoles).values({ userId, role: data.role, scopeType: 'global' });
    }

    return this.findOne(userId, organizationId);
  }
}
