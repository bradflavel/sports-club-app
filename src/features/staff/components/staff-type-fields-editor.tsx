'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { STAFF_FIELD_TYPE_OPTIONS } from '@/lib/constants';
import { staffTypeFieldSchema, type StaffTypeFieldInput } from '../schemas/staff-schemas';
import {
  getFieldsForStaffType,
  createStaffTypeField,
  updateStaffTypeField,
  deleteStaffTypeField,
} from '../services/staff-field-service';
import type { StaffTypeField } from '@/lib/supabase/database.types';

interface StaffTypeFieldsEditorProps {
  staffTypeId: string;
  organisationId: string;
}

export function StaffTypeFieldsEditor({ staffTypeId, organisationId }: StaffTypeFieldsEditorProps) {
  const [fields, setFields] = useState<StaffTypeField[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<StaffTypeField | null>(null);
  const [optionsText, setOptionsText] = useState('');
  const { toast } = useToast();

  const form = useForm<StaffTypeFieldInput>({
    resolver: zodResolver(staffTypeFieldSchema) as any,
    defaultValues: {
      name: '',
      field_type: 'text',
      is_required: false,
      placeholder: '',
    },
  });

  const fieldType = form.watch('field_type');

  const fetchFields = useCallback(async () => {
    const { data, error } = await getFieldsForStaffType(staffTypeId);
    if (!error) setFields(data ?? []);
    setLoading(false);
  }, [staffTypeId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const handleOpenCreate = () => {
    setEditingField(null);
    form.reset({ name: '', field_type: 'text', is_required: false, placeholder: '' });
    setOptionsText('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (field: StaffTypeField) => {
    setEditingField(field);
    form.reset({
      name: field.name,
      field_type: field.field_type,
      is_required: field.is_required,
      placeholder: field.placeholder ?? '',
    });
    setOptionsText(field.options?.join('\n') ?? '');
    setDialogOpen(true);
  };

  const handleSubmit = async (data: StaffTypeFieldInput) => {
    const options = fieldType === 'select'
      ? optionsText.split('\n').map((o) => o.trim()).filter(Boolean)
      : null;

    if (editingField) {
      const { error } = await updateStaffTypeField(editingField.id, {
        name: data.name,
        field_type: data.field_type,
        is_required: data.is_required,
        options,
        placeholder: data.placeholder || null,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Field updated' });
    } else {
      const { error } = await createStaffTypeField({
        staff_type_id: staffTypeId,
        organisation_id: organisationId,
        name: data.name,
        field_type: data.field_type,
        is_required: data.is_required,
        options,
        placeholder: data.placeholder || null,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Field added' });
    }
    setDialogOpen(false);
    fetchFields();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteStaffTypeField(id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchFields();
    }
  };

  const fieldTypeLabel = (type: string) =>
    STAFF_FIELD_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;

  if (loading) return <div className="text-xs text-muted-foreground">Loading fields...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Custom Fields</h3>
        <Button variant="outline" size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-3 w-3" />
          Add Field
        </Button>
      </div>

      {fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No custom fields configured for this type.</p>
      ) : (
        <div className="space-y-2">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <span className="font-medium">{field.name}</span>
                <Badge variant="secondary" className="text-xs">{fieldTypeLabel(field.field_type)}</Badge>
                {field.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(field)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(field.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingField ? 'Edit Field' : 'Add Custom Field'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fieldName">Field Name</Label>
              <Input id="fieldName" {...form.register('name')} placeholder="e.g. Instagram Handle, Certification Level" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Field Type</Label>
              <Select value={fieldType} onValueChange={(val) => form.setValue('field_type', val as StaffTypeFieldInput['field_type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAFF_FIELD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {fieldType === 'select' && (
              <div className="space-y-1.5">
                <Label>Options (one per line)</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="placeholder">Placeholder</Label>
              <Input id="placeholder" {...form.register('placeholder')} placeholder="Optional placeholder text" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Required</Label>
              <Switch
                checked={form.watch('is_required')}
                onCheckedChange={(checked) => form.setValue('is_required', checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{editingField ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
