'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Building2, Users, CheckCircle2, ChevronRight } from 'lucide-react';
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
import { FileUpload } from '@/components/shared/file-upload';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import { SPORT_TYPE_OPTIONS } from '@/lib/constants';
import type { SportType } from '@/lib/supabase/database.types';

// ── Types ──────────────────────────────────────────────────────────────────────

type Choice = 'create' | 'join';

type Step =
  | { id: 1 }
  | { id: '2a' }   // Create Club
  | { id: '2b' }   // Join Club
  | { id: 3 }      // Complete Profile
  | { id: 4 };     // Done

// ── Step indicator ─────────────────────────────────────────────────────────────

const STEP_LABELS = ['Choose', 'Club', 'Profile', 'Done'];

function ProgressIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEP_LABELS.map((label, i) => {
        const step = i + 1;
        const active = step === current;
        const complete = step < current;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                  complete
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'border-2 border-primary bg-background text-primary'
                      : 'border-2 border-muted-foreground/30 bg-background text-muted-foreground'
                }`}
              >
                {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
              </div>
              <span
                className={`hidden text-xs sm:block ${active ? 'font-medium text-primary' : 'text-muted-foreground'}`}
              >
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-10 sm:w-16 ${complete ? 'bg-primary' : 'bg-muted-foreground/30'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Step 1 – Choose ────────────────────────────────────────────────────────────

function StepChoose({ onChoice }: { onChoice: (c: Choice) => void }) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome!</h1>
        <p className="mt-1 text-muted-foreground">
          Get started by creating a new club or joining an existing one.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => onChoice('create')}
          className="group flex flex-col items-center gap-4 rounded-xl border-2 border-muted p-8 text-left transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Building2 className="h-7 w-7" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-semibold text-foreground">Create a New Club</p>
            <p className="text-sm text-muted-foreground">
              Set up your club and invite members to join.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
        </button>

        <button
          onClick={() => onChoice('join')}
          className="group flex flex-col items-center gap-4 rounded-xl border-2 border-muted p-8 text-left transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Users className="h-7 w-7" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-semibold text-foreground">Join an Existing Club</p>
            <p className="text-sm text-muted-foreground">
              Enter an invite code to join your club.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
        </button>
      </div>
    </div>
  );
}

// ── Step 2a – Create Club ──────────────────────────────────────────────────────

interface CreateClubState {
  name: string;
  sportType: string;
  contactEmail: string;
  contactPhone: string;
}

function StepCreateClub({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CreateClubState>({
    name: '',
    sportType: '',
    contactEmail: '',
    contactPhone: '',
  });
  const [errors, setErrors] = useState<Partial<CreateClubState>>({});

  const slug = generateSlug(form.name);

  const validate = (): boolean => {
    const next: Partial<CreateClubState> = {};
    if (!form.name.trim()) next.name = 'Club name is required.';
    if (!form.sportType) next.sportType = 'Please select a sport.';
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      next.contactEmail = 'Enter a valid email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: 'Error', description: 'You must be signed in.', variant: 'destructive' });
        return;
      }

      // Create organisation
      const { data: org, error: orgError } = await supabase
        .from('organisations')
        .insert({
          name: form.name.trim(),
          slug,
          sport_type: form.sportType as SportType,
          primary_colour: '#000000',
          secondary_colour: '#ffffff',
          contact_email: form.contactEmail || null,
          contact_phone: form.contactPhone || null,
          logo_url: null,
          address: null,
          website: null,
        })
        .select()
        .single();

      if (orgError) {
        toast({ title: 'Error', description: orgError.message, variant: 'destructive' });
        return;
      }

      // Set profile as admin
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organisation_id: org.id, role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (profileError) {
        toast({ title: 'Error', description: profileError.message, variant: 'destructive' });
        return;
      }

      // Create member record
      await supabase.from('members').insert({
        profile_id: user.id,
        organisation_id: org.id,
        membership_type: 'senior',
        membership_status: 'active',
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: null,
        medical_conditions: null,
        dietary_requirements: null,
        notes: null,
      });

      onComplete();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create Your Club</h1>
        <p className="mt-1 text-muted-foreground">Fill in the details for your new club.</p>
      </div>

      <div className="space-y-4">
        {/* Club Name */}
        <div className="space-y-2">
          <Label htmlFor="club-name">Club Name *</Label>
          <Input
            id="club-name"
            placeholder="Northside Rugby Club"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          {slug && (
            <p className="text-xs text-muted-foreground">
              Invite code / URL slug:{' '}
              <span className="font-mono font-medium text-foreground">{slug}</span>
            </p>
          )}
        </div>

        {/* Sport Type */}
        <div className="space-y-2">
          <Label htmlFor="sport-type">Sport *</Label>
          <Select
            value={form.sportType}
            onValueChange={(v) => setForm((f) => ({ ...f, sportType: v }))}
          >
            <SelectTrigger id="sport-type">
              <SelectValue placeholder="Select a sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.sportType && <p className="text-sm text-destructive">{errors.sportType}</p>}
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="club@example.com"
            value={form.contactEmail}
            onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
          />
          {errors.contactEmail && (
            <p className="text-sm text-destructive">{errors.contactEmail}</p>
          )}
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Contact Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            placeholder="+61 400 000 000"
            value={form.contactPhone}
            onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Club
        </Button>
      </div>
    </form>
  );
}

// ── Step 2b – Join Club ────────────────────────────────────────────────────────

function StepJoinClub({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) {
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState('');
  const [searching, setSearching] = useState(false);
  const [joining, setJoining] = useState(false);
  const [found, setFound] = useState<{ id: string; name: string; sport_type: string } | null>(null);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = async () => {
    if (!inviteCode.trim()) return;
    setSearching(true);
    setFound(null);
    setNotFound(false);

    const supabase = createClient();
    const { data, error } = await supabase
      .from('organisations')
      .select('id, name, sport_type')
      .eq('slug', inviteCode.trim().toLowerCase())
      .single();

    setSearching(false);
    if (error || !data) {
      setNotFound(true);
      return;
    }
    setFound(data);
  };

  const handleJoin = async () => {
    if (!found) return;
    setJoining(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: 'Error', description: 'You must be signed in.', variant: 'destructive' });
        return;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organisation_id: found.id,
          role: 'member',
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        toast({ title: 'Error', description: profileError.message, variant: 'destructive' });
        return;
      }

      await supabase.from('members').insert({
        profile_id: user.id,
        organisation_id: found.id,
        membership_type: 'senior',
        membership_status: 'pending',
        registration_date: new Date().toISOString().split('T')[0],
        expiry_date: null,
        medical_conditions: null,
        dietary_requirements: null,
        notes: null,
      });

      onComplete();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setJoining(false);
    }
  };

  const sportLabel =
    found
      ? SPORT_TYPE_OPTIONS.find((o) => o.value === found.sport_type)?.label ?? found.sport_type
      : '';

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Join a Club</h1>
        <p className="mt-1 text-muted-foreground">
          Enter the invite code or slug provided by your club admin.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invite-code">Invite Code</Label>
          <div className="flex gap-2">
            <Input
              id="invite-code"
              placeholder="northside-rugby-club"
              value={inviteCode}
              onChange={(e) => {
                setInviteCode(e.target.value);
                setFound(null);
                setNotFound(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button type="button" onClick={handleSearch} disabled={searching || !inviteCode.trim()}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
            </Button>
          </div>
        </div>

        {notFound && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No club found with that invite code. Please check and try again.
          </div>
        )}

        {found && (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
            <p className="font-semibold text-foreground">{found.name}</p>
            <p className="text-sm text-muted-foreground">{sportLabel}</p>
            <Button className="mt-3 w-full" onClick={handleJoin} disabled={joining}>
              {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join {found.name}
            </Button>
          </div>
        )}
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={onBack}>
        Back
      </Button>
    </div>
  );
}

// ── Step 3 – Complete Profile ──────────────────────────────────────────────────

interface ProfileState {
  phone: string;
  dateOfBirth: string;
  emergencyName: string;
  emergencyPhone: string;
}

function StepCompleteProfile({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState<ProfileState>({
    phone: '',
    dateOfBirth: '',
    emergencyName: '',
    emergencyPhone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: 'Error', description: 'You must be signed in.', variant: 'destructive' });
        return;
      }

      let avatarUrl: string | null = null;

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from('avatars').getPublicUrl(fileName);
          avatarUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          phone: form.phone || null,
          date_of_birth: form.dateOfBirth || null,
          emergency_contact_name: form.emergencyName || null,
          emergency_contact_phone: form.emergencyPhone || null,
          ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      onComplete();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Complete Your Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Add a few more details so your club admin can reach you.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+61 400 000 000"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={form.dateOfBirth}
            onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency-name">Emergency Contact Name</Label>
          <Input
            id="emergency-name"
            placeholder="Jane Smith"
            value={form.emergencyName}
            onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
          <Input
            id="emergency-phone"
            type="tel"
            placeholder="+61 400 000 001"
            value={form.emergencyPhone}
            onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <Label>Profile Photo (optional)</Label>
          <FileUpload
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            onFilesSelected={(files) => setAvatarFile(files[0] ?? null)}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onSkip} className="flex-1">
          Skip for now
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save & Continue
        </Button>
      </div>
    </form>
  );
}

// ── Step 4 – Done ──────────────────────────────────────────────────────────────

function StepDone({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  return (
    <div className="flex flex-col items-center space-y-6 py-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
        <p className="mt-2 text-muted-foreground">
          Your account is ready. Head to your dashboard to get started.
        </p>
      </div>
      <Button size="lg" className="w-full max-w-xs" onClick={onGoToDashboard}>
        Go to Dashboard
      </Button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ id: 1 });

  const currentStepNumber = (() => {
    if (step.id === 1) return 1;
    if (step.id === '2a' || step.id === '2b') return 2;
    if (step.id === 3) return 3;
    return 4;
  })();

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-lg rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <ProgressIndicator current={currentStepNumber} />

        {step.id === 1 && (
          <StepChoose
            onChoice={(c) => setStep({ id: c === 'create' ? '2a' : '2b' })}
          />
        )}

        {step.id === '2a' && (
          <StepCreateClub
            onComplete={() => setStep({ id: 3 })}
            onBack={() => setStep({ id: 1 })}
          />
        )}

        {step.id === '2b' && (
          <StepJoinClub
            onComplete={() => setStep({ id: 3 })}
            onBack={() => setStep({ id: 1 })}
          />
        )}

        {step.id === 3 && (
          <StepCompleteProfile
            onComplete={() => setStep({ id: 4 })}
            onSkip={() => setStep({ id: 4 })}
          />
        )}

        {step.id === 4 && (
          <StepDone onGoToDashboard={() => router.push('/dashboard')} />
        )}
      </div>
    </div>
  );
}
