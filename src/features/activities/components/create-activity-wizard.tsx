'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Trophy,
  Users,
  X,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  addWeeks,
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  getDay,
  subMonths,
  addMonths,
} from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ACTIVITY_TYPE_CONFIG } from '@/lib/constants';
import type { ActivityType, ParticipationMode, Activity } from '@/lib/supabase/database.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateActivityWizardProps {
  activityType: ActivityType;
  existingActivities?: Activity[];
  onSubmit: (data: WizardOutput) => Promise<void>;
  loading?: boolean;
  onCancel: () => void;
}

export interface WizardOutput {
  activityType: ActivityType;
  participationMode: ParticipationMode;
  name: string;
  description: string;
  hostName: string;
  hostType: string;
  registrationOpens: string;
  registrationCloses: string;
  startDate: string;
  endDate: string;
  firstRoundDate: string;
  finalsStartDate: string;
  scheduleFrequency: string;
  totalRounds: number | undefined;
  hasByes: boolean;
  trialsRequired: boolean;
  trainingRequired: boolean;
  hasFinals: boolean;
  roundDates: string[];
  divisions: Array<{
    name: string;
    maxTeams: number | undefined;
    ageGroup: string;
    gender: string;
  }>;
  // Season cost
  seasonFeeType: 'free' | 'fixed' | 'range' | 'tbd';
  seasonFeeAmountCents: number;
  seasonFeeMinCents: number;
  seasonFeeMaxCents: number;
  // Draft, skill, commitment
  isDraft: boolean;
  skillLevel: string;
  commitmentLevel: string;
  poolCount?: number;
  defaultVenue?: string;
  defaultStartTime?: string;
  defaultDurationMinutes?: number;
  recurrenceRule?: string;
  parentActivityId?: string;
}

interface DivisionRow {
  name: string;
  maxTeams: string;
  ageGroup: string;
  gender: string;
}

