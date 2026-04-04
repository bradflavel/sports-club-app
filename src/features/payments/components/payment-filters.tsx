'use client';

import { useState } from 'react';
import { Filter, ChevronDown, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PAYMENT_TYPE_OPTIONS, PAYMENT_STATUS_OPTIONS } from '@/lib/constants';
import type { PaymentFilters } from '@/features/payments/types/payment-types';
import type { MemberWithProfile } from '@/features/members/types/member-types';

interface PaymentFiltersProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  members: MemberWithProfile[];
}

export function PaymentFilters({ filters, onFiltersChange, members }: PaymentFiltersProps) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);

  function toggleStatus(value: string) {
    const current = filters.status ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  }

  function toggleType(value: string) {
    const current = filters.paymentType ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, paymentType: updated.length > 0 ? updated : undefined });
  }

  function handleMemberChange(value: string) {
    onFiltersChange({ ...filters, memberId: value === 'all' ? undefined : value });
  }

  const activeStatusCount = filters.status?.length ?? 0;
  const activeTypeCount = filters.paymentType?.length ?? 0;

  const hasActiveFilters =
    activeStatusCount > 0 ||
    activeTypeCount > 0 ||
    !!filters.memberId ||
    !!filters.dueDateFrom ||
    !!filters.dueDateTo;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

      {/* Status multi-select */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            Status
            {activeStatusCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-xs">
                {activeStatusCount}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {PAYMENT_STATUS_OPTIONS.map((status) => {
              const isChecked = filters.status?.includes(status.value) ?? false;
              return (
                <div
                  key={status.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                  onClick={() => toggleStatus(status.value)}
                >
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleStatus(status.value)}
                  />
                  <Label
                    htmlFor={`status-${status.value}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {status.label}
                  </Label>
                  {isChecked && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                </div>
              );
            })}
          </div>
          {activeStatusCount > 0 && (
            <div className="mt-2 border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Payment type multi-select */}
      <Popover open={typeOpen} onOpenChange={setTypeOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 gap-1">
            Type
            {activeTypeCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 rounded-full px-1.5 text-xs">
                {activeTypeCount}
              </Badge>
            )}
            <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start">
          <div className="space-y-1">
            {PAYMENT_TYPE_OPTIONS.map((type) => {
              const isChecked = filters.paymentType?.includes(type.value) ?? false;
              return (
                <div
                  key={type.value}
                  className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted"
                  onClick={() => toggleType(type.value)}
                >
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleType(type.value)}
                  />
                  <Label
                    htmlFor={`type-${type.value}`}
                    className="cursor-pointer text-sm font-normal"
                  >
                    {type.label}
                  </Label>
                  {isChecked && <Check className="ml-auto h-3.5 w-3.5 text-primary" />}
                </div>
              );
            })}
          </div>
          {activeTypeCount > 0 && (
            <div className="mt-2 border-t pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-full text-xs"
                onClick={() => onFiltersChange({ ...filters, paymentType: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Member select */}
      <Select value={filters.memberId ?? 'all'} onValueChange={handleMemberChange}>
        <SelectTrigger className="h-9 w-[180px]">
          <SelectValue placeholder="All Members" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Members</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.profile.first_name} {m.profile.last_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Due date range */}
      <div className="flex items-center gap-1">
        <Input
          type="date"
          className="h-9 w-[140px] text-sm"
          value={filters.dueDateFrom ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dueDateFrom: e.target.value || undefined })
          }
          placeholder="From date"
          aria-label="Due date from"
        />
        <span className="text-xs text-muted-foreground">–</span>
        <Input
          type="date"
          className="h-9 w-[140px] text-sm"
          value={filters.dueDateTo ?? ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, dueDateTo: e.target.value || undefined })
          }
          placeholder="To date"
          aria-label="Due date to"
        />
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-muted-foreground"
          onClick={() =>
            onFiltersChange({
              status: undefined,
              paymentType: undefined,
              memberId: undefined,
              dueDateFrom: undefined,
              dueDateTo: undefined,
            })
          }
        >
          <X className="h-3.5 w-3.5" />
          Clear all
        </Button>
      )}
    </div>
  );
}
