'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
  X,
  Calendar,
  MapPin,
  Ticket,
  Users,
  Settings,
  ClipboardList,
} from 'lucide-react';
import { CLUB_EVENT_TYPE_OPTIONS } from '@/lib/constants';
import type { ClubEventInput } from '@/features/club-events/schemas/club-event-schemas';
import type {
  ClubVenue,
  PickerActivity,
} from '@/features/club-events/types/club-event-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NONE_VALUE = '__none__';

const STEPS = [
  { label: 'Basics', icon: ClipboardList },
  { label: 'Audience', icon: Users },
  { label: 'When & Where', icon: Calendar },
  { label: 'Tickets', icon: Ticket },
  { label: 'Details', icon: Settings },
  { label: 'Review', icon: CheckCircle },
] as const;

interface EventFormProps {
  defaultValues?: Partial<ClubEventInput>;
  onSubmit: (data: ClubEventInput) => Promise<void>;
  loading: boolean;
  venues: ClubVenue[];
  activities?: PickerActivity[];
  onCancel?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function SwitchCard({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between rounded-md border px-4 py-3 ${disabled ? 'opacity-50' : ''}`}
    >
      <div className="mr-3">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-baseline gap-1.5 text-sm">
      <span className="font-medium text-muted-foreground shrink-0">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

function formatDateTimeForReview(val: string | undefined) {
  if (!val) return null;
  try {
    return new Date(val).toLocaleString('en-AU', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return val;
  }
}

// ── Main Component ───────────────────────────────────────────────────────────

export function EventForm({
  defaultValues,
  onSubmit,
  loading,
  venues,
  activities = [],
  onCancel,
}: EventFormProps) {
  const [step, setStep] = useState(0);

  // ── Form state ──
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [description, setDescription] = useState(defaultValues?.description ?? '');
  const [eventType, setEventType] = useState<ClubEventInput['eventType']>(
    defaultValues?.eventType ?? 'social'
  );
  const [status, setStatus] = useState<string>(defaultValues?.status ?? 'draft');
  const [startTime, setStartTime] = useState(defaultValues?.startTime ?? '');
  const [endTime, setEndTime] = useState(defaultValues?.endTime ?? '');
  const [venueId, setVenueId] = useState<string | undefined>(defaultValues?.venueId);
  const [venueName, setVenueName] = useState(defaultValues?.venueName ?? '');
  const [venueAddress, setVenueAddress] = useState(defaultValues?.venueAddress ?? '');
  const [maxAttendees, setMaxAttendees] = useState(defaultValues?.maxAttendees?.toString() ?? '');
  const [enableWaitlist, setEnableWaitlist] = useState(defaultValues?.enableWaitlist ?? false);
  const [costCents, setCostCents] = useState(
    defaultValues?.costCents ? (defaultValues.costCents / 100).toString() : ''
  );
  const [registrationRequired, setRegistrationRequired] = useState(
    defaultValues?.registrationRequired ?? false
  );
  const [registrationOpens, setRegistrationOpens] = useState(
    defaultValues?.registrationOpens ?? ''
  );
  const [registrationCloses, setRegistrationCloses] = useState(
    defaultValues?.registrationCloses ?? ''
  );
  const [registrationRequiresApproval, setRegistrationRequiresApproval] = useState(
    defaultValues?.registrationRequiresApproval ?? false
  );
  const [allowGuests, setAllowGuests] = useState(defaultValues?.allowGuests ?? false);
  const [maxGuestsPerMember, setMaxGuestsPerMember] = useState(
    defaultValues?.maxGuestsPerMember?.toString() ?? ''
  );
  const [collectDietaryRequirements, setCollectDietaryRequirements] = useState(
    defaultValues?.collectDietaryRequirements ?? false
  );
  const [foodProvided, setFoodProvided] = useState(defaultValues?.foodProvided ?? false);
  const [alcoholProvided, setAlcoholProvided] = useState(
    defaultValues?.alcoholProvided ?? false
  );
  const [isAdultsOnly, setIsAdultsOnly] = useState(defaultValues?.isAdultsOnly ?? false);
  const [contactName, setContactName] = useState(defaultValues?.contactName ?? '');
  const [contactEmail, setContactEmail] = useState(defaultValues?.contactEmail ?? '');
  const [contactPhone, setContactPhone] = useState(defaultValues?.contactPhone ?? '');
  const [isMembersOnly, setIsMembersOnly] = useState(defaultValues?.isMembersOnly ?? false);
  const [notes, setNotes] = useState(defaultValues?.notes ?? '');

  // Audience — three sets for the three target levels
  const [audienceType, setAudienceType] = useState<'all' | 'specific'>(
    defaultValues?.audienceType ?? 'all'
  );
  const [selActivities, setSelActivities] = useState<Set<string>>(
    new Set(defaultValues?.targetActivityIds ?? [])
  );
  const [selDivisions, setSelDivisions] = useState<Set<string>>(
    new Set(defaultValues?.targetDivisionIds ?? [])
  );
  const [selTeams, setSelTeams] = useState<Set<string>>(
    new Set(defaultValues?.targetTeamIds ?? [])
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const isCustomVenue = venueId === NONE_VALUE || !venueId;
  const isEditing = !!defaultValues?.name;

  const hasCapacity = maxAttendees !== '' && parseInt(maxAttendees) > 0;

  // ── Validation ──
  function canProceed(s: number): boolean {
    switch (s) {
      case 0:
        return name.trim().length > 0;
      case 2: {
        if (startTime === '') return false;
        // Venue is mandatory — either a saved venue or custom with name + address
        if (isCustomVenue) return venueName.trim().length > 0 && venueAddress.trim().length > 0;
        return true;
      }
      default:
        return true;
    }
  }

  // ── Navigation ──
  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }
  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  async function handleFinish() {
    const data: ClubEventInput = {
      name,
      description: description || undefined,
      eventType,
      status: status as ClubEventInput['status'],
      startTime,
      endTime: endTime || undefined,
      venueId: isCustomVenue ? undefined : venueId,
      venueName: isCustomVenue ? venueName || undefined : undefined,
      venueAddress: isCustomVenue ? venueAddress || undefined : undefined,
      maxAttendees: maxAttendees ? parseInt(maxAttendees) : undefined,
      enableWaitlist: registrationRequired ? enableWaitlist : false,
      costCents: costCents ? Math.round(parseFloat(costCents) * 100) : 0,
      registrationRequired,
      registrationOpens: registrationRequired ? registrationOpens || undefined : undefined,
      registrationCloses: registrationRequired ? registrationCloses || undefined : undefined,
      registrationRequiresApproval: registrationRequired
        ? registrationRequiresApproval
        : false,
      allowGuests: registrationRequired ? allowGuests : false,
      maxGuestsPerMember:
        registrationRequired && allowGuests && maxGuestsPerMember
          ? parseInt(maxGuestsPerMember)
          : undefined,
      collectDietaryRequirements: foodProvided ? collectDietaryRequirements : false,
      foodProvided,
      alcoholProvided,
      isAdultsOnly,
      contactName: contactName || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      isMembersOnly: audienceType === 'all' ? isMembersOnly : true,
      notes: notes || undefined,
      audienceType,
      targetActivityIds: audienceType === 'specific' ? Array.from(selActivities) : [],
      targetDivisionIds: audienceType === 'specific' ? Array.from(selDivisions) : [],
      targetTeamIds: audienceType === 'specific' ? Array.from(selTeams) : [],
    };
    await onSubmit(data);
  }

  // ── Audience helpers ──
  function toggle(set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) {
    setFn((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Select/deselect an entire activity (activity + all divisions + all teams)
  function toggleWholeActivity(activity: PickerActivity) {
    const divIds = activity.divisions.map((d) => d.id);
    const teamIds = activity.divisions.flatMap((d) => d.teams.map((t) => t.id));
    const childIds = activity.childActivities.map((c) => c.id);
    const allSelected =
      selActivities.has(activity.id) &&
      childIds.every((id) => selActivities.has(id)) &&
      divIds.every((id) => selDivisions.has(id)) &&
      teamIds.every((id) => selTeams.has(id));

    setSelActivities((prev) => {
      const next = new Set(prev);
      [activity.id, ...childIds].forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
    setSelDivisions((prev) => {
      const next = new Set(prev);
      divIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
    setSelTeams((prev) => {
      const next = new Set(prev);
      teamIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function clearAllSelections() {
    setSelActivities(new Set());
    setSelDivisions(new Set());
    setSelTeams(new Set());
  }

  const totalSelected = selActivities.size + selDivisions.size + selTeams.size;

  // Resolve venue name for review
  const resolvedVenueName = isCustomVenue
    ? venueName || 'Custom venue'
    : venues.find((v) => v.id === venueId)?.name ?? 'Unknown venue';

  // Resolve selection names for badges/review
  const selectionBadges: { id: string; name: string; type: 'activity' | 'division' | 'team' }[] = [];
  for (const a of activities) {
    if (selActivities.has(a.id)) selectionBadges.push({ id: a.id, name: a.name, type: 'activity' });
    for (const c of a.childActivities) {
      if (selActivities.has(c.id)) selectionBadges.push({ id: c.id, name: c.name, type: 'activity' });
    }
    for (const d of a.divisions) {
      if (selDivisions.has(d.id)) selectionBadges.push({ id: d.id, name: `${a.name} — ${d.name}`, type: 'division' });
      for (const t of d.teams) {
        if (selTeams.has(t.id)) selectionBadges.push({ id: t.id, name: t.name, type: 'team' });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Progress indicator ── */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                disabled={i >= step}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                  i < step
                    ? 'cursor-pointer border-primary bg-primary text-primary-foreground'
                    : i === step
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </button>
              <span
                className={`mt-1 hidden text-[10px] sm:block ${
                  i <= step ? 'font-medium text-foreground' : 'text-muted-foreground'
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-4 sm:mx-2 sm:w-8 ${
                  i < step ? 'bg-primary' : 'bg-muted-foreground/20'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Basics ── */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Event Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Annual Presentation Night"
              autoFocus
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="eventType">Event Type</Label>
              <Select
                value={eventType}
                onValueChange={(val) => setEventType(val as ClubEventInput['eventType'])}
              >
                <SelectTrigger id="eventType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CLUB_EVENT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this event about? Include details about what to expect, dress code, what's included..."
              rows={4}
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Audience ── */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Choose who can see and register for this event.
          </p>

          <div className="inline-flex rounded-lg border bg-muted p-1">
            <button
              type="button"
              onClick={() => {
                setAudienceType('all');
                clearAllSelections();
              }}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                audienceType === 'all'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Members
            </button>
            <button
              type="button"
              onClick={() => setAudienceType('specific')}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                audienceType === 'specific'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Specific Groups
            </button>
          </div>

          {audienceType === 'all' && (
            <SwitchCard
              label="Members Only"
              description="Only visible to logged-in club members (not public)"
              checked={isMembersOnly}
              onCheckedChange={setIsMembersOnly}
            />
          )}

          {audienceType === 'specific' && (
            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  No activities have been set up yet. Create activities first to target
                  specific groups.
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Select at any level — an entire competition, specific divisions, or individual teams.
                  </p>
                  <div className="rounded-lg border divide-y">
                    {activities.map((activity) => {
                      const isExpanded = expandedIds.has(activity.id);
                      const hasDivisions = activity.divisions.length > 0;
                      const hasChildren = activity.childActivities.length > 0;
                      const isExpandable = hasDivisions || hasChildren;

                      return (
                        <div key={activity.id}>
                          <div className="flex items-center gap-2 px-4 py-3 hover:bg-muted/50 transition-colors">
                            {isExpandable ? (
                              <button
                                type="button"
                                onClick={() => toggleExpand(activity.id)}
                                className="shrink-0 p-0.5"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </button>
                            ) : (
                              <span className="w-5" />
                            )}
                            <label className="flex flex-1 items-center gap-2 cursor-pointer min-w-0">
                              <input
                                type="checkbox"
                                checked={selActivities.has(activity.id)}
                                onChange={() =>
                                  isExpandable
                                    ? toggleWholeActivity(activity)
                                    : toggle(selActivities, setSelActivities, activity.id)
                                }
                                className="rounded border-muted-foreground/40 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{activity.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">
                                  {activity.activity_type.replace(/_/g, ' ')}
                                  {isExpandable && (
                                    <span>
                                      {' '}· {activity.divisions.length} division{activity.divisions.length !== 1 ? 's' : ''}
                                      {hasChildren && `, ${activity.childActivities.length} sub-activit${activity.childActivities.length !== 1 ? 'ies' : 'y'}`}
                                    </span>
                                  )}
                                </p>
                              </div>
                            </label>
                          </div>

                          {isExpanded && (
                            <div className="border-t bg-muted/20">
                              {activity.divisions.map((div) => {
                                const divExpanded = expandedIds.has(div.id);
                                const hasTeams = div.teams.length > 0;
                                return (
                                  <div key={div.id}>
                                    <div className="flex items-center gap-2 py-2.5 pl-10 pr-4 hover:bg-muted/40 transition-colors">
                                      {hasTeams ? (
                                        <button
                                          type="button"
                                          onClick={() => toggleExpand(div.id)}
                                          className="shrink-0 p-0.5"
                                        >
                                          {divExpanded ? (
                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                          )}
                                        </button>
                                      ) : (
                                        <span className="w-[22px]" />
                                      )}
                                      <label className="flex flex-1 items-center gap-2 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={selDivisions.has(div.id)}
                                          onChange={() => toggle(selDivisions, setSelDivisions, div.id)}
                                          className="rounded border-muted-foreground/40"
                                        />
                                        <span className="text-sm">{div.name}</span>
                                        {hasTeams && (
                                          <span className="text-xs text-muted-foreground">
                                            ({div.teams.length} team{div.teams.length !== 1 ? 's' : ''})
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                    {divExpanded && hasTeams && (
                                      <div className="space-y-0.5 pb-1">
                                        {div.teams.map((team) => (
                                          <label
                                            key={team.id}
                                            className="flex items-center gap-2 py-1.5 pl-[72px] pr-4 text-sm hover:bg-muted/40 cursor-pointer transition-colors"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selTeams.has(team.id)}
                                              onChange={() => toggle(selTeams, setSelTeams, team.id)}
                                              className="rounded border-muted-foreground/40"
                                            />
                                            {team.name}
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {activity.childActivities.map((child) => (
                                <label
                                  key={child.id}
                                  className="flex items-center gap-2 py-2.5 pl-[52px] pr-4 text-sm hover:bg-muted/40 cursor-pointer transition-colors"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selActivities.has(child.id)}
                                    onChange={() => toggle(selActivities, setSelActivities, child.id)}
                                    className="rounded border-muted-foreground/40"
                                  />
                                  <span>
                                    {child.name}{' '}
                                    <span className="text-xs text-muted-foreground capitalize">
                                      ({child.activity_type.replace(/_/g, ' ')})
                                    </span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {totalSelected > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectionBadges.map(({ id, name: badgeName, type }) => (
                        <Badge key={`${type}-${id}`} variant="secondary" className="gap-1 pr-1">
                          {badgeName}
                          <button
                            type="button"
                            onClick={() => {
                              if (type === 'activity') toggle(selActivities, setSelActivities, id);
                              else if (type === 'division') toggle(selDivisions, setSelDivisions, id);
                              else toggle(selTeams, setSelTeams, id);
                            }}
                            className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: When & Where ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="venueId">
              Venue <span className="text-destructive">*</span>
            </Label>
            <Select
              value={venueId ?? NONE_VALUE}
              onValueChange={(val) => setVenueId(val === NONE_VALUE ? undefined : val)}
            >
              <SelectTrigger id="venueId">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Other / custom</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCustomVenue && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="venueName">
                  Venue Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="venueName"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="e.g. Club Rooms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="venueAddress">
                  Venue Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="venueAddress"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g. 123 Main St"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Tickets & Registration ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="costCents">Cost</Label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  id="costCents"
                  type="number"
                  step="0.01"
                  min={0}
                  value={costCents}
                  onChange={(e) => setCostCents(e.target.value)}
                  className="pl-7"
                  placeholder="0.00 (free)"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                min={1}
                value={maxAttendees}
                onChange={(e) => {
                  setMaxAttendees(e.target.value);
                  // Disable waitlist if capacity is cleared
                  if (!e.target.value || parseInt(e.target.value) <= 0) {
                    setEnableWaitlist(false);
                  }
                }}
                placeholder="Unlimited"
              />
            </div>
          </div>

          <SwitchCard
            label="Registration Required"
            description="Members must register before attending"
            checked={registrationRequired}
            onCheckedChange={(val) => {
              setRegistrationRequired(val);
              if (!val) {
                setEnableWaitlist(false);
                setAllowGuests(false);
                setRegistrationRequiresApproval(false);
              }
            }}
          />

          {registrationRequired && (
            <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="registrationOpens">Registration Opens</Label>
                  <Input
                    id="registrationOpens"
                    type="datetime-local"
                    value={registrationOpens}
                    onChange={(e) => setRegistrationOpens(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registrationCloses">Registration Closes</Label>
                  <Input
                    id="registrationCloses"
                    type="datetime-local"
                    value={registrationCloses}
                    onChange={(e) => setRegistrationCloses(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <SwitchCard
                  label="Requires Approval"
                  description="Admin must approve registrations"
                  checked={registrationRequiresApproval}
                  onCheckedChange={setRegistrationRequiresApproval}
                />
                <SwitchCard
                  label="Enable Waitlist"
                  description={
                    hasCapacity
                      ? 'Allow waitlist when capacity is reached'
                      : 'Set a max attendees limit to enable'
                  }
                  checked={enableWaitlist}
                  onCheckedChange={setEnableWaitlist}
                  disabled={!hasCapacity}
                />
              </div>

              <SwitchCard
                label="Allow Guests"
                description="Members can bring guests along"
                checked={allowGuests}
                onCheckedChange={(val) => {
                  setAllowGuests(val);
                  if (!val) setMaxGuestsPerMember('');
                }}
              />

              {allowGuests && (
                <div className="space-y-2 sm:w-1/2">
                  <Label htmlFor="maxGuestsPerMember">Max Guests per Member</Label>
                  <div className="relative">
                    <Input
                      id="maxGuestsPerMember"
                      type="number"
                      min={0}
                      value={maxGuestsPerMember}
                      onChange={(e) => setMaxGuestsPerMember(e.target.value)}
                      placeholder="Unlimited"
                    />
                    {(maxGuestsPerMember === '' || maxGuestsPerMember === '0') && (
                      <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                        ∞
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Leave empty or 0 for unlimited
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Details ── */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchCard
                label="Food Provided"
                description="Food will be served at this event"
                checked={foodProvided}
                onCheckedChange={(val) => {
                  setFoodProvided(val);
                  if (!val) setCollectDietaryRequirements(false);
                }}
              />
              <SwitchCard
                label="Collect Dietary Requirements"
                description="Ask attendees about dietary needs"
                checked={collectDietaryRequirements}
                onCheckedChange={setCollectDietaryRequirements}
                disabled={!foodProvided}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <SwitchCard
                label="Licensed Venue"
                description="Alcohol will be available"
                checked={alcoholProvided}
                onCheckedChange={setAlcoholProvided}
              />
              <SwitchCard
                label="18+ Only"
                description="This event is for adults only"
                checked={isAdultsOnly}
                onCheckedChange={setIsAdultsOnly}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Jane Smith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. jane@club.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone</Label>
              <Input
                id="contactPhone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. 0400 000 000"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Internal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes visible to admins only..."
              rows={3}
            />
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 5 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Basics
            </h4>
            <ReviewRow label="Name" value={name} />
            <ReviewRow
              label="Type"
              value={
                <Badge variant="outline">
                  {CLUB_EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)?.label ?? eventType}
                </Badge>
              }
            />
            <ReviewRow
              label="Status"
              value={
                <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                  {status === 'published' ? 'Published' : 'Draft'}
                </Badge>
              }
            />
            {description && (
              <ReviewRow
                label="Description"
                value={description.length > 120 ? description.slice(0, 120) + '...' : description}
              />
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              When & Where
            </h4>
            <ReviewRow label="Start" value={formatDateTimeForReview(startTime)} />
            <ReviewRow label="End" value={formatDateTimeForReview(endTime)} />
            <ReviewRow
              label="Venue"
              value={
                <>
                  {resolvedVenueName}
                  {isCustomVenue && venueAddress && (
                    <span className="text-muted-foreground"> · {venueAddress}</span>
                  )}
                </>
              }
            />
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Tickets & Registration
            </h4>
            <ReviewRow
              label="Cost"
              value={
                costCents && parseFloat(costCents) > 0
                  ? `$${parseFloat(costCents).toFixed(2)}`
                  : 'Free'
              }
            />
            <ReviewRow label="Capacity" value={maxAttendees || 'Unlimited'} />
            <ReviewRow
              label="Registration"
              value={registrationRequired ? 'Required' : 'Not required'}
            />
            {registrationRequired && (
              <>
                <ReviewRow
                  label="Opens"
                  value={formatDateTimeForReview(registrationOpens) ?? 'Immediately'}
                />
                <ReviewRow
                  label="Closes"
                  value={formatDateTimeForReview(registrationCloses) ?? 'At event start'}
                />
                {registrationRequiresApproval && (
                  <ReviewRow label="Approval" value="Admin approval required" />
                )}
                {enableWaitlist && <ReviewRow label="Waitlist" value="Enabled" />}
                {allowGuests && (
                  <ReviewRow
                    label="Guests"
                    value={`Up to ${maxGuestsPerMember || '∞'} per member`}
                  />
                )}
              </>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Audience
            </h4>
            {audienceType === 'all' ? (
              <ReviewRow
                label="Visibility"
                value={isMembersOnly ? 'Members only' : 'Public'}
              />
            ) : (
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  Targeted to {totalSelected} group
                  {totalSelected !== 1 ? 's' : ''}:
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectionBadges.map(({ id, name: badgeName, type }) => (
                    <Badge key={`${type}-${id}`} variant="secondary" className="text-xs">
                      {badgeName}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h4>
            {foodProvided && <ReviewRow label="Food" value="Provided" />}
            {foodProvided && collectDietaryRequirements && (
              <ReviewRow label="Dietary Requirements" value="Will be collected" />
            )}
            {alcoholProvided && <ReviewRow label="Licensed Venue" value="Yes" />}
            {isAdultsOnly && <ReviewRow label="Age Restriction" value="18+ only" />}
            {contactName && <ReviewRow label="Contact" value={contactName} />}
            {contactEmail && <ReviewRow label="Email" value={contactEmail} />}
            {contactPhone && <ReviewRow label="Phone" value={contactPhone} />}
            {notes && <ReviewRow label="Admin Notes" value={notes} />}
            {!foodProvided &&
              !alcoholProvided &&
              !isAdultsOnly &&
              !contactName &&
              !notes && (
                <p className="text-sm text-muted-foreground italic">No additional details</p>
              )}
          </div>
        </div>
      )}

      {/* ── Navigation ── */}
      <div className="flex items-center justify-between border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={step === 0 ? onCancel : handleBack}
        >
          {step === 0 ? (
            'Cancel'
          ) : (
            <>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </>
          )}
        </Button>

        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            size="sm"
            onClick={handleNext}
            disabled={!canProceed(step)}
          >
            Next
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" size="sm" onClick={handleFinish} disabled={loading}>
            {loading && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Event'}
          </Button>
        )}
      </div>
    </div>
  );
}