const STEPS = ['Mode', 'Info', 'Extras', 'Dates', 'Divisions', 'Schedule', 'Review'] as const;
const WEEKDAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CreateActivityWizard({
  activityType,
  onSubmit,
  loading = false,
  onCancel,
}: CreateActivityWizardProps) {
  const config = ACTIVITY_TYPE_CONFIG[activityType];
  const [step, setStep] = useState(0);

  // Step 0: Mode
  const [participationMode, setParticipationMode] = useState<ParticipationMode | null>(null);

  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [hostName, setHostName] = useState('');
  const [hostType, setHostType] = useState('');

  // Step 2: Extras
  const [trialsRequired, setTrialsRequired] = useState(false);
  const [trainingRequired, setTrainingRequired] = useState(false);
  const [hasFinals, setHasFinals] = useState(false);

  // Step 2: Season Cost
  const [seasonFeeType, setSeasonFeeType] = useState<'free' | 'fixed' | 'range' | 'tbd'>('tbd');
  const [seasonFeeAmount, setSeasonFeeAmount] = useState('');
  const [seasonFeeMin, setSeasonFeeMin] = useState('');
  const [seasonFeeMax, setSeasonFeeMax] = useState('');

  // Step 2: Draft, Skill, Commitment
  const [isDraft, setIsDraft] = useState(false);
  const [skillLevel, setSkillLevel] = useState('');
  const [commitmentLevel, setCommitmentLevel] = useState('');

  // Step 3: Key Dates
  const [registrationOpens, setRegistrationOpens] = useState('');
  const [registrationCloses, setRegistrationCloses] = useState('');
  const [firstRoundDate, setFirstRoundDate] = useState('');
  const [finalsStartDate, setFinalsStartDate] = useState('');
  const [seasonEnds, setSeasonEnds] = useState('');

  // Step 4: Divisions
  const [divisions, setDivisions] = useState<DivisionRow[]>([]);

  // Step 5: Schedule
  const [scheduleFrequency, setScheduleFrequency] = useState('weekly');
  const [totalRounds, setTotalRounds] = useState('');
  const [hasByes, setHasByes] = useState(false);
  const [customRoundDates, setCustomRoundDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // ---------- Validation ----------

  const canProceedStep0 = participationMode !== null;
  const canProceedStep1 = name.trim() !== '' && hostName.trim() !== '';
  const canProceedStep2 = true; // extras are all optional
  const canProceedStep3 = firstRoundDate !== '';
  const canProceedStep4 = true; // divisions optional
  const canProceedStep5 = true; // schedule optional

  function canProceed(s: number): boolean {
    switch (s) {
      case 0: return canProceedStep0;
      case 1: return canProceedStep1;
      case 2: return canProceedStep2;
      case 3: return canProceedStep3;
      case 4: return canProceedStep4;
      case 5: return canProceedStep5;
      default: return true;
    }
  }

  // ---------- Computed round dates ----------

  const computedRoundDates = useMemo(() => {
    if (!firstRoundDate || scheduleFrequency === 'custom') return [];
    const rounds = totalRounds ? parseInt(totalRounds) : 0;
    if (rounds <= 0) return [];
    const start = new Date(firstRoundDate + 'T00:00:00');
    const interval = scheduleFrequency === 'fortnightly' ? 2 : 1;
    const dates: Date[] = [];
    for (let i = 0; i < rounds; i++) {
      dates.push(addWeeks(start, i * interval));
    }
    return dates;
  }, [firstRoundDate, scheduleFrequency, totalRounds]);

  // ---------- Calendar helpers ----------

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDow = getDay(monthStart);
    const padBefore: Date[] = [];
    for (let i = startDow - 1; i >= 0; i--) {
      padBefore.push(addDays(monthStart, -(i + 1)));
    }
    const totalCells = padBefore.length + days.length;
    const padAfter: Date[] = [];
    const remainder = totalCells % 7;
    if (remainder !== 0) {
      for (let i = 1; i <= 7 - remainder; i++) {
        padAfter.push(addDays(monthEnd, i));
      }
    }
    return [...padBefore, ...days, ...padAfter];
  }, [calendarMonth]);

  function toggleCustomDate(date: Date) {
    setCustomRoundDates((prev) => {
      const exists = prev.find((d) => isSameDay(d, date));
      if (exists) return prev.filter((d) => !isSameDay(d, date));
      return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
    });
  }

  function getCustomRoundNumber(date: Date): number | null {
    const idx = customRoundDates.findIndex((d) => isSameDay(d, date));
    return idx >= 0 ? idx + 1 : null;
  }

  // ---------- Division helpers ----------

  function addDivision() {
    setDivisions((prev) => [
      ...prev,
      { name: '', maxTeams: '', ageGroup: '', gender: 'open' },
    ]);
  }

  function updateDivision(index: number, field: keyof DivisionRow, value: string) {
    setDivisions((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  }

  function removeDivision(index: number) {
    setDivisions((prev) => prev.filter((_, i) => i !== index));
  }

  // ---------- Navigation ----------

  function handleNext() {
    if (step < STEPS.length - 1) setStep(step + 1);
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  // ---------- Final round dates ----------

  function getFinalRoundDates(): string[] {
    if (scheduleFrequency === 'custom') {
      return customRoundDates.map((d) => format(d, 'yyyy-MM-dd'));
    }
    return computedRoundDates.map((d) => format(d, 'yyyy-MM-dd'));
  }

  // ---------- Submit ----------

  async function handleFinish() {
    const roundDates = getFinalRoundDates();
    await onSubmit({
      activityType,
      participationMode: participationMode!,
      name: name.trim(),
      description: description.trim(),
      hostName: hostName.trim(),
      hostType,
      registrationOpens,
      registrationCloses,
      startDate: firstRoundDate,
      endDate: seasonEnds,
      firstRoundDate,
      finalsStartDate,
      scheduleFrequency,
      totalRounds: totalRounds ? parseInt(totalRounds) : undefined,
      hasByes,
      trialsRequired,
      trainingRequired,
      hasFinals,
      seasonFeeType,
      seasonFeeAmountCents: seasonFeeAmount ? Math.round(parseFloat(seasonFeeAmount) * 100) : 0,
      seasonFeeMinCents: seasonFeeMin ? Math.round(parseFloat(seasonFeeMin) * 100) : 0,
      seasonFeeMaxCents: seasonFeeMax ? Math.round(parseFloat(seasonFeeMax) * 100) : 0,
      isDraft,
      skillLevel,
      commitmentLevel,
      roundDates,
      divisions: divisions
        .filter((d) => d.name.trim() !== '')
        .map((d) => ({
          name: d.name.trim(),
          maxTeams: d.maxTeams ? parseInt(d.maxTeams) : undefined,
          ageGroup: d.ageGroup.trim(),
          gender: d.gender,
        })),
    });
  }

  // ---------- Helpers for review ----------

  function formatDateDisplay(dateStr: string): string {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr + 'T00:00:00'), 'dd MMM yyyy');
    } catch {
      return dateStr;
    }
  }

  const allRoundDatesForReview = scheduleFrequency === 'custom'
    ? customRoundDates.map((d) => format(d, 'dd MMM yyyy'))
    : computedRoundDates.map((d) => format(d, 'dd MMM yyyy'));

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-0 justify-center">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  i < step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : i === step
                    ? 'border-primary text-primary'
                    : 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {i < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-xs',
                  i === step ? 'font-medium text-foreground' : 'text-muted-foreground'
                )}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'mx-1 h-0.5 w-6 sm:mx-2 sm:w-10',
                  i < step ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* ==================== Step 0: Mode ==================== */}
      {step === 0 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">
              How is your club involved in this {config.singularLabel.toLowerCase()}?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This determines what features and controls are available.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setParticipationMode('participant')}
              className={cn(
                'flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all hover:border-primary/50',
                participationMode === 'participant'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted'
              )}
            >
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Participating</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your club is entered in this {config.singularLabel.toLowerCase()}. Track your
                  own team&apos;s games, results, and schedule.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setParticipationMode('organiser')}
              className={cn(
                'flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all hover:border-primary/50',
                participationMode === 'organiser'
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-muted'
              )}
            >
              <Trophy className="h-8 w-8 text-primary" />
              <div>
                <p className="font-semibold">Organising</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Your club is running this {config.singularLabel.toLowerCase()}. Manage all
                  teams, draws, scheduling, and scores.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ==================== Step 1: Basic Info ==================== */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. 2026 Winter Comp"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="hostName">
                Host name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="hostName"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
                placeholder="e.g. Volleyball QLD"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hostType">Host type</Label>
              <Select value={hostType} onValueChange={setHostType}>
                <SelectTrigger id="hostType">
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="club">Club</SelectItem>
                  <SelectItem value="sporting_body">Sporting Body</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this competition is about, what players can expect, format details, any requirements..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              This is shown to members on the competition page. Multiple paragraphs are supported.
            </p>
          </div>
        </div>
      )}

      {/* ==================== Step 2: Extras ==================== */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Additional Options</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              These can be set up in detail after creation.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Trials Required</p>
                <p className="text-xs text-muted-foreground">
                  Will there be selection trials before the {config.singularLabel.toLowerCase()}?
                </p>
              </div>
              <Switch checked={trialsRequired} onCheckedChange={setTrialsRequired} />
            </div>

            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Training Required</p>
                <p className="text-xs text-muted-foreground">
                  Will there be training sessions for this {config.singularLabel.toLowerCase()}?
                </p>
              </div>
              <Switch checked={trainingRequired} onCheckedChange={setTrainingRequired} />
            </div>

            <div className="flex items-center justify-between rounded-md border px-4 py-3">
              <div>
                <p className="text-sm font-medium">Has Finals</p>
                <p className="text-xs text-muted-foreground">
                  Does this {config.singularLabel.toLowerCase()} have a finals series?
                </p>
              </div>
              <Switch checked={hasFinals} onCheckedChange={setHasFinals} />
            </div>
          </div>

          {/* Season Cost */}
          <div className="space-y-3 pt-2">
            <div>
              <h4 className="text-sm font-semibold">Cost per Person</h4>
              <p className="text-xs text-muted-foreground">
                How much does it cost to play for the season?
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {([
                { value: 'tbd', label: 'TBD' },
                { value: 'free', label: 'Free' },
                { value: 'fixed', label: 'Fixed' },
                { value: 'range', label: 'Range' },
              ] as const).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                    seasonFeeType === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  )}
                  onClick={() => setSeasonFeeType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {seasonFeeType === 'fixed' && (
              <div className="space-y-1.5">
                <Label htmlFor="seasonFeeAmount">Amount ($)</Label>
                <Input
                  id="seasonFeeAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 150.00"
                  value={seasonFeeAmount}
                  onChange={(e) => setSeasonFeeAmount(e.target.value)}
                />
              </div>
            )}

            {seasonFeeType === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="seasonFeeMin">From ($)</Label>
                  <Input
                    id="seasonFeeMin"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 100.00"
                    value={seasonFeeMin}
                    onChange={(e) => setSeasonFeeMin(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="seasonFeeMax">To ($)</Label>
                  <Input
                    id="seasonFeeMax"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 250.00"
                    value={seasonFeeMax}
                    onChange={(e) => setSeasonFeeMax(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Skill + Commitment level */}
          <div className="space-y-3 pt-2">
            <div>
              <h4 className="text-sm font-semibold">Player Info</h4>
              <p className="text-xs text-muted-foreground">
                Helps members understand if this competition suits them.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="skillLevel">Skill Level</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel}>
                  <SelectTrigger id="skillLevel">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all_levels">All Levels Welcome</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="elite">Elite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="commitmentLevel">Commitment Level</Label>
                <Select value={commitmentLevel} onValueChange={setCommitmentLevel}>
                  <SelectTrigger id="commitmentLevel">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual — play when you can</SelectItem>
                    <SelectItem value="regular">Regular — most weeks</SelectItem>
                    <SelectItem value="committed">Committed — every week</SelectItem>
                    <SelectItem value="competitive">Competitive — full commitment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Draft mode */}
          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <p className="text-sm font-medium">Save as Draft</p>
              <p className="text-xs text-muted-foreground">
                Draft competitions are hidden from members until published.
              </p>
            </div>
            <Switch checked={isDraft} onCheckedChange={setIsDraft} />
          </div>
        </div>
      )}

      {/* ==================== Step 3: Key Dates ==================== */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="registrationOpens">Registration opens</Label>
              <Input
                id="registrationOpens"
                type="date"
                value={registrationOpens}
                onChange={(e) => setRegistrationOpens(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="registrationCloses">Registration closes</Label>
              <Input
                id="registrationCloses"
                type="date"
                value={registrationCloses}
                onChange={(e) => setRegistrationCloses(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="firstRoundDate">
                First round date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstRoundDate"
                type="date"
                value={firstRoundDate}
                onChange={(e) => setFirstRoundDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="finalsStartDate">Finals start date</Label>
              <Input
                id="finalsStartDate"
                type="date"
                value={finalsStartDate}
                onChange={(e) => setFinalsStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seasonEnds">Season ends</Label>
            <Input
              id="seasonEnds"
              type="date"
              value={seasonEnds}
              onChange={(e) => setSeasonEnds(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* ==================== Step 4: Divisions ==================== */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Add divisions for this competition</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              e.g. Division 1, Mixed, Under 18s
            </p>
          </div>

          {divisions.length > 0 && (
            <div className="space-y-3">
              {divisions.map((div, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
                >
                  <div className="flex-1 min-w-[140px] space-y-1">
                    <Label className="text-xs">
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={div.name}
                      onChange={(e) => updateDivision(index, 'name', e.target.value)}
                      placeholder="Division name"
                    />
                  </div>
                  <div className="w-20 space-y-1">
                    <Label className="text-xs">Max teams</Label>
                    <Input
                      type="number"
                      min={1}
                      value={div.maxTeams}
                      onChange={(e) => updateDivision(index, 'maxTeams', e.target.value)}
                      placeholder="∞"
                    />
                  </div>
                  <div className="flex-1 min-w-[120px] space-y-1">
                    <Label className="text-xs">Age group</Label>
                    <Input
                      value={div.ageGroup}
                      onChange={(e) => updateDivision(index, 'ageGroup', e.target.value)}
                      placeholder="e.g. Open, U18"
                    />
                  </div>
                  <div className="w-[120px] space-y-1">
                    <Label className="text-xs">Gender</Label>
                    <Select
                      value={div.gender}
                      onValueChange={(v) => updateDivision(index, 'gender', v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => removeDivision(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <Button type="button" variant="outline" size="sm" onClick={addDivision}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Division
          </Button>
        </div>
      )}

      {/* ==================== Step 5: Schedule ==================== */}
      {step === 5 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Schedule</h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="scheduleFrequency">Frequency</Label>
              <Select value={scheduleFrequency} onValueChange={setScheduleFrequency}>
                <SelectTrigger id="scheduleFrequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="fortnightly">Fortnightly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleFrequency !== 'custom' && (
              <div className="space-y-1.5">
                <Label htmlFor="totalRounds">Total rounds</Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min={1}
                  value={totalRounds}
                  onChange={(e) => setTotalRounds(e.target.value)}
                  placeholder="e.g. 18"
                />
              </div>
            )}
          </div>

          {/* Weekly / Fortnightly round dates */}
          {scheduleFrequency !== 'custom' && computedRoundDates.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Round dates</p>
              <div className="flex flex-wrap gap-1.5">
                {computedRoundDates.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    R{i + 1}: {format(d, 'dd MMM')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Custom calendar picker */}
          {scheduleFrequency === 'custom' && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold">
                    {format(calendarMonth, 'MMMM yyyy')}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-7 gap-0.5 text-center">
                  {WEEKDAY_HEADERS.map((d) => (
                    <div
                      key={d}
                      className="text-xs font-medium text-muted-foreground py-1"
                    >
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const inMonth = isSameMonth(day, calendarMonth);
                    const roundNum = getCustomRoundNumber(day);
                    const isSelected = roundNum !== null;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => inMonth && toggleCustomDate(day)}
                        disabled={!inMonth}
                        className={cn(
                          'relative flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors',
                          !inMonth && 'text-muted-foreground/30 cursor-default',
                          inMonth && !isSelected && 'hover:bg-muted cursor-pointer',
                          isSelected && 'bg-primary text-primary-foreground font-bold'
                        )}
                      >
                        {isSelected ? roundNum : day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {customRoundDates.length > 0 && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    Selected round dates
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {customRoundDates.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        Round {i + 1}: {format(d, 'dd MMM yyyy')}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Switch id="hasByes" checked={hasByes} onCheckedChange={setHasByes} />
            <Label htmlFor="hasByes">Has byes</Label>
          </div>
        </div>
      )}

      {/* ==================== Step 6: Review ==================== */}
      {step === 6 && (
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Basic Info
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Name:</span> {name}
              </p>
              {description && (
                <p>
                  <span className="font-medium">Description:</span> {description}
                </p>
              )}
              <p>
                <span className="font-medium">Host:</span> {hostName}
                {hostType && (
                  <span className="text-muted-foreground">
                    {' '}
                    ({hostType === 'sporting_body' ? 'Sporting Body' : hostType === 'club' ? 'Club' : 'Other'})
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Extras */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Extras
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Trials:</span>{' '}
                {trialsRequired ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-medium">Training:</span>{' '}
                {trainingRequired ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-medium">Finals:</span>{' '}
                {hasFinals ? 'Yes' : 'No'}
              </p>
              <p>
                <span className="font-medium">Cost per person:</span>{' '}
                {seasonFeeType === 'tbd' && 'TBD'}
                {seasonFeeType === 'free' && 'Free'}
                {seasonFeeType === 'fixed' && (seasonFeeAmount ? `$${parseFloat(seasonFeeAmount).toFixed(2)}` : '$0.00')}
                {seasonFeeType === 'range' && (
                  seasonFeeMin && seasonFeeMax
                    ? `$${parseFloat(seasonFeeMin).toFixed(2)} – $${parseFloat(seasonFeeMax).toFixed(2)}`
                    : 'Range not set'
                )}
              </p>
              {skillLevel && (
                <p>
                  <span className="font-medium">Skill level:</span>{' '}
                  {skillLevel === 'all_levels' ? 'All Levels' : skillLevel.charAt(0).toUpperCase() + skillLevel.slice(1)}
                </p>
              )}
              {commitmentLevel && (
                <p>
                  <span className="font-medium">Commitment:</span>{' '}
                  {commitmentLevel.charAt(0).toUpperCase() + commitmentLevel.slice(1)}
                </p>
              )}
              {isDraft && (
                <p className="text-amber-600 font-medium">
                  Saved as draft — not visible to members
                </p>
              )}
              {(trialsRequired || trainingRequired || hasFinals) && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  You&apos;ll be prompted to set these up after creation.
                </p>
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Dates
            </h4>
            <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {registrationOpens && (
                <p>
                  <span className="font-medium">Registration opens:</span>{' '}
                  {formatDateDisplay(registrationOpens)}
                </p>
              )}
              {registrationCloses && (
                <p>
                  <span className="font-medium">Registration closes:</span>{' '}
                  {formatDateDisplay(registrationCloses)}
                </p>
              )}
              <p>
                <span className="font-medium">First round:</span>{' '}
                {formatDateDisplay(firstRoundDate)}
              </p>
              {finalsStartDate && (
                <p>
                  <span className="font-medium">Finals start:</span>{' '}
                  {formatDateDisplay(finalsStartDate)}
                </p>
              )}
              {seasonEnds && (
                <p>
                  <span className="font-medium">Season ends:</span>{' '}
                  {formatDateDisplay(seasonEnds)}
                </p>
              )}
            </div>
          </div>

          {/* Divisions */}
          {divisions.filter((d) => d.name.trim()).length > 0 && (
            <div className="rounded-lg border p-4 space-y-2">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Divisions
              </h4>
              <div className="space-y-1.5">
                {divisions
                  .filter((d) => d.name.trim())
                  .map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="font-medium">{d.name}</span>
                      {d.gender && (
                        <Badge variant="outline" className="text-xs capitalize">
                          {d.gender === 'open' ? 'Open Gender' : d.gender}
                        </Badge>
                      )}
                      {d.ageGroup && (
                        <Badge variant="secondary" className="text-xs">
                          Age: {d.ageGroup}
                        </Badge>
                      )}
                      {d.maxTeams && (
                        <span className="text-xs text-muted-foreground">
                          (max {d.maxTeams} teams)
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Schedule
            </h4>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">Frequency:</span>{' '}
                <span className="capitalize">{scheduleFrequency}</span>
              </p>
              {scheduleFrequency !== 'custom' && totalRounds && (
                <p>
                  <span className="font-medium">Total rounds:</span> {totalRounds}
                </p>
              )}
              {scheduleFrequency === 'custom' && (
                <p>
                  <span className="font-medium">Total rounds:</span>{' '}
                  {customRoundDates.length}
                </p>
              )}
              {allRoundDatesForReview.length > 0 && (
                <div>
                  <span className="font-medium">Round dates: </span>
                  {allRoundDatesForReview.length <= 6 ? (
                    <span>{allRoundDatesForReview.join(', ')}</span>
                  ) : (
                    <span>
                      {allRoundDatesForReview.slice(0, 6).join(', ')} and{' '}
                      {allRoundDatesForReview.length - 6} more
                    </span>
                  )}
                </div>
              )}
              <p>
                <span className="font-medium">Byes:</span> {hasByes ? 'Yes' : 'No'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================== Navigation ==================== */}
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
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
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
            Next <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleFinish}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Creating...
              </>
            ) : (
              <>Create {config.singularLabel}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
