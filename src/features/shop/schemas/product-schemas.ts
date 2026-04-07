import { z } from 'zod/v4';

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const productVariantSchema = z.object({
  size: z.string().optional(),
  colour: z.string().optional(),
  sku: z.string().optional(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be 0 or more'),
  isActive: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export const accessRuleSchema = z.object({
  allowedRole: z.enum(['admin', 'manager', 'coach', 'player', 'member', 'guardian']).optional(),
  allowedTeamId: z.string().uuid().optional(),
}).refine(
  (data) => data.allowedRole || data.allowedTeamId,
  { message: 'At least one of role or team must be specified' }
);

export type AccessRuleInput = z.infer<typeof accessRuleSchema>;

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().optional(),
  productType: z.enum(['physical', 'digital']),
  priceCents: z.coerce.number().int().min(0, 'Price must be 0 or more'),
  compareAtPriceCents: z.coerce.number().int().min(0).optional(),
  categoryId: z.string().uuid().optional(),
  isActive: z.boolean().optional(),
  isRestricted: z.boolean().optional(),
  isPreorder: z.boolean().optional(),
  preorderAvailableDate: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(0).optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
