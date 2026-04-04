import { z } from 'zod/v4';

export const fixtureSchema = z.object({
  teamId: z.string().min(1, 'Team is required'),
  opponentName: z.string().min(1, 'Opponent name is required'),
  venue: z.string().optional(),
  dateTime: z.string().min(1, 'Date and time is required'),
  isHome: z.boolean(),
  roundNumber: z.number().optional(),
  notes: z.string().optional(),
  seasonId: z.string().optional(),
});

export const scoreEntrySchema = z.object({
  homeScore: z.number().min(0, 'Home score cannot be negative'),
  awayScore: z.number().min(0, 'Away score cannot be negative'),
});

export type FixtureInput = z.infer<typeof fixtureSchema>;
export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;
