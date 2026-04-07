'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';
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
import {
  updateOrganisationClient,
  uploadOrgLogoClient,
} from '@/features/organisations/services/org-client-service';
import { useToast } from '@/components/ui/use-toast';
import { SPORT_TYPE_OPTIONS } from '@/lib/constants';
import type { Organisation, SportType } from '@/lib/supabase/database.types';

interface OrgSettingsFormProps {
  organisation: Organisation;
}

export function OrgSettingsForm({ organisation }: OrgSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: organisation.name,
    sport_type: organisation.sport_type,
    contact_email: organisation.contact_email ?? '',
    contact_phone: organisation.contact_phone ?? '',
    address: organisation.address ?? '',
    website: organisation.website ?? '',
    primary_colour: organisation.primary_colour,
    secondary_colour: organisation.secondary_colour,
    logo_url: organisation.logo_url ?? '',
  });

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    try {
      const { publicUrl, error: uploadError } = await uploadOrgLogoClient(organisation.id, file);

      if (uploadError) {
        toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
        return;
      }

      setFormData((prev) => ({ ...prev, logo_url: publicUrl ?? '' }));
      toast({ title: 'Logo uploaded', description: 'Logo uploaded successfully.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to upload logo.', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await updateOrganisationClient(organisation.id, {
        name: formData.name,
        sport_type: formData.sport_type as SportType,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        address: formData.address || null,
        website: formData.website || null,
        primary_colour: formData.primary_colour,
        secondary_colour: formData.secondary_colour,
        logo_url: formData.logo_url || null,
      });

      if (error) {
        toast({ title: 'Save failed', description: (error as Error).message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Settings saved', description: 'Organisation settings updated successfully.' });
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Logo */}
      <div className="space-y-2">
        <Label>Club Logo</Label>
        <div className="flex items-center gap-4">
          {formData.logo_url && (
            <Image
              src={formData.logo_url}
              alt="Club logo"
              width={64}
              height={64}
              className="h-16 w-16 rounded-lg object-cover border"
            />
          )}
          <div>
            <label htmlFor="logo-upload">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={logoUploading}
                asChild
              >
                <span className="cursor-pointer">
                  {logoUploading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  {logoUploading ? 'Uploading...' : 'Upload Logo'}
                </span>
              </Button>
            </label>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleLogoUpload}
            />
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Club Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sport_type">Sport Type *</Label>
          <Select
            value={formData.sport_type}
            onValueChange={(val) => handleChange('sport_type', val)}
          >
            <SelectTrigger id="sport_type">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              {SPORT_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Contact */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_email">Contact Email</Label>
          <Input
            id="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={(e) => handleChange('contact_email', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact_phone">Contact Phone</Label>
          <Input
            id="contact_phone"
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => handleChange('contact_phone', e.target.value)}
          />
        </div>
      </div>

      {/* Address & website */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main St, Suburb"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => handleChange('website', e.target.value)}
            placeholder="https://www.example.com"
          />
        </div>
      </div>

      {/* Colours */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="primary_colour">Primary Colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="primary_colour_picker"
              value={formData.primary_colour}
              onChange={(e) => handleChange('primary_colour', e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
            />
            <Input
              id="primary_colour"
              value={formData.primary_colour}
              onChange={(e) => handleChange('primary_colour', e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondary_colour">Secondary Colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="secondary_colour_picker"
              value={formData.secondary_colour}
              onChange={(e) => handleChange('secondary_colour', e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-input p-0.5"
            />
            <Input
              id="secondary_colour"
              value={formData.secondary_colour}
              onChange={(e) => handleChange('secondary_colour', e.target.value)}
              placeholder="#ffffff"
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>
    </form>
  );
}
