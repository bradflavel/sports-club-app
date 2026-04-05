'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, X, UserPlus, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { searchAdultMembers } from '@/features/members/services/guardian-service';
import type { MemberWithProfile, GuardianRelationship } from '@/lib/supabase/database.types';

export interface GuardianEntry {
  memberId: string;
  memberName: string;
  memberEmail: string;
  relationship: GuardianRelationship;
  consentGiven: boolean;
}

interface GuardianSearchProps {
  orgId: string;
  guardians: GuardianEntry[];
  onChange: (guardians: GuardianEntry[]) => void;
  error?: string;
}

export function GuardianSearch({ orgId, guardians, onChange, error }: GuardianSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MemberWithProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback(async () => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await searchAdultMembers(orgId, debouncedQuery);
    // Filter out members already added as guardians
    const existingIds = new Set(guardians.map((g) => g.memberId));
    setResults((data ?? []).filter((m) => !existingIds.has(m.id)));
    setSearching(false);
    setShowResults(true);
  }, [debouncedQuery, orgId, guardians]);

  useEffect(() => {
    doSearch();
  }, [doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function addGuardian(member: MemberWithProfile) {
    onChange([
      ...guardians,
      {
        memberId: member.id,
        memberName: `${member.profile.first_name} ${member.profile.last_name}`,
        memberEmail: member.profile.email,
        relationship: 'parent',
        consentGiven: false,
      },
    ]);
    setQuery('');
    setResults([]);
    setShowResults(false);
  }

  function removeGuardian(memberId: string) {
    onChange(guardians.filter((g) => g.memberId !== memberId));
  }

  function updateRelationship(memberId: string, relationship: GuardianRelationship) {
    onChange(
      guardians.map((g) => (g.memberId === memberId ? { ...g, relationship } : g))
    );
  }

  function updateConsent(memberId: string, consentGiven: boolean) {
    onChange(
      guardians.map((g) => (g.memberId === memberId ? { ...g, consentGiven } : g))
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4" />
          Guardian / Parent Details <span className="text-destructive">*</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search for existing members */}
        <div ref={wrapperRef} className="relative">
          <Label htmlFor="guardian-search">Search for guardian (existing member)</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="guardian-search"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => results.length > 0 && setShowResults(true)}
              className="pl-9"
            />
          </div>

          {showResults && (results.length > 0 || searching) && (
            <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
              {searching ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Searching...</div>
              ) : (
                results.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => addGuardian(member)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      {member.profile.first_name[0]}
                      {member.profile.last_name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {member.profile.first_name} {member.profile.last_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.profile.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Selected guardians */}
        {guardians.length > 0 && (
          <div className="space-y-3">
            {guardians.map((guardian) => (
              <div
                key={guardian.memberId}
                className="rounded-lg border bg-muted/30 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium">{guardian.memberName}</p>
                    <p className="text-xs text-muted-foreground">{guardian.memberEmail}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeGuardian(guardian.memberId)}
                    className="h-7 w-7 shrink-0 p-0"
                    aria-label={`Remove ${guardian.memberName} as guardian`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Relationship</Label>
                    <Select
                      value={guardian.relationship}
                      onValueChange={(val) =>
                        updateRelationship(
                          guardian.memberId,
                          val as GuardianRelationship
                        )
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="grandparent">Grandparent</SelectItem>
                        <SelectItem value="legal_guardian">Legal Guardian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`consent-${guardian.memberId}`}
                        checked={guardian.consentGiven}
                        onCheckedChange={(checked) =>
                          updateConsent(guardian.memberId, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`consent-${guardian.memberId}`}
                        className="text-xs"
                      >
                        Parental consent given
                      </Label>
                    </div>
                    {guardian.consentGiven && (
                      <Check className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {guardians.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Search for an existing club member to add as a guardian.
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
