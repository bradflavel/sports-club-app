'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { WWC_CHECK_BY_STATE } from '@/lib/constants';
import { useOrganisation } from '@/hooks/use-organisation';

interface WwcCheckFieldProps {
  credentialNumber: string;
  onCredentialNumberChange: (value: string) => void;
  issueDate: string;
  onIssueDateChange: (value: string) => void;
  expiryDate: string;
  onExpiryDateChange: (value: string) => void;
}

export function WwcCheckField({
  credentialNumber,
  onCredentialNumberChange,
  issueDate,
  onIssueDateChange,
  expiryDate,
  onExpiryDateChange,
}: WwcCheckFieldProps) {
  const { organisation } = useOrganisation();
  const state = organisation?.state ?? '';
  const wwcInfo = WWC_CHECK_BY_STATE[state];
  const label = wwcInfo?.name ?? 'Working With Children Check';
  const abbreviation = wwcInfo?.abbreviation ?? 'WWCC';

  return (
    <div className="space-y-4 rounded-md border p-4 bg-muted/30">
      <div>
        <h4 className="text-sm font-medium">{label}</h4>
        <p className="text-xs text-muted-foreground">
          {abbreviation} details
          {state ? ` for ${state}` : ' \u2014 set your club\'s state in Club Settings for the correct check type'}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{abbreviation} Number</Label>
          <Input
            value={credentialNumber}
            onChange={(e) => onCredentialNumberChange(e.target.value)}
            placeholder={`Enter ${abbreviation} number`}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Issue Date</Label>
          <Input
            type="date"
            value={issueDate}
            onChange={(e) => onIssueDateChange(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Expiry Date</Label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => onExpiryDateChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
