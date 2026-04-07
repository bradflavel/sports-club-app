import { z } from 'zod/v4';

export const createOrderSchema = z.object({
  discountCode: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'ready_for_pickup', 'collected', 'cancelled', 'refunded']),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
