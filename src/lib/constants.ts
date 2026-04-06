export type SportType =
  | 'rugby_league'
  | 'rugby_union'
  | 'cricket'
  | 'soccer'
  | 'netball'
  | 'basketball'
  | 'hockey'
  | 'afl'
  | 'touch_football'
  | 'volleyball'
  | 'other';

export type SportConfig = {
  label: string;
  matchLabel: string;
  periodLabel: string;
  scoreLabel: string;
  positionLabels: string[];
  defaultMaxPlayers: number;
};

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  rugby_league: {
    label: 'Rugby League',
    matchLabel: 'Match',
    periodLabel: 'Half',
    scoreLabel: 'Points',
    positionLabels: [
      'Fullback',
      'Wing',
      'Centre',
      'Five-eighth',
      'Halfback',
      'Hooker',
      'Prop',
      'Second Row',
      'Lock',
      'Interchange',
    ],
    defaultMaxPlayers: 17,
  },
  rugby_union: {
    label: 'Rugby Union',
    matchLabel: 'Match',
    periodLabel: 'Half',
    scoreLabel: 'Points',
    positionLabels: [
      'Loosehead Prop',
      'Hooker',
      'Tighthead Prop',
      'Lock',
      'Blindside Flanker',
      'Openside Flanker',
      'Number Eight',
      'Scrum-half',
      'Fly-half',
      'Inside Centre',
      'Outside Centre',
      'Wing',
      'Fullback',
    ],
    defaultMaxPlayers: 23,
  },
  cricket: {
    label: 'Cricket',
    matchLabel: 'Match',
    periodLabel: 'Innings',
    scoreLabel: 'Runs',
    positionLabels: ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'],
    defaultMaxPlayers: 15,
  },
  soccer: {
    label: 'Soccer',
    matchLabel: 'Match',
    periodLabel: 'Half',
    scoreLabel: 'Goals',
    positionLabels: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
    defaultMaxPlayers: 23,
  },
  netball: {
    label: 'Netball',
    matchLabel: 'Match',
    periodLabel: 'Quarter',
    scoreLabel: 'Goals',
    positionLabels: ['GS', 'GA', 'WA', 'C', 'WD', 'GD', 'GK'],
    defaultMaxPlayers: 12,
  },
  basketball: {
    label: 'Basketball',
    matchLabel: 'Game',
    periodLabel: 'Quarter',
    scoreLabel: 'Points',
    positionLabels: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Centre'],
    defaultMaxPlayers: 15,
  },
  hockey: {
    label: 'Hockey',
    matchLabel: 'Match',
    periodLabel: 'Half',
    scoreLabel: 'Goals',
    positionLabels: ['Goalkeeper', 'Fullback', 'Half-back', 'Midfielder', 'Inner', 'Wing', 'Striker'],
    defaultMaxPlayers: 18,
  },
  afl: {
    label: 'AFL',
    matchLabel: 'Match',
    periodLabel: 'Quarter',
    scoreLabel: 'Points',
    positionLabels: [
      'Full Forward',
      'Half Forward',
      'Centre',
      'Half Back',
      'Full Back',
      'Ruck',
      'Rover',
      'Ruck Rover',
      'Interchange',
    ],
    defaultMaxPlayers: 22,
  },
  touch_football: {
    label: 'Touch Football',
    matchLabel: 'Game',
    periodLabel: 'Half',
    scoreLabel: 'Tries',
    positionLabels: ['Middle', 'Link', 'Wing'],
    defaultMaxPlayers: 14,
  },
  volleyball: {
    label: 'Volleyball',
    matchLabel: 'Match',
    periodLabel: 'Set',
    scoreLabel: 'Sets',
    positionLabels: [
      'Setter',
      'Outside Hitter',
      'Opposite',
      'Middle Blocker',
      'Libero',
      'Defensive Specialist',
    ],
    defaultMaxPlayers: 14,
  },
  other: {
    label: 'Other',
    matchLabel: 'Match',
    periodLabel: 'Period',
    scoreLabel: 'Score',
    positionLabels: [],
    defaultMaxPlayers: 20,
  },
};

export const SPORT_TYPE_OPTIONS = Object.entries(SPORT_CONFIGS).map(([value, config]) => ({
  value: value as SportType,
  label: config.label,
}));

export const MEMBERSHIP_TYPE_OPTIONS = [
  { value: 'senior', label: 'Senior' },
  { value: 'junior', label: 'Junior' },
  { value: 'social', label: 'Social' },
  { value: 'life', label: 'Life' },
  { value: 'volunteer', label: 'Volunteer' },
] as const;

