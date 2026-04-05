'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { updateOrganisationDetails } from '@/features/club-profile/services/club-profile-service';
import type { Organisation } from '@/lib/supabase/database.types';

interface ClubContactFormProps {
  organisation: Organisation;
  onSaved: () => void;
}

export function ClubContactForm({ organisation, onSaved }: ClubContactFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [contactEmail, setContactEmail] = useState(organisation.contact_email ?? '');
  const [contactPhone, setContactPhone] = useState(organisation.contact_phone ?? '');
  const [website, setWebsite] = useState(organisation.website ?? '');
  const [facebookUrl, setFacebookUrl] = useState(organisation.facebook_url ?? '');
  const [instagramUrl, setInstagramUrl] = useState(organisation.instagram_url ?? '');
  const [youtubeUrl, setYoutubeUrl] = useState(organisation.youtube_url ?? '');
  const [tiktokUrl, setTiktokUrl] = useState(organisation.tiktok_url ?? '');

  useEffect(() => {
    setContactEmail(organisation.contact_email ?? '');
    setContactPhone(organisation.contact_phone ?? '');
    setWebsite(organisation.website ?? '');
    setFacebookUrl(organisation.facebook_url ?? '');
    setInstagramUrl(organisation.instagram_url ?? '');
    setYoutubeUrl(organisation.youtube_url ?? '');
    setTiktokUrl(organisation.tiktok_url ?? '');
  }, [organisation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        contact_email: contactEmail || null,
        contact_phone: contactPhone || null,
        website: website || null,
        facebook_url: facebookUrl || null,
        instagram_url: instagramUrl || null,
        youtube_url: youtubeUrl || null,
        tiktok_url: tiktokUrl || null,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Contact details updated successfully.' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-email">Contact Email</Label>
          <Input
            id="contact-email"
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="club@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">Contact Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            placeholder="04XX XXX XXX"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://www.example.com"
        />
      </div>

      <Separator />

      <h3 className="text-sm font-medium">Social Media</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="facebook-url">Facebook</Label>
          <Input
            id="facebook-url"
            type="url"
            value={facebookUrl}
            onChange={(e) => setFacebookUrl(e.target.value)}
            placeholder="https://facebook.com/yourclub"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instagram-url">Instagram</Label>
          <Input
            id="instagram-url"
            type="url"
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            placeholder="https://instagram.com/yourclub"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="youtube-url">YouTube</Label>
          <Input
            id="youtube-url"
            type="url"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/@yourclub"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tiktok-url">TikTok</Label>
          <Input
            id="tiktok-url"
            type="url"
            value={tiktokUrl}
            onChange={(e) => setTiktokUrl(e.target.value)}
            placeholder="https://tiktok.com/@yourclub"
          />
        </div>
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
