import { z } from 'zod/v4';

export const addToCartSchema = z.object({
  variantId: z.string().uuid('Valid variant is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
});

export type UpdateCartQuantityInput = z.infer<typeof updateCartQuantitySchema>;
