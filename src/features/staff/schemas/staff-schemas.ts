import { z } from 'zod';

export const staffTypeSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  requires_wwc: z.boolean().default(false),
  is_publicly_visible: z.boolean().default(false),
});

export type StaffTypeInput = z.infer<typeof staffTypeSchema>;

export const staffTypeFieldSchema = z.object({
  name: z.string().min(1, 'Field name is required').max(100),
  field_type: z.enum(['text', 'textarea', 'url', 'date', 'select', 'boolean', 'file', 'email', 'phone']),
  is_required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
  placeholder: z.string().max(200).optional().nullable(),
});

export type StaffTypeFieldInput = z.infer<typeof staffTypeFieldSchema>;

export const staffSchema = z.object({
  email: z.string().email('Valid email is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  phone: z.string().optional().nullable(),
  staff_type_id: z.string().uuid('Staff type is required'),
  position: z.string().max(200).optional().nullable(),
  start_date: z.string().optional().nullable(),
  status: z.enum(['active', 'inactive', 'on_leave', 'pending']).default('active'),
  notes: z.string().max(2000).optional().nullable(),
});

export type StaffInput = z.infer<typeof staffSchema>;

export const staffAccreditationSchema = z.object({
  name: z.string().min(1, 'Accreditation name is required').max(200),
  issuing_body: z.string().max(200).optional().nullable(),
  credential_number: z.string().max(100).optional().nullable(),
  issue_date: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
  status: z.enum(['current', 'expired', 'pending', 'revoked']).default('current'),
  document_url: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export type StaffAccreditationInput = z.infer<typeof staffAccreditationSchema>;

export const staffInviteSchema = z.object({
  staff_type_id: z.string().uuid('Staff type is required'),
  email: z.string().email('Valid email required').optional().or(z.literal('')).nullable(),
  is_single_use: z.boolean().default(true),
  expires_days: z.number().min(1).max(365).default(30),
});

export type StaffInviteInput = z.infer<typeof staffInviteSchema>;

export const accreditationTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  issuing_body: z.string().max(200).optional().nullable(),
  is_required: z.boolean().default(false),
});

export type AccreditationTemplateInput = z.infer<typeof accreditationTemplateSchema>;

export const sponsorMembershipSchema = z.object({
  membership_type_id: z.string().uuid('Membership type is required'),
});

export type SponsorMembershipInput = z.infer<typeof sponsorMembershipSchema>;
