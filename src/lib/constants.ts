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
