import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DB_TOKEN } from '../../database/database.module';
import type { Db } from '@betterspend/db';
import { approvalRules, approvalRuleSteps, approvalRequests, approvalActions, requisitions, purchaseOrders } from '@betterspend/db';

@Injectable()
export class ApprovalEngineService {
  constructor(@Inject(DB_TOKEN) private readonly db: Db) {}

  // Evaluate a JSONB condition expression against an entity object
  evaluateCondition(condition: any, entity: Record<string, any>): boolean {
    if (!condition) return true;

    if (condition.operator === 'AND') {
      return condition.conditions.every((c: any) => this.evaluateCondition(c, entity));
    }
    if (condition.operator === 'OR') {
      return condition.conditions.some((c: any) => this.evaluateCondition(c, entity));
    }

    const fieldValue = parseFloat(entity[condition.field]) || entity[condition.field];
    const condValue = condition.value;

    switch (condition.operator) {
      case '>=': return Number(fieldValue) >= Number(condValue);
      case '>':  return Number(fieldValue) > Number(condValue);
      case '<=': return Number(fieldValue) <= Number(condValue);
      case '<':  return Number(fieldValue) < Number(condValue);
      case '==':
      case 'eq': return String(fieldValue) === String(condValue);
      case '!=':
      case 'neq': return String(fieldValue) !== String(condValue);
      default: return false;
    }
  }

  // Find the first matching rule for an entity
  async findMatchingRule(organizationId: string, entityType: string, entity: Record<string, any>) {
    const rules = await this.db.query.approvalRules.findMany({
      where: (r, { and, eq }) => and(
        eq(r.organizationId, organizationId),
        eq(r.isActive, true),
      ),
      with: { steps: true },
      orderBy: (r, { asc }) => asc(r.priority),
    });

    for (const rule of rules) {
      let conditions: any = {};
      try {
        conditions = typeof rule.conditions === 'string'
          ? JSON.parse(rule.conditions)
          : rule.conditions;
      } catch {
        conditions = {};
      }
      if (this.evaluateCondition(conditions, entity)) {
        return rule;
      }
    }
    return null;
  }

  // Initiate approval flow for a submitted entity
  async initiateApproval(
    organizationId: string,
    entityType: 'requisition' | 'purchase_order',
    entityId: string,
    initiatedBy: string,
  ) {
    // Fetch entity for condition evaluation
    let entity: Record<string, any> | null = null;
    if (entityType === 'requisition') {
      entity = await this.db.query.requisitions.findFirst({
        where: (r, { eq }) => eq(r.id, entityId),
      }) ?? null;
    } else {
      entity = await this.db.query.purchaseOrders.findFirst({
        where: (p, { eq }) => eq(p.id, entityId),
      }) ?? null;
    }
    if (!entity) throw new NotFoundException(`Entity ${entityId} not found`);

    const rule = await this.findMatchingRule(organizationId, entityType, entity);

    if (!rule || !rule.steps || rule.steps.length === 0) {
      // No matching rule → auto-approve
      if (entityType === 'requisition') {
        await this.db.update(requisitions)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(eq(requisitions.id, entityId));
      } else {
        await this.db.update(purchaseOrders)
          .set({ status: 'approved', updatedAt: new Date() })
          .where(eq(purchaseOrders.id, entityId));
      }
      return { autoApproved: true, rule: null };
    }

    // Sort steps by stepOrder
    const sortedSteps = [...rule.steps].sort((a, b) => a.stepOrder - b.stepOrder);
    const firstStep = sortedSteps[0];

    // The schema for approvalRequests has no organizationId, initiatedBy, or dueAt —
    // those fields are tracked via the actions log and the approvableType/approvableId pattern
    const requestId = await this.db.transaction(async (tx) => {
      const [req] = await tx.insert(approvalRequests).values({
        approvableType: entityType,
        approvableId: entityId,
        approvalRuleId: rule.id,
        currentStep: firstStep.stepOrder,
        status: 'pending',
      }).returning();

      // Record the submission action
      await tx.insert(approvalActions).values({
        approvalRequestId: req.id,
        stepOrder: firstStep.stepOrder,
        approverId: initiatedBy,
        action: 'submitted',
        comment: 'Submitted for approval',
      });

      return req.id;
    });

    return { autoApproved: false, rule, requestId };
  }

