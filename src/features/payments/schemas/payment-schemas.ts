import { z } from 'zod/v4';

export const paymentSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentType: z.enum(['membership_fee', 'match_fee', 'fine', 'merchandise', 'event', 'other'], {
    error: 'Please select a payment type',
  }),
  dueDate: z.string().min(1, 'Due date is required'),
});

export const bulkInvoiceSchema = z.object({
  memberIds: z.array(z.string()).min(1, 'At least one member is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentType: z.enum(['membership_fee', 'match_fee', 'fine', 'merchandise', 'event', 'other'], {
    error: 'Please select a payment type',
  }),
  dueDate: z.string().min(1, 'Due date is required'),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type BulkInvoiceInput = z.infer<typeof bulkInvoiceSchema>;
