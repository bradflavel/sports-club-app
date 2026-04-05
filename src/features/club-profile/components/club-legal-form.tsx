'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updateOrganisationDetails } from '@/features/club-profile/services/club-profile-service';
import type { Organisation } from '@/lib/supabase/database.types';

interface ClubLegalFormProps {
  organisation: Organisation;
  onSaved: () => void;
}

export function ClubLegalForm({ organisation, onSaved }: ClubLegalFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [privacyPolicyUrl, setPrivacyPolicyUrl] = useState(
    organisation.privacy_policy_url ?? ''
  );
  const [termsConditionsUrl, setTermsConditionsUrl] = useState(
    organisation.terms_conditions_url ?? ''
  );
  const [codeOfConductUrl, setCodeOfConductUrl] = useState(
    organisation.code_of_conduct_url ?? ''
  );
  const [childSafetyPolicyUrl, setChildSafetyPolicyUrl] = useState(
    organisation.child_safety_policy_url ?? ''
  );
  const [registrationConsentText, setRegistrationConsentText] = useState(
    organisation.registration_consent_text ?? ''
  );

  useEffect(() => {
    setPrivacyPolicyUrl(organisation.privacy_policy_url ?? '');
    setTermsConditionsUrl(organisation.terms_conditions_url ?? '');
    setCodeOfConductUrl(organisation.code_of_conduct_url ?? '');
    setChildSafetyPolicyUrl(organisation.child_safety_policy_url ?? '');
    setRegistrationConsentText(organisation.registration_consent_text ?? '');
  }, [organisation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        privacy_policy_url: privacyPolicyUrl || null,
        terms_conditions_url: termsConditionsUrl || null,
        code_of_conduct_url: codeOfConductUrl || null,
        child_safety_policy_url: childSafetyPolicyUrl || null,
        registration_consent_text: registrationConsentText || null,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Legal details updated successfully.' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="privacy-policy-url">Privacy Policy URL</Label>
        <Input
          id="privacy-policy-url"
          type="url"
          value={privacyPolicyUrl}
          onChange={(e) => setPrivacyPolicyUrl(e.target.value)}
          placeholder="https://example.com/privacy"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="terms-conditions-url">Terms &amp; Conditions URL</Label>
        <Input
          id="terms-conditions-url"
          type="url"
          value={termsConditionsUrl}
          onChange={(e) => setTermsConditionsUrl(e.target.value)}
          placeholder="https://example.com/terms"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="code-of-conduct-url">Code of Conduct URL</Label>
        <Input
          id="code-of-conduct-url"
          type="url"
          value={codeOfConductUrl}
          onChange={(e) => setCodeOfConductUrl(e.target.value)}
          placeholder="https://example.com/code-of-conduct"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="child-safety-policy-url">Child Safety Policy URL</Label>
        <Input
          id="child-safety-policy-url"
          type="url"
          value={childSafetyPolicyUrl}
          onChange={(e) => setChildSafetyPolicyUrl(e.target.value)}
          placeholder="https://example.com/child-safety"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="registration-consent-text">Registration Consent Text</Label>
        <Textarea
          id="registration-consent-text"
          value={registrationConsentText}
          onChange={(e) => setRegistrationConsentText(e.target.value)}
          placeholder="By registering, you agree to..."
          rows={4}
        />
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
