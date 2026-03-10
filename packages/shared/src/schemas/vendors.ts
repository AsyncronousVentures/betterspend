import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(1).max(255),
  code: z.string().max(50).optional(),
  taxId: z.string().max(100).optional(),
  paymentTerms: z.string().max(100).optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  contactInfo: z.object({
    email: z.string().email().optional(),
    phone: z.string().optional(),
    contactName: z.string().optional(),
  }).optional(),
  status: z.enum(['active', 'inactive', 'blocked']).default('active'),
});

export type VendorInput = z.infer<typeof vendorSchema>;
