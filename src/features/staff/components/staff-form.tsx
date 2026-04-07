'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { STAFF_STATUS_OPTIONS } from '@/lib/constants';
import { staffSchema, type StaffInput } from '../schemas/staff-schemas';
import { getFieldsForStaffType } from '../services/staff-field-service';
import type { StaffType, StaffTypeField } from '@/lib/supabase/database.types';

interface StaffFormProps {
  staffTypes: StaffType[];
  defaultValues?: Partial<StaffInput>;
  onSubmit: (data: StaffInput, fieldValues: { field_id: string; value: string }[]) => Promise<void>;
  submitLabel?: string;
  isEditing?: boolean;
  existingFieldValues?: { staff_type_field_id: string; value: string | null }[];
}

export function StaffForm({
  staffTypes,
  defaultValues,
  onSubmit,
  submitLabel = 'Add Staff Member',
  isEditing = false,
  existingFieldValues = [],
}: StaffFormProps) {
  const [customFields, setCustomFields] = useState<StaffTypeField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<StaffInput>({
    resolver: zodResolver(staffSchema) as any,
    defaultValues: {
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      staff_type_id: staffTypes[0]?.id ?? '',
      position: '',
      start_date: new Date().toISOString().split('T')[0],
      status: 'active',
      notes: '',
      ...defaultValues,
    },
  });

  const selectedTypeId = form.watch('staff_type_id');

  const fetchFields = useCallback(async () => {
    if (!selectedTypeId) return;
    const { data } = await getFieldsForStaffType(selectedTypeId);
    setCustomFields(data ?? []);

    // Pre-fill existing values
    const values: Record<string, string> = {};
    for (const fv of existingFieldValues) {
      values[fv.staff_type_field_id] = fv.value ?? '';
    }
    setFieldValues(values);
  }, [selectedTypeId, existingFieldValues]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleSubmit = async (data: StaffInput) => {
    setSubmitting(true);
    try {
      const fv = Object.entries(fieldValues).map(([field_id, value]) => ({ field_id, value: String(value) }));
      await onSubmit(data, fv);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {!isEditing && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" {...form.register('first_name')} />
              {form.formState.errors.first_name && (
                <p className="text-xs text-destructive">{form.formState.errors.first_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" {...form.register('last_name')} />
              {form.formState.errors.last_name && (
                <p className="text-xs text-destructive">{form.formState.errors.last_name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register('phone')} />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <Label>Staff Type *</Label>
          <Select
            value={selectedTypeId}
            onValueChange={(val) => form.setValue('staff_type_id', val)}
          >
            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
            <SelectContent>
              {staffTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.staff_type_id && (
            <p className="text-xs text-destructive">{form.formState.errors.staff_type_id.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="position">Position / Title</Label>
          <Input id="position" {...form.register('position')} placeholder="e.g. Head Coach, President, Assistant" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start Date</Label>
          <Input id="start_date" type="date" {...form.register('start_date')} />
        </div>

        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select
            value={form.watch('status')}
            onValueChange={(val) => form.setValue('status', val as StaffInput['status'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STAFF_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...form.register('notes')} placeholder="Internal notes about this staff member" rows={3} />
      </div>

      {/* Dynamic custom fields based on staff type */}
      {customFields.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium border-b pb-2">Additional Information</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {customFields.map((field) => (
              <div key={field.id} className="space-y-1.5">
                <Label>
                  {field.name}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.field_type === 'textarea' ? (
                  <Textarea
                    value={fieldValues[field.id] ?? ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
                    placeholder={field.placeholder ?? undefined}
                    rows={3}
                  />
                ) : field.field_type === 'select' ? (
                  <Select
                    value={fieldValues[field.id] ?? ''}
                    onValueChange={(val) => setFieldValues({ ...fieldValues, [field.id]: val })}
                  >
                    <SelectTrigger><SelectValue placeholder={field.placeholder ?? 'Select...'} /></SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.field_type === 'boolean' ? (
                  <div className="pt-1">
                    <Switch
                      checked={fieldValues[field.id] === 'true'}
                      onCheckedChange={(checked) => setFieldValues({ ...fieldValues, [field.id]: String(checked) })}
                    />
                  </div>
                ) : (
                  <Input
                    type={field.field_type === 'date' ? 'date' : field.field_type === 'email' ? 'email' : field.field_type === 'url' ? 'url' : field.field_type === 'phone' ? 'tel' : 'text'}
                    value={fieldValues[field.id] ?? ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [field.id]: e.target.value })}
                    placeholder={field.placeholder ?? undefined}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
