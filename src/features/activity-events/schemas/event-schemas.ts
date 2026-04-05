import { z } from 'zod/v4';

export const eventSchema = z.object({
  dateTime: z.string().min(1, 'Date and time is required'),
  venue: z.string().optional(),
  notes: z.string().optional(),
  homeTeamId: z.string().optional(),
  awayTeamId: z.string().optional(),
  opponentName: z.string().optional(),
  isHome: z.boolean().optional(),
  roundNumber: z.number().optional(),
  tournamentStage: z
    .enum(['pool', 'quarterfinal', 'semifinal', 'final', 'third_place', 'round_robin'])
    .optional(),
  poolNumber: z.number().optional(),
  title: z.string().optional(),
  endTime: z.string().optional(),
  dayNumber: z.number().optional(),
  sessionNumber: z.number().optional(),
});

export const scoreEntrySchema = z.object({
  homeScore: z.number().min(0, 'Score cannot be negative'),
  awayScore: z.number().min(0, 'Score cannot be negative'),
});

export type EventInput = z.infer<typeof eventSchema>;
export type ScoreEntryInput = z.infer<typeof scoreEntrySchema>;