  // Get approval request with actions and rule steps
  async getRequest(id: string) {
    const req = await this.db.query.approvalRequests.findFirst({
      where: (r, { eq }) => eq(r.id, id),
      with: {
        actions: { orderBy: (a, { asc }) => asc(a.actedAt) },
        rule: { with: { steps: true } },
      },
    });
    if (!req) throw new NotFoundException(`Approval request ${id} not found`);
    return req;
  }

  // List all pending requests for an organization (filtered by approvable entity org)
  async listPending(organizationId: string) {
    // approvalRequests has no organizationId column; we fetch all pending and
    // the caller can filter. For now return all pending requests.
    return this.db.query.approvalRequests.findMany({
      where: (r, { eq }) => eq(r.status, 'pending'),
      with: {
        rule: true,
        actions: { orderBy: (a, { desc }) => desc(a.actedAt) },
      },
      orderBy: (r, { asc }) => asc(r.createdAt),
    });
  }

  // Process an approve or reject action
  async processAction(
    requestId: string,
    actorId: string,
    action: 'approve' | 'reject',
    comment?: string,
  ) {
    const approvalReq = await this.getRequest(requestId);

    if (approvalReq.status !== 'pending') {
      throw new BadRequestException(`Request is already ${approvalReq.status}`);
    }

    const rule = await this.db.query.approvalRules.findFirst({
      where: (r, { eq }) => eq(r.id, approvalReq.approvalRuleId!),
      with: { steps: true },
    });

    const sortedSteps = [...(rule?.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);
    const nextStep = sortedSteps.find(s => s.stepOrder > approvalReq.currentStep);

    // Record the action
    await this.db.insert(approvalActions).values({
      approvalRequestId: requestId,
      stepOrder: approvalReq.currentStep,
      approverId: actorId,
      action,
      comment: comment ?? null,
    });

    if (action === 'reject') {
      await this.db.update(approvalRequests)
        .set({ status: 'rejected', updatedAt: new Date() })
        .where(eq(approvalRequests.id, requestId));

      await this.updateEntityStatus(approvalReq.approvableType, approvalReq.approvableId, 'rejected');
      return { status: 'rejected' };
    }

    // action === 'approve'
    if (nextStep) {
      // Advance to next step
      await this.db.update(approvalRequests)
        .set({ currentStep: nextStep.stepOrder, updatedAt: new Date() })
        .where(eq(approvalRequests.id, requestId));

      await this.db.insert(approvalActions).values({
        approvalRequestId: requestId,
        stepOrder: nextStep.stepOrder,
        approverId: actorId,
        action: 'forwarded',
        comment: `Advanced to step ${nextStep.stepOrder}`,
      });

      return { status: 'pending', advancedToStep: nextStep.stepOrder };
    } else {
      // Final approval
      await this.db.update(approvalRequests)
        .set({ status: 'approved', updatedAt: new Date() })
        .where(eq(approvalRequests.id, requestId));

      await this.updateEntityStatus(approvalReq.approvableType, approvalReq.approvableId, 'approved');
      return { status: 'approved' };
    }
  }

  private async updateEntityStatus(
    entityType: string,
    entityId: string,
    status: 'approved' | 'rejected',
  ) {
    if (entityType === 'requisition') {
      await this.db.update(requisitions)
        .set({ status, updatedAt: new Date() })
        .where(eq(requisitions.id, entityId));
    } else if (entityType === 'purchase_order') {
      await this.db.update(purchaseOrders)
        .set({ status, updatedAt: new Date() })
        .where(eq(purchaseOrders.id, entityId));
    }
  }
}
