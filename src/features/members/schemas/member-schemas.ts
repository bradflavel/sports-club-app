import { z } from 'zod/v4';

export const guardianEntrySchema = z.object({
  memberId: z.string().min(1, 'Guardian is required'),
  relationship: z.enum(['parent', 'grandparent', 'legal_guardian', 'other'], {
    error: 'Please select a relationship',
  }),
  consentGiven: z.boolean(),
});

export const memberSchema = z
  .object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.email('Please enter a valid email'),
    phone: z.string().optional(),
    dateOfBirth: z.string().optional(),
    membershipType: z.enum(['senior', 'junior', 'social', 'life', 'volunteer'], {
      error: 'Please select a membership type',
    }),
    registrationDate: z.string().min(1, 'Registration date is required'),
    expiryDate: z.string().optional(),
    medicalConditions: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    emergencyContactName: z.string().optional(),
    emergencyContactPhone: z.string().optional(),
    notes: z.string().optional(),
    guardians: z.array(guardianEntrySchema).optional(),
  })
  .check((ctx) => {
    if (ctx.value.membershipType === 'junior') {
      if (!ctx.value.dateOfBirth) {
        ctx.issues.push({
          code: 'custom',
          message: 'Date of birth is required for junior members',
          path: ['dateOfBirth'],
          input: ctx.value.dateOfBirth,
        });
      }
      if (!ctx.value.emergencyContactName) {
        ctx.issues.push({
          code: 'custom',
          message: 'Emergency contact name is required for junior members',
          path: ['emergencyContactName'],
          input: ctx.value.emergencyContactName,
        });
      }
      if (!ctx.value.emergencyContactPhone) {
        ctx.issues.push({
          code: 'custom',
          message: 'Emergency contact phone is required for junior members',
          path: ['emergencyContactPhone'],
          input: ctx.value.emergencyContactPhone,
        });
      }
      if (!ctx.value.guardians || ctx.value.guardians.length === 0) {
        ctx.issues.push({
          code: 'custom',
          message: 'At least one guardian is required for junior members',
          path: ['guardians'],
          input: ctx.value.guardians,
        });
      }
      const hasConsent = ctx.value.guardians?.some((g) => g.consentGiven);
      if (ctx.value.guardians && ctx.value.guardians.length > 0 && !hasConsent) {
        ctx.issues.push({
          code: 'custom',
          message: 'Parental consent is required for junior members',
          path: ['guardians'],
          input: ctx.value.guardians,
        });
      }
    }
  });

export const csvImportRowSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.email('Please enter a valid email'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  membership_type: z.enum(['senior', 'junior', 'social', 'life', 'volunteer'], {
    error: 'Please enter a valid membership type',
  }),
});

export type MemberInput = z.infer<typeof memberSchema>;
export type GuardianEntry = z.infer<typeof guardianEntrySchema>;
export type CsvImportRowInput = z.infer<typeof csvImportRowSchema>;
