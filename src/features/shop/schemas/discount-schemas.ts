import { z } from 'zod/v4';

export const discountCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').transform((v) => v.toUpperCase()),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed_amount']),
  discountValue: z.coerce.number().int().positive('Discount value must be positive'),
  minOrderCents: z.coerce.number().int().min(0).optional(),
  maxDiscountCents: z.coerce.number().int().min(0).optional(),
  appliesToProductId: z.string().uuid().optional(),
  appliesToCategoryId: z.string().uuid().optional(),
  maxUses: z.coerce.number().int().positive().optional(),
  maxUsesPerUser: z.coerce.number().int().positive().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type DiscountCodeInput = z.infer<typeof discountCodeSchema>;
