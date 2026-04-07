'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { staffInviteSchema, type StaffInviteInput } from '../schemas/staff-schemas';
import { createInvite } from '../services/staff-invite-service';
import type { StaffType } from '@/lib/supabase/database.types';

interface StaffInviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisationId: string;
  organisationSlug: string;
  userId: string;
  staffTypes: StaffType[];
}

export function StaffInviteDialog({
  open,
  onOpenChange,
  organisationId,
  organisationSlug,
  userId,
  staffTypes,
}: StaffInviteDialogProps) {
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const form = useForm<StaffInviteInput>({
    resolver: zodResolver(staffInviteSchema) as any,
    defaultValues: {
      staff_type_id: staffTypes[0]?.id ?? '',
      email: '',
      is_single_use: true,
      expires_days: 30,
    },
  });

  const handleSubmit = async (data: StaffInviteInput) => {
    const { data: invite, error } = await createInvite({
      organisation_id: organisationId,
      staff_type_id: data.staff_type_id,
      email: data.email || null,
      created_by: userId,
      is_single_use: data.is_single_use,
      expires_days: data.expires_days,
    });

    if (error || !invite) {
      toast({ title: 'Error creating invite', description: error?.message, variant: 'destructive' });
      return;
    }

    const url = `${window.location.origin}/join/${organisationSlug}/staff/${invite.token}`;
    setGeneratedUrl(url);
    toast({ title: 'Invite link created' });
  };

  const handleCopy = async () => {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setGeneratedUrl(null);
      setCopied(false);
      form.reset();
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Staff Member</DialogTitle>
          <DialogDescription>
            Generate a unique link to invite someone to join as staff.
          </DialogDescription>
        </DialogHeader>

        {generatedUrl ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Invite Link</Label>
              <div className="flex gap-2">
                <Input value={generatedUrl} readOnly className="text-xs" />
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Share this link with the person you want to invite.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setGeneratedUrl(null); form.reset(); }}>
                Create Another
              </Button>
              <Button onClick={() => handleClose(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Staff Type</Label>
              <Select
                value={form.watch('staff_type_id')}
                onValueChange={(val) => form.setValue('staff_type_id', val)}
              >
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {staffTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inviteEmail">Email (optional)</Label>
              <Input
                id="inviteEmail"
                {...form.register('email')}
                placeholder="Pre-fill for a specific person"
                type="email"
              />
              <p className="text-xs text-muted-foreground">Leave blank for a general invite link.</p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Single Use</Label>
                <p className="text-xs text-muted-foreground">Link can only be used once</p>
              </div>
              <Switch
                checked={form.watch('is_single_use')}
                onCheckedChange={(checked) => form.setValue('is_single_use', checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>Generate Link</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
