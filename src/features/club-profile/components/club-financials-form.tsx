'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { centsToDollars, dollarsToCents } from '@/lib/format';
import { updateOrganisationDetails } from '@/features/club-profile/services/club-profile-service';
import type { Organisation } from '@/lib/supabase/database.types';

interface ClubFinancialsFormProps {
  organisation: Organisation;
  onSaved: () => void;
}

export function ClubFinancialsForm({ organisation, onSaved }: ClubFinancialsFormProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [bankName, setBankName] = useState(organisation.bank_name ?? '');
  const [bankBsb, setBankBsb] = useState(organisation.bank_bsb ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(
    organisation.bank_account_number ?? ''
  );
  const [bankAccountName, setBankAccountName] = useState(
    organisation.bank_account_name ?? ''
  );
  const [defaultPaymentTermsDays, setDefaultPaymentTermsDays] = useState<string>(
    organisation.default_payment_terms_days != null
      ? String(organisation.default_payment_terms_days)
      : '14'
  );
  const [lateFeeDollars, setLateFeeDollars] = useState<string>(
    organisation.late_fee_cents != null
      ? String(centsToDollars(organisation.late_fee_cents))
      : '0'
  );
  const [isGstRegistered, setIsGstRegistered] = useState(
    organisation.is_gst_registered ?? false
  );

  useEffect(() => {
    setBankName(organisation.bank_name ?? '');
    setBankBsb(organisation.bank_bsb ?? '');
    setBankAccountNumber(organisation.bank_account_number ?? '');
    setBankAccountName(organisation.bank_account_name ?? '');
    setDefaultPaymentTermsDays(
      organisation.default_payment_terms_days != null
        ? String(organisation.default_payment_terms_days)
        : '14'
    );
    setLateFeeDollars(
      organisation.late_fee_cents != null
        ? String(centsToDollars(organisation.late_fee_cents))
        : '0'
    );
    setIsGstRegistered(organisation.is_gst_registered ?? false);
  }, [organisation]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        bank_name: bankName || null,
        bank_bsb: bankBsb || null,
        bank_account_number: bankAccountNumber || null,
        bank_account_name: bankAccountName || null,
        default_payment_terms_days: defaultPaymentTermsDays
          ? Number(defaultPaymentTermsDays)
          : 14,
        late_fee_cents: lateFeeDollars
          ? dollarsToCents(parseFloat(lateFeeDollars) || 0)
          : null,
        is_gst_registered: isGstRegistered,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Financial details updated successfully.' });
      onSaved();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-medium">Bank Details</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank-name">Bank Name</Label>
          <Input
            id="bank-name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="e.g. Commonwealth Bank"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank-bsb">BSB</Label>
          <Input
            id="bank-bsb"
            value={bankBsb}
            onChange={(e) => setBankBsb(e.target.value)}
            placeholder="e.g. 062-000"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bank-account-number">Account Number</Label>
          <Input
            id="bank-account-number"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            placeholder="e.g. 12345678"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bank-account-name">Account Name</Label>
          <Input
            id="bank-account-name"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            placeholder="e.g. Club Name Inc"
          />
        </div>
      </div>

      <Separator />

      <h3 className="text-sm font-medium">Payment Settings</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="payment-terms">Default Payment Terms (days)</Label>
          <Input
            id="payment-terms"
            type="number"
            min={0}
            value={defaultPaymentTermsDays}
            onChange={(e) => setDefaultPaymentTermsDays(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="late-fee">Late Fee ($)</Label>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">$</span>
            <Input
              id="late-fee"
              type="number"
              min={0}
              step="0.01"
              value={lateFeeDollars}
              onChange={(e) => setLateFeeDollars(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isGstRegistered} onCheckedChange={setIsGstRegistered} />
        <Label>GST Registered</Label>
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
