import { z } from 'zod/v4';

export const activitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  activityType: z.enum(['competition', 'tournament', 'training_session', 'training_camp', 'trials'], {
    error: 'Please select an activity type',
  }),
  participationMode: z.enum(['participant', 'organiser'], {
    error: 'Please select a participation mode',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),

  // Competition fields
  totalRounds: z.coerce.number().int().positive().optional(),
  hasFinals: z.boolean().optional(),

  // Tournament fields
  poolCount: z.coerce.number().int().positive().optional(),

  // Training session fields
  recurrenceRule: z.string().optional(),
  defaultVenue: z.string().optional(),
  defaultStartTime: z.string().optional(),
  defaultDurationMinutes: z.coerce.number().int().positive().optional(),

  // Parent activity link (training -> competition/tournament)
  parentActivityId: z.string().optional(),
});

export type ActivityInput = z.infer<typeof activitySchema>;
