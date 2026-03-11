import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { projects } from '@betterspend/db';

export interface CreateProjectInput {
  name: string;
  code: string;
  departmentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectInput {
  name?: string;
  code?: string;
  departmentId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ProjectsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string) {
    return this.db.query.projects.findMany({
      where: (p, { eq }) => eq(p.organizationId, organizationId),
      orderBy: (p, { asc }) => asc(p.name),
    });
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.db.query.projects.findFirst({
      where: (p, { and, eq }) => and(eq(p.id, id), eq(p.organizationId, organizationId)),
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  async create(organizationId: string, input: CreateProjectInput) {
    const existing = await this.db.query.projects.findFirst({
      where: (p, { and, eq }) => and(eq(p.organizationId, organizationId), eq(p.code, input.code)),
    });
    if (existing) throw new ConflictException(`Project code "${input.code}" already exists`);

    const [project] = await this.db
      .insert(projects)
      .values({
        organizationId,
        name: input.name,
        code: input.code,
        departmentId: input.departmentId ?? null,
        status: input.status ?? 'active',
        startDate: input.startDate ? new Date(input.startDate) : null,
        endDate: input.endDate ? new Date(input.endDate) : null,
      })
      .returning();
    return project;
  }

  async update(id: string, organizationId: string, input: UpdateProjectInput) {
    await this.findOne(id, organizationId);
    const [updated] = await this.db
      .update(projects)
      .set({
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)))
      .returning();
    return updated;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.organizationId, organizationId)));
  }
}
