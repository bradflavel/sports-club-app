'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
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
import { useToast } from '@/components/ui/use-toast';
import { SPORT_TYPE_OPTIONS } from '@/lib/constants';
import { updateOrganisationDetails } from '@/features/club-profile/services/club-profile-service';
import { createClient } from '@/lib/supabase/client';
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
}

export function ClubDetailsForm({ organisation, onSaved }: ClubDetailsFormProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(organisation.name);
  const [abn, setAbn] = useState(organisation.abn ?? '');
  const [abnEntityName, setAbnEntityName] = useState(organisation.abn_entity_name ?? '');
  const [sportType, setSportType] = useState<string>(organisation.sport_type);
  const [logoUrl, setLogoUrl] = useState(organisation.logo_url ?? '');
  const [primaryColour, setPrimaryColour] = useState(organisation.primary_colour);
  const [secondaryColour, setSecondaryColour] = useState(organisation.secondary_colour);
  const [timezone, setTimezone] = useState(organisation.timezone ?? 'Australia/Sydney');

  useEffect(() => {
    setName(organisation.name);
    setAbn(organisation.abn ?? '');
    setAbnEntityName(organisation.abn_entity_name ?? '');
    setSportType(organisation.sport_type);
    setLogoUrl(organisation.logo_url ?? '');
    setPrimaryColour(organisation.primary_colour);
    setSecondaryColour(organisation.secondary_colour);
    setTimezone(organisation.timezone ?? 'Australia/Sydney');
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

  function handleRemoveLogo() {
    setLogoUrl('');
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        name,
        abn: abn || null,
        abn_entity_name: abnEntityName || null,
        sport_type: sportType as SportType,
        logo_url: logoUrl || null,
        primary_colour: primaryColour,
        secondary_colour: secondaryColour,
        timezone,
      });

      if (error) {
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
      {/* Logo Upload */}
      <div className="space-y-2">
        <Label>Club Logo</Label>
        <div className="flex items-center gap-4">
          {logoUrl ? (
            <div className="relative">
              <img
                src={logoUrl}
                alt="Club logo"
                className="h-20 w-auto max-w-20 rounded-lg object-contain border"
              />
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
                title="Remove logo"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground"
            >
              <Upload className="h-6 w-6" />
            </div>
          )}
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="mr-2 h-4 w-4" /> {logoUrl ? 'Change Logo' : 'Upload Logo'}</>
              )}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
          </div>
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="club-name">Club Name</Label>
          <Input id="club-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sport-type">Sport Type</Label>
          <Select value={sportType} onValueChange={setSportType}>
            <SelectTrigger id="sport-type"><SelectValue placeholder="Select sport" /></SelectTrigger>
            <SelectContent>
              {SPORT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="abn">ABN</Label>
          <Input id="abn" value={abn} onChange={(e) => setAbn(e.target.value)} placeholder="12 345 678 901" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="abn-entity-name">ABN Entity Name</Label>
          <Input id="abn-entity-name" value={abnEntityName} onChange={(e) => setAbnEntityName(e.target.value)} placeholder="Registered business name" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primary-colour">Primary Colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="primary-colour-picker"
              value={primaryColour}
              onChange={(e) => setPrimaryColour(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
            />
            <Input
              id="primary-colour"
              value={primaryColour}
              onChange={(e) => setPrimaryColour(e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="secondary-colour">Secondary Colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="secondary-colour-picker"
              value={secondaryColour}
              onChange={(e) => setSecondaryColour(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
            />
            <Input
              id="secondary-colour"
              value={secondaryColour}
              onChange={(e) => setSecondaryColour(e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">Timezone</Label>
        <Select value={timezone} onValueChange={setTimezone}>
          <SelectTrigger id="timezone"><SelectValue placeholder="Select timezone" /></SelectTrigger>
          <SelectContent>
            {TIMEZONE_OPTIONS.map((tz) => (
              <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}
