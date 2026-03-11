import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { budgets, budgetPeriods } from '@betterspend/db';

export interface CreateBudgetInput {
  name: string;
  departmentId?: string;
  projectId?: string;
  glAccount?: string;
  fiscalYear: number;
  totalAmount: number;
  currency?: string;
  periods?: Array<{
    periodType?: string;
    periodStart: string;
    periodEnd: string;
    allocatedAmount: number;
  }>;
}

@Injectable()
export class BudgetsService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  async findAll(organizationId: string) {
    return this.db.query.budgets.findMany({
      where: (b, { eq }) => eq(b.organizationId, organizationId),
      with: { periods: true },
      orderBy: (b, { desc }) => desc(b.createdAt),
    });
  }

  async findOne(id: string, organizationId: string) {
    const budget = await this.db.query.budgets.findFirst({
      where: (b, { and, eq }) => and(eq(b.id, id), eq(b.organizationId, organizationId)),
      with: { periods: true },
    });
    if (!budget) throw new NotFoundException(`Budget ${id} not found`);
    return budget;
  }

  async create(organizationId: string, input: CreateBudgetInput) {
    // Determine budgetType and scopeId from input
    let budgetType: string;
    let scopeId: string;

    if (input.departmentId) {
      budgetType = 'department';
      scopeId = input.departmentId;
    } else if (input.projectId) {
      budgetType = 'project';
      scopeId = input.projectId;
    } else if (input.glAccount) {
      budgetType = 'gl_account';
      // For GL accounts we use a deterministic placeholder UUID derived from the string.
      // Since scopeId must be uuid, we store the glAccount string in a separate way.
      // For simplicity, use a nil UUID and rely on the name to identify.
      scopeId = '00000000-0000-0000-0000-000000000000';
    } else {
      budgetType = 'department';
      scopeId = '00000000-0000-0000-0000-000000000000';
    }

    const budgetId = await this.db.transaction(async (tx) => {
      const [budget] = await tx.insert(budgets).values({
        organizationId,
        name: input.name,
        budgetType,
        scopeId,
        fiscalYear: input.fiscalYear,
        periodType: 'annual',
        totalAmount: String(input.totalAmount),
        currency: input.currency ?? 'USD',
      }).returning();

      if (input.periods && input.periods.length > 0) {
        await tx.insert(budgetPeriods).values(
          input.periods.map((p) => ({
            budgetId: budget.id,
            periodStart: new Date(p.periodStart),
            periodEnd: new Date(p.periodEnd),
            amount: String(p.allocatedAmount),
            allocatedAmount: String(p.allocatedAmount),
          })),
        );
      }

      return budget.id;
    });

    return this.findOne(budgetId, organizationId);
  }

  async checkBudget(
    organizationId: string,
    departmentId: string,
    amount: number,
    fiscalYear: number,
  ): Promise<{
    withinBudget: boolean;
    budgetName?: string;
    allocated?: number;
    spent?: number;
    remaining?: number;
    message?: string;
  }> {
    const budget = await this.db.query.budgets.findFirst({
      where: (b, { and, eq }) => and(
        eq(b.organizationId, organizationId),
        eq(b.budgetType, 'department'),
        eq(b.scopeId, departmentId),
        eq(b.fiscalYear, fiscalYear),
      ),
    });

    if (!budget) {
      return { withinBudget: true, message: 'No budget configured' };
    }

    const allocated = parseFloat(String(budget.totalAmount));
    const spent = parseFloat(String(budget.spentAmount));
    const remaining = allocated - spent;

    return {
      withinBudget: amount <= remaining,
      budgetName: budget.name,
      allocated,
      spent,
      remaining,
    };
  }

  async update(
    id: string,
    organizationId: string,
    input: { name?: string; totalAmount?: number; currency?: string },
  ) {
    await this.findOne(id, organizationId);
    await this.db.update(budgets)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.totalAmount !== undefined ? { totalAmount: String(input.totalAmount) } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.organizationId, organizationId)));
    return this.findOne(id, organizationId);
  }

  async recordSpend(
    organizationId: string,
    departmentId: string,
    amount: number,
    fiscalYear: number,
  ) {
    const budget = await this.db.query.budgets.findFirst({
      where: (b, { and, eq }) => and(
        eq(b.organizationId, organizationId),
        eq(b.budgetType, 'department'),
        eq(b.scopeId, departmentId),
        eq(b.fiscalYear, fiscalYear),
      ),
    });

    if (!budget) return { updated: false, message: 'No budget configured' };

    await this.db.update(budgets)
      .set({
        spentAmount: sql`${budgets.spentAmount} + ${String(amount)}`,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, budget.id), eq(budgets.organizationId, organizationId)));

    return { updated: true, budgetId: budget.id };
  }
}
