import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatCurrency,
  dollarsToCents,
  centsToDollars,
  daysOverdue,
  isOverdue,
} from '@/lib/format';

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------
describe('formatCurrency', () => {
  it('formats 2550 cents as a dollar string', () => {
    const result = formatCurrency(2550);
    // AUD format: "$25.50" — the exact symbol may be "A$" or "$" depending on locale
    expect(result).toContain('25.50');
    expect(result).toMatch(/\$/);
  });

  it('formats zero cents as $0.00', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0.00');
  });

  it('formats 10000 cents as $100.00', () => {
    const result = formatCurrency(10000);
    expect(result).toContain('100.00');
  });

  it('formats 1 cent as $0.01', () => {
    const result = formatCurrency(1);
    expect(result).toContain('0.01');
  });

  it('formats large amounts correctly', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('10,000.00');
  });
});

// ---------------------------------------------------------------------------
// dollarsToCents
// ---------------------------------------------------------------------------
describe('dollarsToCents', () => {
  it('converts 25.50 dollars to 2550 cents', () => {
    expect(dollarsToCents(25.5)).toBe(2550);
  });

  it('converts 0 dollars to 0 cents', () => {
    expect(dollarsToCents(0)).toBe(0);
  });

  it('converts 100 dollars to 10000 cents', () => {
    expect(dollarsToCents(100)).toBe(10000);
  });

  it('rounds fractional cents', () => {
    // 25.555 * 100 = 2555.5 => rounded to 2556
    expect(dollarsToCents(25.555)).toBe(2556);
  });

  it('converts 0.01 dollars to 1 cent', () => {
    expect(dollarsToCents(0.01)).toBe(1);
  });

  it('converts 99.99 dollars to 9999 cents', () => {
    expect(dollarsToCents(99.99)).toBe(9999);
  });
});

// ---------------------------------------------------------------------------
// centsToDollars
// ---------------------------------------------------------------------------
describe('centsToDollars', () => {
  it('converts 2550 cents to 25.5 dollars', () => {
    expect(centsToDollars(2550)).toBe(25.5);
  });

  it('converts 0 cents to 0 dollars', () => {
    expect(centsToDollars(0)).toBe(0);
  });

  it('converts 10000 cents to 100 dollars', () => {
    expect(centsToDollars(10000)).toBe(100);
  });

  it('converts 1 cent to 0.01 dollars', () => {
    expect(centsToDollars(1)).toBe(0.01);
  });

  it('converts 9999 cents to 99.99 dollars', () => {
    expect(centsToDollars(9999)).toBe(99.99);
  });
});

// ---------------------------------------------------------------------------
// daysOverdue
// ---------------------------------------------------------------------------
describe('daysOverdue', () => {
  it('returns 0 for a due date in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 5);
    expect(daysOverdue(futureDate.toISOString())).toBe(0);
  });

  it('returns a positive number for a past due date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 7);
    const result = daysOverdue(pastDate.toISOString());
    expect(result).toBeGreaterThan(0);
  });

  it('returns approximately 30 for a date 30 days ago', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 30);
    const result = daysOverdue(pastDate.toISOString());
    expect(result).toBeGreaterThanOrEqual(29);
    expect(result).toBeLessThanOrEqual(31);
  });

  it('returns 0 for a due date exactly today (not yet overdue)', () => {
    // isBefore(today, today) === false, so daysOverdue returns 0
    const today = new Date().toISOString().split('T')[0];
    // daysOverdue calls isOverdue first; same-day is generally not overdue
    const result = daysOverdue(today + 'T23:59:59Z');
    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// isOverdue
// ---------------------------------------------------------------------------
describe('isOverdue', () => {
  it('returns true for a date in the past', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(isOverdue(pastDate.toISOString())).toBe(true);
  });

  it('returns false for a date in the future', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    expect(isOverdue(futureDate.toISOString())).toBe(false);
  });

  it('returns false for a date far in the future', () => {
    expect(isOverdue('2099-12-31')).toBe(false);
  });

  it('returns true for a date far in the past', () => {
    expect(isOverdue('2000-01-01')).toBe(true);
  });

  it('accepts a Date object as input', () => {
    const pastDate = new Date();
    pastDate.setFullYear(pastDate.getFullYear() - 1);
    expect(isOverdue(pastDate)).toBe(true);
  });
});
