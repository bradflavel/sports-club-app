import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatRelativeDate,
  calculateAge,
  isMinor,
  formatAge,
  formatFileSize,
} from '@/lib/format';

describe('formatDate', () => {
  it('formats date string to dd MMM yyyy', () => {
    expect(formatDate('2025-03-15')).toBe('15 Mar 2025');
  });

  it('formats Date object', () => {
    expect(formatDate(new Date(2025, 0, 1))).toBe('01 Jan 2025');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const result = formatDateTime('2025-03-15T14:30:00');
    expect(result).toContain('15 Mar 2025');
    expect(result).toContain('2:30');
  });
});

describe('formatRelativeDate', () => {
  it('returns a relative string with suffix', () => {
    const result = formatRelativeDate(new Date());
    expect(result).toContain('ago');
  });
});

describe('calculateAge', () => {
  it('calculates age from date of birth', () => {
    // Use a date far enough in the past to always give a stable result
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    dob.setMonth(dob.getMonth() - 1); // ensure birthday has passed
    expect(calculateAge(dob)).toBe(25);
  });

  it('handles date string input', () => {
    const age = calculateAge('2000-01-01');
    expect(age).toBeGreaterThanOrEqual(25);
  });
});

describe('isMinor', () => {
  it('returns true for person under 18', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 10);
    expect(isMinor(dob)).toBe(true);
  });

  it('returns false for person 18 or older', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 20);
    expect(isMinor(dob)).toBe(false);
  });
});

describe('formatAge', () => {
  it('formats age with plural suffix', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 25);
    dob.setMonth(dob.getMonth() - 1);
    expect(formatAge(dob)).toBe('25 yrs');
  });

  it('formats singular year', () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 1);
    dob.setMonth(dob.getMonth() - 1);
    expect(formatAge(dob)).toBe('1 yr');
  });
});

describe('formatFileSize', () => {
  it('formats 0 bytes', () => {
    expect(formatFileSize(0)).toBe('0 Bytes');
  });

  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 Bytes');
  });

  it('formats kilobytes', () => {
    expect(formatFileSize(1024)).toBe('1 KB');
  });

  it('formats megabytes', () => {
    expect(formatFileSize(1048576)).toBe('1 MB');
  });

  it('formats gigabytes', () => {
    expect(formatFileSize(1073741824)).toBe('1 GB');
  });

  it('formats fractional sizes', () => {
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });
});
