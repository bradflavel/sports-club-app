'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { ACCREDITATION_STATUS_OPTIONS } from '@/lib/constants';
import { staffAccreditationSchema, type StaffAccreditationInput } from '../schemas/staff-schemas';
import { createAccreditation, updateAccreditation } from '../services/staff-accreditation-service';
import type { StaffAccreditation } from '@/lib/supabase/database.types';

interface StaffAccreditationFormProps {
  open: boolean;
  onClose: () => void;
  staffId: string;
  organisationId: string;
  editingAccreditation?: StaffAccreditation | null;
  requiresWwc?: boolean;
}

export function StaffAccreditationForm({
  open,
  onClose,
  staffId,
  organisationId,
  editingAccreditation,
  requiresWwc = false,
}: StaffAccreditationFormProps) {
  const { toast } = useToast();

  const form = useForm<StaffAccreditationInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(staffAccreditationSchema) as any,
    defaultValues: editingAccreditation
      ? {
          name: editingAccreditation.name,
          issuing_body: editingAccreditation.issuing_body ?? '',
          credential_number: editingAccreditation.credential_number ?? '',
          issue_date: editingAccreditation.issue_date ?? '',
          expiry_date: editingAccreditation.expiry_date ?? '',
          status: editingAccreditation.status,
          notes: editingAccreditation.notes ?? '',
        }
      : {
          name: '',
          issuing_body: '',
          credential_number: '',
          issue_date: '',
          expiry_date: '',
          status: 'current',
          notes: '',
        },
  });

  // Reset form when editingAccreditation changes
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingAccreditation) {
      form.reset({
        name: editingAccreditation.name,
        issuing_body: editingAccreditation.issuing_body ?? '',
        credential_number: editingAccreditation.credential_number ?? '',
        issue_date: editingAccreditation.issue_date ?? '',
        expiry_date: editingAccreditation.expiry_date ?? '',
        status: editingAccreditation.status,
        notes: editingAccreditation.notes ?? '',
      });
    } else if (isOpen) {
      form.reset({ name: '', issuing_body: '', credential_number: '', issue_date: '', expiry_date: '', status: 'current', notes: '' });
    }
    if (!isOpen) onClose();
  };

  const handleSubmit = async (data: StaffAccreditationInput) => {
    if (editingAccreditation) {
      const { error } = await updateAccreditation(editingAccreditation.id, {
        name: data.name,
        issuing_body: data.issuing_body || null,
        credential_number: data.credential_number || null,
        issue_date: data.issue_date || null,
        expiry_date: data.expiry_date || null,
        status: data.status,
        notes: data.notes || null,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Accreditation updated' });
    } else {
      const { error } = await createAccreditation({
        staff_id: staffId,
        organisation_id: organisationId,
        name: data.name,
        issuing_body: data.issuing_body || null,
        credential_number: data.credential_number || null,
        issue_date: data.issue_date || null,
        expiry_date: data.expiry_date || null,
        status: data.status,
        notes: data.notes || null,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Accreditation added' });
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingAccreditation ? 'Edit Accreditation' : 'Add Accreditation'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="accredName">Accreditation Name *</Label>
            <Input id="accredName" {...form.register('name')} placeholder="e.g. Level 1 Coaching, First Aid, Blue Card" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="issuingBody">Issuing Body</Label>
              <Input id="issuingBody" {...form.register('issuing_body')} placeholder="e.g. NRL, St John Ambulance" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credNumber">Credential Number</Label>
              <Input id="credNumber" {...form.register('credential_number')} placeholder="Certificate/card number" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issueDate">Issue Date</Label>
              <Input id="issueDate" type="date" {...form.register('issue_date')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input id="expiryDate" type="date" {...form.register('expiry_date')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={form.watch('status')}
              onValueChange={(val) => form.setValue('status', val as StaffAccreditationInput['status'])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACCREDITATION_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accredNotes">Notes</Label>
            <Textarea id="accredNotes" {...form.register('notes')} placeholder="Additional notes" rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {editingAccreditation ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
