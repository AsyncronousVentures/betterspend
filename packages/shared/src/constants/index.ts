export const ROLES = {
  ADMIN: 'admin',
  APPROVER: 'approver',
  REQUESTER: 'requester',
  RECEIVER: 'receiver',
  FINANCE: 'finance',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const PO_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  ISSUED: 'issued',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  PARTIALLY_INVOICED: 'partially_invoiced',
  INVOICED: 'invoiced',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
} as const;

export const REQUISITION_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  CONVERTED: 'converted',
} as const;

export const VENDOR_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
} as const;

export const NUMBER_PREFIXES = {
  REQUISITION: 'REQ',
  PURCHASE_ORDER: 'PO',
  GOODS_RECEIPT: 'GRN',
  INVOICE: 'INV',
} as const;
