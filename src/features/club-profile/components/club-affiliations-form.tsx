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

interface ClubAffiliationsFormProps {
  organisation: Organisation;
  onSaved: () => void;
}

export function ClubAffiliationsForm({ organisation, onSaved }: ClubAffiliationsFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [affiliatedBody, setAffiliatedBody] = useState(organisation.affiliated_body ?? '');
  const [affiliationNumber, setAffiliationNumber] = useState(organisation.affiliation_number ?? '');
  const [insuranceProvider, setInsuranceProvider] = useState(organisation.insurance_provider ?? '');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(
    organisation.insurance_policy_number ?? ''
  );

  useEffect(() => {
    setAffiliatedBody(organisation.affiliated_body ?? '');
    setAffiliationNumber(organisation.affiliation_number ?? '');
    setInsuranceProvider(organisation.insurance_provider ?? '');
    setInsurancePolicyNumber(organisation.insurance_policy_number ?? '');
  }, [organisation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        affiliated_body: affiliatedBody || null,
        affiliation_number: affiliationNumber || null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Affiliation details updated successfully.' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium">Governing Body</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="affiliated-body">Affiliated Body</Label>
          <Input
            id="affiliated-body"
            value={affiliatedBody}
            onChange={(e) => setAffiliatedBody(e.target.value)}
            placeholder="e.g. NSW Rugby League"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="affiliation-number">Affiliation Number</Label>
          <Input
            id="affiliation-number"
            value={affiliationNumber}
            onChange={(e) => setAffiliationNumber(e.target.value)}
            placeholder="e.g. NRL-12345"
          />
        </div>
      </div>

      <Separator />

      <h3 className="text-sm font-medium">Insurance</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="insurance-provider">Insurance Provider</Label>
          <Input
            id="insurance-provider"
            value={insuranceProvider}
            onChange={(e) => setInsuranceProvider(e.target.value)}
            placeholder="e.g. Sportscover"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insurance-policy-number">Policy Number</Label>
          <Input
            id="insurance-policy-number"
            value={insurancePolicyNumber}
            onChange={(e) => setInsurancePolicyNumber(e.target.value)}
            placeholder="e.g. SC-2024-001"
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
