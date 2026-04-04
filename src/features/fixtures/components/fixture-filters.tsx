'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FIXTURE_STATUS_OPTIONS } from '@/lib/constants';
import type { FixtureFilters } from '@/features/fixtures/types/fixture-types';
import type { Team, Season } from '@/lib/supabase/database.types';

const NONE_VALUE = '__none__';

interface FixtureFiltersProps {
  filters: FixtureFilters;
  onFiltersChange: (filters: FixtureFilters) => void;
  teams: Team[];
  seasons: Season[];
}

export function FixtureFiltersBar({
  filters,
  onFiltersChange,
  teams,
  seasons,
}: FixtureFiltersProps) {
  function setTeamId(val: string) {
    onFiltersChange({
      ...filters,
      teamId: val === NONE_VALUE ? undefined : val,
    });
  }

  function setSeasonId(val: string) {
    onFiltersChange({
      ...filters,
      seasonId: val === NONE_VALUE ? undefined : val,
    });
  }

  function toggleStatus(value: string, checked: boolean) {
    const current = filters.status ?? [];
    const next = checked ? [...current, value] : current.filter((s) => s !== value);
    onFiltersChange({ ...filters, status: next.length > 0 ? next : undefined });
  }

  function setRound(val: string) {
    onFiltersChange({
      ...filters,
      search: val || undefined,
    });
  }

  return (
    <div className="flex flex-wrap items-start gap-4">
      {/* Team */}
      <div className="min-w-[160px] space-y-1.5">
        <Label className="text-xs">Team</Label>
        <Select value={filters.teamId ?? NONE_VALUE} onValueChange={setTeamId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All teams" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>All teams</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Season */}
      <div className="min-w-[160px] space-y-1.5">
        <Label className="text-xs">Season</Label>
        <Select value={filters.seasonId ?? NONE_VALUE} onValueChange={setSeasonId}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="All seasons" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>All seasons</SelectItem>
            {seasons.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
                {s.is_current ? ' (Current)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div className="space-y-1.5">
        <Label className="text-xs">Status</Label>
        <div className="flex flex-wrap gap-3">
          {FIXTURE_STATUS_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-1.5">
              <Checkbox
                id={`status-${opt.value}`}
                checked={(filters.status ?? []).includes(opt.value)}
                onCheckedChange={(checked) => toggleStatus(opt.value, !!checked)}
              />
              <Label htmlFor={`status-${opt.value}`} className="cursor-pointer text-xs font-normal">
                {opt.label}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Round number / search */}
      <div className="min-w-[140px] space-y-1.5">
        <Label className="text-xs">Search Opponent</Label>
        <Input
          className="h-9 text-sm"
          placeholder="e.g. Riverside..."
          value={filters.search ?? ''}
          onChange={(e) => setRound(e.target.value)}
        />
      </div>
    </div>
  );
}
