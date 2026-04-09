import { describe, it, expect } from 'vitest';
import {
  cn,
  generateSlug,
  isValidSlug,
  getActivityPath,
  getActivityListPath,
  getInitials,
  truncate,
} from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('merges Tailwind classes correctly', () => {
    const result = cn('px-4 py-2', 'px-8');
    expect(result).toContain('px-8');
    expect(result).not.toContain('px-4');
  });
});

describe('generateSlug', () => {
  it('converts name to lowercase slug with suffix', () => {
    const slug = generateSlug('Riverside FC');
    expect(slug).toMatch(/^riverside-fc-[a-f0-9]{4}$/);
  });

  it('replaces special characters with hyphens', () => {
    const slug = generateSlug('Club & Team (2025)');
    expect(slug).toMatch(/^club-team-2025-[a-f0-9]{4}$/);
  });

  it('strips leading and trailing hyphens from the base', () => {
    const slug = generateSlug('  Hello World  ');
    expect(slug).toMatch(/^hello-world-[a-f0-9]{4}$/);
  });
});

describe('isValidSlug', () => {
  it('accepts valid slugs', () => {
    expect(isValidSlug('riverside-fc-a1b2')).toBe(true);
    expect(isValidSlug('club2025')).toBe(true);
  });

  it('rejects slugs starting with hyphen', () => {
    expect(isValidSlug('-invalid')).toBe(false);
  });

  it('rejects slugs ending with hyphen', () => {
    expect(isValidSlug('invalid-')).toBe(false);
  });

  it('rejects slugs with uppercase', () => {
    expect(isValidSlug('Invalid')).toBe(false);
  });

  it('rejects slugs that are too short', () => {
    expect(isValidSlug('ab')).toBe(false);
  });

  it('rejects slugs that are too long', () => {
    const longSlug = 'a' + 'b'.repeat(49) + 'c';
    expect(isValidSlug(longSlug)).toBe(false);
  });
});

describe('getActivityPath', () => {
  it('maps competition type to /competitions/', () => {
    expect(getActivityPath('competition', 'winter-2025')).toBe('/competitions/winter-2025');
  });

  it('maps tournament type to /tournaments/', () => {
    expect(getActivityPath('tournament', 'cup-2025')).toBe('/tournaments/cup-2025');
  });

  it('maps training_session to /training/', () => {
    expect(getActivityPath('training_session', 'monday-drill')).toBe('/training/monday-drill');
  });

  it('maps training_camp to /camps/', () => {
    expect(getActivityPath('training_camp', 'summer-camp')).toBe('/camps/summer-camp');
  });

  it('maps trials to /trials/', () => {
    expect(getActivityPath('trials', 'senior-trials')).toBe('/trials/senior-trials');
  });

  it('defaults unknown types to /activities/', () => {
    expect(getActivityPath('unknown_type', 'some-slug')).toBe('/activities/some-slug');
  });
});

describe('getActivityListPath', () => {
  it('returns list path for activity type', () => {
    expect(getActivityListPath('competition')).toBe('/competitions');
  });

  it('appends parent filter when provided', () => {
    expect(getActivityListPath('competition', 'parent-123')).toBe('/competitions?parent=parent-123');
  });

  it('defaults unknown types to /activities', () => {
    expect(getActivityListPath('other')).toBe('/activities');
  });
});

describe('getInitials', () => {
  it('returns uppercase initials from first and last name', () => {
    expect(getInitials('John', 'Smith')).toBe('JS');
  });

  it('handles lowercase input', () => {
    expect(getInitials('jane', 'doe')).toBe('JD');
  });
});

describe('truncate', () => {
  it('returns string unchanged when shorter than limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and adds ellipsis when longer than limit', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...');
  });

  it('returns string unchanged when exactly at limit', () => {
    expect(truncate('Hello', 5)).toBe('Hello');
  });
});
