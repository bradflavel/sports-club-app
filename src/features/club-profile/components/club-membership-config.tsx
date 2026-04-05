'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { MEMBERSHIP_TYPE_OPTIONS } from '@/lib/constants';
import { formatCurrency, centsToDollars, dollarsToCents } from '@/lib/format';
import {
  updateOrganisationDetails,
  upsertFeeSchedule,
} from '@/features/club-profile/services/club-profile-service';
import type {
  Organisation,
  MembershipFeeSchedule,
  MembershipType,
} from '@/lib/supabase/database.types';

interface ClubMembershipConfigProps {
  organisation: Organisation;
  feeSchedule: MembershipFeeSchedule[];
  onChanged: () => void;
}

interface FeeRow {
  membership_type: MembershipType;
  label: string;
  amountDollars: string;
}

export function ClubMembershipConfig({
  organisation,
  feeSchedule,
  onChanged,
}: ClubMembershipConfigProps) {
  const { toast } = useToast();
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingFees, setSavingFees] = useState(false);

  const [minimumAge, setMinimumAge] = useState<string>(
    organisation.minimum_age != null ? String(organisation.minimum_age) : ''
  );
  const [registrationOpen, setRegistrationOpen] = useState(
    organisation.registration_open ?? false
  );

  const [feeRows, setFeeRows] = useState<FeeRow[]>([]);

  useEffect(() => {
    setMinimumAge(
      organisation.minimum_age != null ? String(organisation.minimum_age) : ''
    );
    setRegistrationOpen(organisation.registration_open ?? false);
  }, [organisation]);

  useEffect(() => {
    const rows: FeeRow[] = MEMBERSHIP_TYPE_OPTIONS.map((opt) => {
      const existing = feeSchedule.find((f) => f.membership_type === opt.value);
      return {
        membership_type: opt.value as MembershipType,
        label: existing?.label ?? opt.label,
        amountDollars: existing ? String(centsToDollars(existing.amount_cents)) : '0',
      };
    });
    setFeeRows(rows);
  }, [feeSchedule]);

  const handleSettingsSave = async () => {
    setSavingSettings(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        minimum_age: minimumAge ? Number(minimumAge) : null,
        registration_open: registrationOpen,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Membership settings updated.' });
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const updateFeeRow = (index: number, field: keyof FeeRow, value: string) => {
    setFeeRows((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFeeSave = async () => {
    setSavingFees(true);
    try {
      const entries = feeRows.map((row) => ({
        membership_type: row.membership_type,
        amount_cents: dollarsToCents(parseFloat(row.amountDollars) || 0),
        label: row.label || null,
      }));

      const { error } = await upsertFeeSchedule(organisation.id, entries);

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Fee schedule updated.' });
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSavingFees(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <h3 className="text-sm font-medium">Settings</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="minimum-age">Minimum Age</Label>
          <Input
            id="minimum-age"
            type="number"
            min={0}
            value={minimumAge}
            onChange={(e) => setMinimumAge(e.target.value)}
            placeholder="No minimum"
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={registrationOpen}
            onCheckedChange={setRegistrationOpen}
          />
          <Label>Registration Open</Label>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSettingsSave} disabled={savingSettings} size="sm">
          {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Settings
        </Button>
      </div>

      <Separator />

      {/* Fee Schedule */}
      <h3 className="text-sm font-medium">Fee Schedule</h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Membership Type</th>
              <th className="pb-2 pr-4 font-medium">Label</th>
              <th className="pb-2 pr-4 font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {feeRows.map((row, idx) => {
              const typeOption = MEMBERSHIP_TYPE_OPTIONS.find(
                (o) => o.value === row.membership_type
              );
              return (
                <tr key={row.membership_type} className="border-b last:border-0">
                  <td className="py-2 pr-4 font-medium">
                    {typeOption?.label ?? row.membership_type}
                  </td>
                  <td className="py-2 pr-4">
                    <Input
                      value={row.label}
                      onChange={(e) => updateFeeRow(idx, 'label', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={row.amountDollars}
                        onChange={(e) => updateFeeRow(idx, 'amountDollars', e.target.value)}
                        className="h-8 w-28"
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleFeeSave} disabled={savingFees} size="sm">
          {savingFees && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Fee Schedule
        </Button>
      </div>
    </div>
  );
}
