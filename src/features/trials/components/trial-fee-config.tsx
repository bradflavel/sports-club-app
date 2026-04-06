'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
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

interface TrialFeeConfigProps {
  initialFeeType?: string | null;
  initialFeeAmountCents?: number | null;
  onSave: (config: { feeType: string; feeAmountCents: number }) => Promise<void>;
  loading?: boolean;
}

export function TrialFeeConfig({
  initialFeeType,
  initialFeeAmountCents,
  onSave,
  loading = false,
}: TrialFeeConfigProps) {
  const [feeType, setFeeType] = useState(initialFeeType || 'one_time');
  const [feeAmount, setFeeAmount] = useState(
    initialFeeAmountCents ? (initialFeeAmountCents / 100).toString() : ''
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cents = Math.round(parseFloat(feeAmount || '0') * 100);
        await onSave({ feeType, feeAmountCents: cents });
      }}
      className="space-y-3"
    >
      <div className="flex items-end gap-3">
        <div className="space-y-1.5 w-48">
          <Label htmlFor="feeType">Fee type</Label>
          <Select value={feeType} onValueChange={setFeeType}>
            <SelectTrigger id="feeType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_time">One-time fee</SelectItem>
              <SelectItem value="per_trial">Per session</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5 w-32">
          <Label htmlFor="feeAmount">Amount ($)</Label>
          <Input
            id="feeAmount"
            type="number"
            min={0}
            step={0.01}
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <Button type="submit" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </form>
  );
}
