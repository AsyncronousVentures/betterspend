import { relations } from 'drizzle-orm';
import { organizations, departments, projects } from './schema/organizations';
import { users, userRoles } from './schema/users';
import { vendors, catalogItems } from './schema/vendors';
import { requisitions, requisitionLines } from './schema/requisitions';
import { purchaseOrders, poLines, poVersions, blanketReleases } from './schema/purchase-orders';
import { goodsReceipts, goodsReceiptLines } from './schema/receiving';
import { invoices, invoiceLines, matchResults } from './schema/invoices';
import { budgets, budgetPeriods } from './schema/budgets';
import { approvalRules, approvalRuleSteps, approvalRequests, approvalActions } from './schema/approvals';


export const organizationsRelations = relations(organizations, ({ many }) => ({
  departments: many(departments),
  users: many(users),
  vendors: many(vendors),
  requisitions: many(requisitions),
  purchaseOrders: many(purchaseOrders),
  budgets: many(budgets),
}));

export const departmentsRelations = relations(departments, ({ one, many }) => ({
  organization: one(organizations, { fields: [departments.organizationId], references: [organizations.id] }),
  parent: one(departments, { fields: [departments.parentId], references: [departments.id], relationName: 'parent' }),
  children: many(departments, { relationName: 'parent' }),
  users: many(users),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, { fields: [users.organizationId], references: [organizations.id] }),
  department: one(departments, { fields: [users.departmentId], references: [departments.id] }),
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
}));

export const vendorsRelations = relations(vendors, ({ one, many }) => ({
  organization: one(organizations, { fields: [vendors.organizationId], references: [organizations.id] }),
  catalogItems: many(catalogItems),
}));

export const requisitionsRelations = relations(requisitions, ({ one, many }) => ({
  organization: one(organizations, { fields: [requisitions.organizationId], references: [organizations.id] }),
  requester: one(users, { fields: [requisitions.requesterId], references: [users.id] }),
  department: one(departments, { fields: [requisitions.departmentId], references: [departments.id] }),
  lines: many(requisitionLines),
}));

export const purchaseOrdersRelations = relations(purchaseOrders, ({ one, many }) => ({
  organization: one(organizations, { fields: [purchaseOrders.organizationId], references: [organizations.id] }),
  vendor: one(vendors, { fields: [purchaseOrders.vendorId], references: [vendors.id] }),
  requisition: one(requisitions, { fields: [purchaseOrders.requisitionId], references: [requisitions.id] }),
  lines: many(poLines),
  versions: many(poVersions),
  releases: many(blanketReleases),
  goodsReceipts: many(goodsReceipts),
  invoices: many(invoices),
}));

export const requisitionLinesRelations = relations(requisitionLines, ({ one }) => ({
  requisition: one(requisitions, { fields: [requisitionLines.requisitionId], references: [requisitions.id] }),
  vendor: one(vendors, { fields: [requisitionLines.vendorId], references: [vendors.id] }),
}));

export const poLinesRelations = relations(poLines, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [poLines.purchaseOrderId], references: [purchaseOrders.id] }),
}));

export const poVersionsRelations = relations(poVersions, ({ one }) => ({
  purchaseOrder: one(purchaseOrders, { fields: [poVersions.purchaseOrderId], references: [purchaseOrders.id] }),
}));

export const blanketReleasesRelations = relations(blanketReleases, ({ one }) => ({
  blanketPo: one(purchaseOrders, { fields: [blanketReleases.blanketPoId], references: [purchaseOrders.id], relationName: 'releases' }),
}));

export const approvalRulesRelations = relations(approvalRules, ({ one, many }) => ({
  organization: one(organizations, { fields: [approvalRules.organizationId], references: [organizations.id] }),
  steps: many(approvalRuleSteps),
  requests: many(approvalRequests),
}));

export const approvalRuleStepsRelations = relations(approvalRuleSteps, ({ one }) => ({
  rule: one(approvalRules, { fields: [approvalRuleSteps.approvalRuleId], references: [approvalRules.id] }),
}));

export const approvalRequestsRelations = relations(approvalRequests, ({ one, many }) => ({
  rule: one(approvalRules, { fields: [approvalRequests.approvalRuleId], references: [approvalRules.id] }),
  actions: many(approvalActions),
}));

export const approvalActionsRelations = relations(approvalActions, ({ one }) => ({
  request: one(approvalRequests, { fields: [approvalActions.approvalRequestId], references: [approvalRequests.id] }),
}));

export const goodsReceiptsRelations = relations(goodsReceipts, ({ one, many }) => ({
  organization: one(organizations, { fields: [goodsReceipts.organizationId], references: [organizations.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [goodsReceipts.purchaseOrderId], references: [purchaseOrders.id] }),
  lines: many(goodsReceiptLines),
}));

export const goodsReceiptLinesRelations = relations(goodsReceiptLines, ({ one }) => ({
  goodsReceipt: one(goodsReceipts, { fields: [goodsReceiptLines.goodsReceiptId], references: [goodsReceipts.id] }),
  poLine: one(poLines, { fields: [goodsReceiptLines.poLineId], references: [poLines.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  organization: one(organizations, { fields: [invoices.organizationId], references: [organizations.id] }),
  purchaseOrder: one(purchaseOrders, { fields: [invoices.purchaseOrderId], references: [purchaseOrders.id] }),
  vendor: one(vendors, { fields: [invoices.vendorId], references: [vendors.id] }),
  lines: many(invoiceLines),
}));

export const invoiceLinesRelations = relations(invoiceLines, ({ one, many }) => ({
  invoice: one(invoices, { fields: [invoiceLines.invoiceId], references: [invoices.id] }),
  poLine: one(poLines, { fields: [invoiceLines.poLineId], references: [poLines.id] }),
  matchResults: many(matchResults),
}));

export const matchResultsRelations = relations(matchResults, ({ one }) => ({
  invoiceLine: one(invoiceLines, { fields: [matchResults.invoiceLineId], references: [invoiceLines.id] }),
  poLine: one(poLines, { fields: [matchResults.poLineId], references: [poLines.id] }),
  grnLine: one(goodsReceiptLines, { fields: [matchResults.grnLineId], references: [goodsReceiptLines.id] }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  organization: one(organizations, { fields: [budgets.organizationId], references: [organizations.id] }),
  periods: many(budgetPeriods),
}));

export const budgetPeriodsRelations = relations(budgetPeriods, ({ one }) => ({
  budget: one(budgets, { fields: [budgetPeriods.budgetId], references: [budgets.id] }),
}));
