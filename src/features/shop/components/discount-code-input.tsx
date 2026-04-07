'use client';

import { useState } from 'react';
import { Tag, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface DiscountCodeInputProps {
  onApply: (code: string) => Promise<{ valid: boolean; message?: string }>;
  appliedCode?: string | null;
  discountAmount?: number;
  onRemove?: () => void;
  disabled?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function DiscountCodeInput({
  onApply,
  appliedCode,
  discountAmount,
  onRemove,
  disabled,
}: DiscountCodeInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApply() {
    if (!code.trim()) return;
    setLoading(true);
    setError(null);

    const result = await onApply(code.trim());

    if (!result.valid) {
      setError(result.message ?? 'Invalid code');
    } else {
      setCode('');
    }
    setLoading(false);
  }

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-950">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {appliedCode}
          </span>
          {discountAmount !== undefined && discountAmount > 0 && (
            <span className="text-sm text-green-600 dark:text-green-400">
              (-{formatPrice(discountAmount)})
            </span>
          )}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onRemove}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Discount code"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          disabled={disabled || loading}
          className="flex-1"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={disabled || loading || !code.trim()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
