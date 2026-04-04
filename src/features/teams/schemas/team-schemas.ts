import { z } from 'zod/v4';

export const teamSchema = z.object({
  name: z.string().min(1, 'Team name is required'),
  division: z.string().optional(),
  ageGroup: z.string().optional(),
  seasonId: z.string().optional(),
  coachId: z.string().optional(),
  managerId: z.string().optional(),
  maxPlayers: z.number().min(1, 'Max players must be at least 1'),
});

export const addPlayerSchema = z.object({
  memberId: z.string().min(1, 'Member is required'),
  jerseyNumber: z.number().optional(),
  position: z.string().optional(),
  isCaptain: z.boolean(),
});

export type TeamInput = z.infer<typeof teamSchema>;
export type AddPlayerInput = z.infer<typeof addPlayerSchema>;
