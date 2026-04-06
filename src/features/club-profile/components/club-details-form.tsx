'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X, Copy, Link as LinkIcon } from 'lucide-react';
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
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { SPORT_TYPE_OPTIONS, AU_STATE_OPTIONS } from '@/lib/constants';
import { updateOrganisationDetails } from '@/features/club-profile/services/club-profile-service';
import { createClient } from '@/lib/supabase/client';
import { generateSlug, isValidSlug } from '@/lib/utils';
import type { Organisation, SportType } from '@/lib/supabase/database.types';

const TIMEZONE_OPTIONS = [
  { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
  { value: 'Australia/Melbourne', label: 'Melbourne (AEST/AEDT)' },
  { value: 'Australia/Brisbane', label: 'Brisbane (AEST)' },
  { value: 'Australia/Perth', label: 'Perth (AWST)' },
  { value: 'Australia/Adelaide', label: 'Adelaide (ACST/ACDT)' },
  { value: 'Australia/Hobart', label: 'Hobart (AEST/AEDT)' },
  { value: 'Australia/Darwin', label: 'Darwin (ACST)' },
  { value: 'Australia/Lord_Howe', label: 'Lord Howe Island' },
  { value: 'Pacific/Norfolk', label: 'Norfolk Island' },
];

interface ClubDetailsFormProps {
  organisation: Organisation;
  onSaved: () => void;
  hideSaveButton?: boolean;
  saveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

export function ClubDetailsForm({ organisation, onSaved, hideSaveButton, saveRef }: ClubDetailsFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(organisation.name);
  const [slug, setSlug] = useState(organisation.slug);
  const [slugError, setSlugError] = useState('');
  const [abn, setAbn] = useState(organisation.abn ?? '');
  const [abnEntityName, setAbnEntityName] = useState(organisation.abn_entity_name ?? '');
  const [sportType, setSportType] = useState<string>(organisation.sport_type);
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url ?? '');
  const [primaryColour, setPrimaryColour] = useState(organisation.primary_colour);
  const [secondaryColour, setSecondaryColour] = useState(organisation.secondary_colour);
  const [timezone, setTimezone] = useState(organisation.timezone ?? 'Australia/Sydney');
  const [state, setState] = useState(organisation.state ?? '');

  useEffect(() => {
    setName(organisation.name);
    setSlug(organisation.slug);
    setSlugError('');
    setAbn(organisation.abn ?? '');
    setAbnEntityName(organisation.abn_entity_name ?? '');
    setSportType(organisation.sport_type);
    setLogoUrl(organisation.logo_url ?? '');
    setPrimaryColour(organisation.primary_colour);
    setSecondaryColour(organisation.secondary_colour);
    setTimezone(organisation.timezone ?? 'Australia/Sydney');
    setState(organisation.state ?? '');
  }, [organisation]);

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Logo must be under 2MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'png';
    const path = `logos/${organisation.id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('logos').getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    setLogoUrl(publicUrl);
    setUploading(false);
    toast({ title: 'Logo uploaded' });
  }

  useEffect(() => {
    if (saveRef) {
      saveRef.current = handleSave;
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const inviteUrl = `${appUrl}/join/${slug}`;

  const handleSave = async () => {
    if (slug !== organisation.slug && !isValidSlug(slug)) {
      setSlugError('Must be 3-50 characters, lowercase letters, numbers, and hyphens only');
      return;
    }
    setSlugError('');
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        abn: abn || null,
        abn_entity_name: abnEntityName || null,
        sport_type: sportType as SportType,
        logo_url: logoUrl || null,
        primary_colour: primaryColour,
        secondary_colour: secondaryColour,
        timezone,
        state: state || null,
      };
      if (slug !== organisation.slug) {
        payload.slug = slug;
      }

      const { error } = await updateOrganisationDetails(organisation.id, payload);

      if (error) {
        if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
          setSlugError('This URL is already taken. Try a different one.');
          setSaving(false);
          return;
        }
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Club details updated successfully.' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo + Club Name + Sport */}
      <div className="flex items-start gap-5">
        {/* Logo */}
        <div className="shrink-0">
          {logoUrl ? (
            <div className="relative rounded-xl border bg-muted/30 p-2.5">
              <img
                src={logoUrl}
                alt="Club logo"
                className="h-20 w-auto max-w-20 rounded-lg object-contain"
              />
              <button
                type="button"
                onClick={() => setLogoUrl('')}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                title="Remove logo"
              >
                <X className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-1 block w-full text-center text-[11px] text-muted-foreground hover:text-primary"
              >
                {uploading ? 'Uploading...' : 'Change'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex h-[100px] w-[100px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              title="Upload logo"
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Upload className="h-6 w-6" />
                  <span className="text-[10px]">Upload</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleLogoUpload(file);
              e.target.value = '';
            }}
          />
        </div>

        {/* Club Name + Sport */}
        <div className="flex-1 space-y-3 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="club-name" className="text-xs">Club Name</Label>
            <Input id="club-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sport-type" className="text-xs">Sport</Label>
            <Select value={sportType} onValueChange={setSportType}>
              <SelectTrigger id="sport-type"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SPORT_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Two-column: Left (Timezone, ABN, Entity) | Right (Colours) */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Left column */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="timezone" className="text-xs">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state" className="text-xs">State</Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="state"><SelectValue placeholder="Select state" /></SelectTrigger>
              <SelectContent>
                {AU_STATE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColour}
                  onChange={(e) => setPrimaryColour(e.target.value)}
                  className="h-9 w-9 shrink-0 rounded border border-input p-0.5"
                />
                <Input
                  value={primaryColour}
                  onChange={(e) => setPrimaryColour(e.target.value)}
                  placeholder="#000000"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Secondary Colour</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColour}
                  onChange={(e) => setSecondaryColour(e.target.value)}
                  className="h-9 w-9 shrink-0 rounded border border-input p-0.5"
                />
                <Input
                  value={secondaryColour}
                  onChange={(e) => setSecondaryColour(e.target.value)}
                  placeholder="#ffffff"
                  className="font-mono text-xs"
                />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="abn" className="text-xs">ABN</Label>
              <Input id="abn" value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="12 345 678 901" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="abn-entity-name" className="text-xs">ABN Entity Name</Label>
              <Input id="abn-entity-name" value={abnEntityName} onChange={(e) => setAbnEntityName(e.target.value)} placeholder="Registered business name" />
            </div>
          </div>
        </div>
      </div>

      {/* Invite Link */}
      <Separator />
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium">Invite Link</h4>
        </div>
        <p className="text-xs text-muted-foreground">
          Share this link with members so they can join your club.
        </p>
        <div className="flex items-center gap-2">
          <Input
            value={inviteUrl}
            readOnly
            className="font-mono text-xs h-8 bg-muted/30"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(inviteUrl);
              toast({ title: 'Invite link copied!' });
            }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            Copy
          </Button>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">URL Slug</Label>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground shrink-0">{appUrl}/join/</span>
            <Input
              value={slug}
              onChange={(e) => {
                const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
                setSlug(val);
                setSlugError('');
              }}
              className="h-8 font-mono text-xs"
              placeholder="your-club-name"
            />
          </div>
          {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          {slug !== organisation.slug && (
            <button
              type="button"
              onClick={() => setSlug(generateSlug(name))}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Regenerate from club name
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
