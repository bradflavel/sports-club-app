import { z } from 'zod/v4';

export const clubEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  description: z.string().optional(),
  eventType: z.enum(['social', 'fundraiser', 'agm', 'presentation', 'meeting', 'other']),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  venueId: z.string().optional(),
  venueName: z.string().optional(),
  venueAddress: z.string().optional(),
  maxAttendees: z.coerce.number().int().positive().optional(),
  enableWaitlist: z.boolean().optional(),
  costCents: z.coerce.number().int().min(0).optional(),
  registrationRequired: z.boolean().optional(),
  registrationOpens: z.string().optional(),
  registrationCloses: z.string().optional(),
  registrationRequiresApproval: z.boolean().optional(),
  allowGuests: z.boolean().optional(),
  maxGuestsPerMember: z.coerce.number().int().min(1).optional(),
  collectDietaryRequirements: z.boolean().optional(),
  foodProvided: z.boolean().optional(),
  alcoholProvided: z.boolean().optional(),
  isAdultsOnly: z.boolean().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  contactPhone: z.string().optional(),
  isMembersOnly: z.boolean().optional(),
  coverImageUrl: z.string().optional(),
  notes: z.string().optional(),
  // Audience targeting
  audienceType: z.enum(['all', 'specific']).optional(),
  targetActivityIds: z.array(z.string()).optional(),
  targetDivisionIds: z.array(z.string()).optional(),
  targetTeamIds: z.array(z.string()).optional(),
});

export type ClubEventInput = z.infer<typeof clubEventSchema>;

export const registrationSchema = z.object({
  guestCount: z.coerce.number().int().min(0).optional(),
  guestNames: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  notes: z.string().optional(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
