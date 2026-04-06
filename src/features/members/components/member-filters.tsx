'use client';

import { useEffect, useState } from 'react';
import { Filter, ChevronDown, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getTeamsClient } from '@/features/members/services/member-client-service';
import type { MemberFilters } from '@/features/members/types/member-types';
import type { Team, MembershipTypeRecord } from '@/lib/supabase/database.types';

const FALLBACK_MEMBERSHIP_TYPES = [
  { value: 'senior', label: 'Senior' },
  { value: 'junior', label: 'Junior' },
  { value: 'life', label: 'Life' },
  { value: 'volunteer', label: 'Volunteer' },
];

const MEMBERSHIP_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

interface MemberFiltersProps {
  filters: MemberFilters;
  onFiltersChange: (filters: MemberFilters) => void;
  membershipTypes?: MembershipTypeRecord[];
}

export function MemberFilters({ filters, onFiltersChange, membershipTypes }: MemberFiltersProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [typeOpen, setTypeOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    async function fetchTeams() {
      const { data } = await getTeamsClient();
      if (data) setTeams(data as Team[]);
    }
    fetchTeams();
  }, []);

  function toggleType(value: string) {
    const current = filters.membershipType ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, membershipType: updated.length > 0 ? updated : undefined });
  }

  function toggleStatus(value: string) {
    const current = filters.membershipStatus ?? [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, membershipStatus: updated.length > 0 ? updated : undefined });
  }

  function handleTeamChange(value: string) {
    onFiltersChange({ ...filters, teamId: value === 'all' ? undefined : value });
  }

  function handleAgeGroupChange(value: string) {
    onFiltersChange({ ...filters, ageGroup: value === 'all' ? undefined : value as 'adult' | 'child' });
  }

  function handleGenderChange(value: string) {
    onFiltersChange({ ...filters, gender: value === 'all' ? undefined : value });
  }

  const activeTypeCount = filters.membershipType?.length ?? 0;
  const activeStatusCount = filters.membershipStatus?.length ?? 0;
  const hasAnyFilter = activeTypeCount > 0 || activeStatusCount > 0 || filters.teamId || filters.ageGroup || filters.gender;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />

      {/* Membership Type multi-select */}
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
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            {(membershipTypes && membershipTypes.length > 0
              ? membershipTypes.map((mt) => ({ value: mt.id, label: mt.name }))
              : FALLBACK_MEMBERSHIP_TYPES
            ).map((type) => {
              const isChecked = filters.membershipType?.includes(type.value) ?? false;
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
                onClick={() => onFiltersChange({ ...filters, membershipType: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

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
            {MEMBERSHIP_STATUSES.map((status) => {
              const isChecked = filters.membershipStatus?.includes(status.value) ?? false;
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
                onClick={() => onFiltersChange({ ...filters, membershipStatus: undefined })}
              >
                Clear
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Age group */}
      <Select value={filters.ageGroup ?? 'all'} onValueChange={handleAgeGroupChange}>
        <SelectTrigger className={cn('h-9 w-[120px]', filters.ageGroup && 'border-primary')}>
          <SelectValue placeholder="All Ages" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Ages</SelectItem>
          <SelectItem value="adult">Adults</SelectItem>
          <SelectItem value="child">Children</SelectItem>
        </SelectContent>
      </Select>

      {/* Gender */}
      <Select value={filters.gender ?? 'all'} onValueChange={handleGenderChange}>
        <SelectTrigger className={cn('h-9 w-[120px]', filters.gender && 'border-primary')}>
          <SelectValue placeholder="All Genders" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Genders</SelectItem>
          <SelectItem value="male">Male</SelectItem>
          <SelectItem value="female">Female</SelectItem>
        </SelectContent>
      </Select>

      {/* Team dropdown */}
      <Select value={filters.teamId ?? 'all'} onValueChange={handleTeamChange}>
        <SelectTrigger className={cn('h-9 w-[160px]', filters.teamId && 'border-primary')}>
          <SelectValue placeholder="All Teams" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Teams</SelectItem>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear all */}
      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-muted-foreground"
          onClick={() =>
            onFiltersChange({
              membershipType: undefined,
              membershipStatus: undefined,
              teamId: undefined,
              ageGroup: undefined,
              gender: undefined,
            })
          }
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
