'use client';

import { SearchInput } from '@/components/shared/search-input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STAFF_STATUS_OPTIONS } from '@/lib/constants';
import type { StaffType, StaffStatus } from '@/lib/supabase/database.types';

interface StaffFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  staffTypeId: string;
  onStaffTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  staffTypes: StaffType[];
}

export function StaffFilters({
  search,
  onSearchChange,
  staffTypeId,
  onStaffTypeChange,
  status,
  onStatusChange,
  staffTypes,
}: StaffFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        onSearch={onSearchChange}
        defaultValue={search}
        placeholder="Search staff by name, email, or position..."
        className="sm:max-w-xs"
      />
      <Select value={staffTypeId} onValueChange={onStaffTypeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {staffTypes.map((type) => (
            <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STAFF_STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
