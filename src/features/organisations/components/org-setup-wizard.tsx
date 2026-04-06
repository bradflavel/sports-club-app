'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createOrganisationClient } from '@/features/organisations/services/org-client-service';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { generateSlug } from '@/lib/utils';
import { SPORT_TYPE_OPTIONS } from '@/lib/constants';
import type { SportType } from '@/lib/supabase/database.types';

const createClubSchema = z.object({
  name: z.string().min(2, 'Club name must be at least 2 characters'),
  sportType: z.string().min(1, 'Please select a sport type'),
  contactEmail: z.string().email('Invalid email address').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
});

type CreateClubFormValues = z.infer<typeof createClubSchema>;

interface OrgSetupWizardProps {
  onComplete: (orgId: string) => void;
}

export function OrgSetupWizard({ onComplete }: OrgSetupWizardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [slugPreview, setSlugPreview] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateClubFormValues>({
    resolver: zodResolver(createClubSchema),
    defaultValues: {
      name: '',
      sportType: '',
      contactEmail: '',
      contactPhone: '',
    },
  });

  const nameValue = watch('name');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    setSlugPreview(generateSlug(value));
  };

  const onSubmit = async (data: CreateClubFormValues) => {
    setLoading(true);
    try {
      // supabase.auth.getUser() is an auth call — acceptable to keep in component
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
        return;
      }

      const slug = generateSlug(data.name);

      const { data: org, error } = await createOrganisationClient(
        {
          name: data.name,
          slug,
          sport_type: data.sportType as SportType,
          primary_colour: '#000000',
          secondary_colour: '#ffffff',
          contact_email: data.contactEmail || null,
          contact_phone: data.contactPhone || null,
          logo_url: null,
          address: null,
          website: null,
        },
        user.id
      );

      if (error || !org) {
        toast({
          title: 'Error creating club',
          description: (error as Error)?.message ?? 'Unknown error',
          variant: 'destructive',
        });
        return;
      }

      toast({ title: 'Club created!', description: `${data.name} has been created successfully.` });
      onComplete(org.id);
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Club Name *</Label>
        <Input
          id="name"
          placeholder="e.g. Riverside Rovers FC"
          {...register('name')}
          onChange={handleNameChange}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        {slugPreview && (
          <p className="text-xs text-muted-foreground">
            Invite code / URL slug:{' '}
            <span className="font-mono font-semibold text-foreground">{slugPreview}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sportType">Sport Type *</Label>
        <Select onValueChange={(val) => setValue('sportType', val)}>
          <SelectTrigger id="sportType">
            <SelectValue placeholder="Select a sport" />
          </SelectTrigger>
          <SelectContent>
            {SPORT_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.sportType && <p className="text-sm text-destructive">{errors.sportType.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          type="email"
          placeholder="club@example.com"
          {...register('contactEmail')}
        />
        {errors.contactEmail && (
          <p className="text-sm text-destructive">{errors.contactEmail.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactPhone">Contact Phone</Label>
        <Input
          id="contactPhone"
          type="tel"
          placeholder="+61 400 000 000"
          {...register('contactPhone')}
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Club
      </Button>
    </form>
  );
}
