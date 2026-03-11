import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { glMappings } from '@betterspend/db';

export interface CreateGlMappingInput {
  glAccount: string;
  glAccountName?: string;
  targetSystem: 'qbo' | 'xero';
  externalAccountCode: string;
  externalAccountName?: string;
}

export interface UpdateGlMappingInput {
  glAccountName?: string;
  externalAccountCode?: string;
  externalAccountName?: string;
  isActive?: boolean;
}

@Injectable()
export class GlMappingsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string, targetSystem?: string) {
    return this.db.query.glMappings.findMany({
      where: (m, { and, eq }) => {
        const conditions = [eq(m.organizationId, organizationId)];
        if (targetSystem) conditions.push(eq(m.targetSystem, targetSystem));
        return and(...conditions);
      },
      orderBy: (m, { asc }) => [asc(m.targetSystem), asc(m.glAccount)],
    });
  }

  async findOne(id: string, organizationId: string) {
    const mapping = await this.db.query.glMappings.findFirst({
      where: (m, { and, eq }) => and(eq(m.id, id), eq(m.organizationId, organizationId)),
    });
    if (!mapping) throw new NotFoundException(`GL mapping ${id} not found`);
    return mapping;
  }

  async findByGlAccount(organizationId: string, glAccount: string, targetSystem: string) {
    return this.db.query.glMappings.findFirst({
      where: (m, { and, eq }) =>
        and(
          eq(m.organizationId, organizationId),
          eq(m.glAccount, glAccount),
          eq(m.targetSystem, targetSystem),
          eq(m.isActive, true),
        ),
    });
  }

  async create(organizationId: string, input: CreateGlMappingInput) {
    // Enforce unique (org, glAccount, targetSystem)
    const existing = await this.findByGlAccount(organizationId, input.glAccount, input.targetSystem);
    if (existing) {
      throw new ConflictException(
        `A mapping for GL account "${input.glAccount}" in ${input.targetSystem} already exists`,
      );
    }

    const [mapping] = await this.db
      .insert(glMappings)
      .values({
        organizationId,
        glAccount: input.glAccount,
        glAccountName: input.glAccountName ?? null,
        targetSystem: input.targetSystem,
        externalAccountCode: input.externalAccountCode,
        externalAccountName: input.externalAccountName ?? null,
      })
      .returning();
    return mapping;
  }

  async update(id: string, organizationId: string, input: UpdateGlMappingInput) {
    await this.findOne(id, organizationId);
    const [updated] = await this.db
      .update(glMappings)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(glMappings.id, id), eq(glMappings.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.db
      .delete(glMappings)
      .where(and(eq(glMappings.id, id), eq(glMappings.organizationId, organizationId)));
  }
}
