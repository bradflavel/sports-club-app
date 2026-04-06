import { z } from 'zod/v4';

export const trialDateSchema = z.object({
  dateTime: z.string().min(1, 'Date and time is required'),
  endTime: z.string().optional(),
  venue: z.string().optional(),
  divisionIds: z.array(z.string()).min(1, 'At least one division is required'),
});

export const trialFeeConfigSchema = z.object({
  feeType: z.enum(['one_time', 'per_trial']),
  feeAmount: z.number().min(0, 'Fee must be 0 or more'),
});

export type TrialDateInput = z.infer<typeof trialDateSchema>;
export type TrialFeeConfigInput = z.infer<typeof trialFeeConfigSchema>;