export const MEMBERSHIP_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
] as const;

export const FIXTURE_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'bye', label: 'Bye' },
] as const;

export const PAYMENT_TYPE_OPTIONS = [
  { value: 'membership_fee', label: 'Membership Fee' },
  { value: 'match_fee', label: 'Match Fee' },
  { value: 'fine', label: 'Fine' },
  { value: 'merchandise', label: 'Merchandise' },
  { value: 'event', label: 'Event' },
  { value: 'trial_fee', label: 'Trial Fee' },
  { value: 'other', label: 'Other' },
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'refunded', label: 'Refunded' },
] as const;

export const DOCUMENT_CATEGORY_OPTIONS = [
  { value: 'policy', label: 'Policy' },
  { value: 'minutes', label: 'Minutes' },
  { value: 'report', label: 'Report' },
  { value: 'form', label: 'Form' },
  { value: 'constitution', label: 'Constitution' },
  { value: 'other', label: 'Other' },
] as const;

export const AU_STATE_OPTIONS = [
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'WA', label: 'Western Australia' },
] as const;

// Default membership types created for new organisations
export const DEFAULT_MEMBERSHIP_TYPES = [
  { name: 'Senior', fee_cents: 0, has_expiry: true, default_duration_months: 12 },
  { name: 'Junior', fee_cents: 0, has_expiry: true, default_duration_months: 12 },
  { name: 'Social', fee_cents: 0, has_expiry: true, default_duration_months: 12 },
  { name: 'Life', fee_cents: 0, has_expiry: false, default_duration_months: null },
  { name: 'Volunteer', fee_cents: 0, has_expiry: true, default_duration_months: 12 },
] as const;

// Activity module system
export const ACTIVITY_TYPE_CONFIG = {
  competition: {
    label: 'Competitions',
    singularLabel: 'Competition',
    icon: 'Trophy',
    description: 'Seasonal competitions with rounds, ladders, and finals',
    navHref: '/competitions',
  },
  tournament: {
    label: 'Tournaments',
    singularLabel: 'Tournament',
    icon: 'Award',
    description: 'Short-term events over 1-3 days with pools and brackets',
    navHref: '/tournaments',
  },
  training_session: {
    label: 'Training',
    singularLabel: 'Training Session',
    icon: 'Dumbbell',
    description: 'Recurring or one-off training sessions with attendance tracking',
    navHref: '/training',
  },
  training_camp: {
    label: 'Camps',
    singularLabel: 'Training Camp',
    icon: 'Tent',
    description: 'Multi-day training camps with scheduled sessions',
    navHref: '/camps',
  },
  trials: {
    label: 'Trials',
    singularLabel: 'Trials',
    icon: 'ClipboardCheck',
    description: 'Selection trials linked to a competition',
    navHref: '/trials',
  },
} as const;

// Map activity_type to URL path segment
export const ACTIVITY_TYPE_ROUTE_MAP: Record<string, string> = {
  competition: 'competitions',
  tournament: 'tournaments',
  training_session: 'training',
  training_camp: 'camps',
  trials: 'trials',
} as const;

// Reverse map: URL path segment to activity_type
export const ROUTE_TO_ACTIVITY_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(ACTIVITY_TYPE_ROUTE_MAP).map(([k, v]) => [v, k])
);

export const ACTIVITY_TYPE_OPTIONS = Object.entries(ACTIVITY_TYPE_CONFIG).map(
  ([value, config]) => ({
    value: value as import('@/lib/supabase/database.types').ActivityType,
    label: config.singularLabel,
  })
);

export const PARTICIPATION_MODE_OPTIONS = [
  { value: 'participant', label: 'Participating', description: 'Your club is entered in this activity' },
  { value: 'organiser', label: 'Organising', description: 'Your club is running this activity' },
] as const;

export const EVENT_STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'postponed', label: 'Postponed' },
  { value: 'bye', label: 'Bye' },
] as const;

export const ATTENDANCE_STATUS_OPTIONS = [
  { value: 'attending', label: 'Attending' },
  { value: 'not_attending', label: 'Not Attending' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'attended', label: 'Attended' },
  { value: 'absent', label: 'Absent' },
  { value: 'late', label: 'Late' },
] as const;

export const TOURNAMENT_STAGE_OPTIONS = [
  { value: 'pool', label: 'Pool Play' },
  { value: 'quarterfinal', label: 'Quarter Final' },
  { value: 'semifinal', label: 'Semi Final' },
  { value: 'final', label: 'Final' },
  { value: 'third_place', label: 'Third Place' },
  { value: 'round_robin', label: 'Round Robin' },
] as const;
