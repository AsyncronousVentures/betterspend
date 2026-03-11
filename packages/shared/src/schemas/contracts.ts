import { z } from 'zod';

export const CONTRACT_TYPES = ['msa', 'sow', 'nda', 'sla', 'purchase_agreement', 'framework', 'other'] as const;
export const CONTRACT_STATUSES = ['draft', 'pending_approval', 'active', 'expiring_soon', 'expired', 'terminated', 'cancelled'] as const;

export const contractSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  type: z.enum(CONTRACT_TYPES).default('purchase_agreement'),
  vendorId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  totalValue: z.string().optional(),
  currency: z.string().length(3).default('USD'),
  paymentTerms: z.string().max(100).optional(),
  autoRenew: z.boolean().default(false),
  renewalNoticeDays: z.number().int().min(1).default(30),
  renewalTermMonths: z.number().int().min(1).optional(),
  terms: z.string().optional(),
  internalNotes: z.string().optional(),
});

export type ContractInput = z.infer<typeof contractSchema>;

export const contractLineSchema = z.object({
  lineNumber: z.number().int().min(1),
  description: z.string().min(1).max(500),
  quantity: z.string().optional(),
  unitOfMeasure: z.string().max(50).optional(),
  unitPrice: z.string().optional(),
  totalPrice: z.string().optional(),
});

export const contractAmendmentSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  effectiveDate: z.string().datetime({ offset: true }).optional(),
  valueChange: z.string().optional(),
  newEndDate: z.string().datetime({ offset: true }).optional(),
});
