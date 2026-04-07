'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { getMembershipTypes } from '@/features/members/services/membership-type-service';
import { sponsorMembershipSchema, type SponsorMembershipInput } from '../schemas/staff-schemas';
import type { MembershipTypeRecord, Profile } from '@/lib/supabase/database.types';

interface SponsorMembershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  profile: Profile;
  organisationId: string;
  onComplete: (memberId: string) => void;
}

export function SponsorMembershipDialog({
  open,
  onOpenChange,
  staffId,
  profile,
  organisationId,
  onComplete,
}: SponsorMembershipDialogProps) {
  const [membershipTypes, setMembershipTypes] = useState<MembershipTypeRecord[]>([]);
  const { toast } = useToast();

  const form = useForm<SponsorMembershipInput>({
    resolver: zodResolver(sponsorMembershipSchema),
  });

  useEffect(() => {
    if (!open) return;
    getMembershipTypes(organisationId).then(({ data }) => {
      const types = data ?? [];
      setMembershipTypes(types);
      if (types.length > 0) form.setValue('membership_type_id', types[0].id);
    });
  }, [open, organisationId, form]);

  const handleSubmit = async (data: SponsorMembershipInput) => {
    const supabase = createClient();

    // Create member record linked to the same profile
    const { data: member, error } = await supabase
      .from('members')
      .insert({
        profile_id: profile.id,
        organisation_id: organisationId,
        membership_type: 'senior', // legacy field
        membership_status: 'active',
        membership_type_id: data.membership_type_id,
        registration_date: new Date().toISOString().split('T')[0],
      })
      .select('id')
      .single();

    if (error || !member) {
      toast({ title: 'Error creating membership', description: error?.message, variant: 'destructive' });
      return;
    }

    // Link staff record to member
    const { error: linkError } = await supabase
      .from('staff')
      .update({ member_id: member.id, updated_at: new Date().toISOString() })
      .eq('id', staffId);

    if (linkError) {
      toast({ title: 'Membership created but linking failed', description: linkError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Membership created', description: `${profile.first_name} ${profile.last_name} is now a member.` });
    }

    onOpenChange(false);
    onComplete(member.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sponsored Membership</DialogTitle>
          <DialogDescription>
            Create a club membership for {profile.first_name} {profile.last_name}. They are currently staff-only without a membership.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Membership Type</Label>
            <Select
              value={form.watch('membership_type_id')}
              onValueChange={(val) => form.setValue('membership_type_id', val)}
            >
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {membershipTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>Create Membership</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
