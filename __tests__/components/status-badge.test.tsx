import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '@/components/shared/status-badge';

describe('StatusBadge', () => {
  // -------------------------------------------------------------------------
  // Text rendering
  // -------------------------------------------------------------------------
  describe('text rendering', () => {
    it('renders "Active" for status "active"', () => {
      render(<StatusBadge status="active" />);
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders "Pending" for status "pending"', () => {
      render(<StatusBadge status="pending" />);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('renders "Suspended" for status "suspended"', () => {
      render(<StatusBadge status="suspended" />);
      expect(screen.getByText('Suspended')).toBeInTheDocument();
    });

    it('renders "Inactive" for status "inactive"', () => {
      render(<StatusBadge status="inactive" />);
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });

    it('renders "Paid" for status "paid"', () => {
      render(<StatusBadge status="paid" />);
      expect(screen.getByText('Paid')).toBeInTheDocument();
    });

    it('renders "Overdue" for status "overdue"', () => {
      render(<StatusBadge status="overdue" />);
      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('renders "Scheduled" for status "scheduled"', () => {
      render(<StatusBadge status="scheduled" />);
      expect(screen.getByText('Scheduled')).toBeInTheDocument();
    });

    it('renders "Completed" for status "completed"', () => {
      render(<StatusBadge status="completed" />);
      expect(screen.getByText('Completed')).toBeInTheDocument();
    });

    it('converts underscores to spaces in display label', () => {
      render(<StatusBadge status="in_progress" />);
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });

    it('uses custom label when provided', () => {
      render(<StatusBadge status="active" label="Currently Active" />);
      expect(screen.getByText('Currently Active')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Green styling for active
  // -------------------------------------------------------------------------
  describe('active status', () => {
    it('has emerald (green) styling for "active"', () => {
      render(<StatusBadge status="active" />);
      const badge = screen.getByText('Active');
      expect(badge.className).toMatch(/emerald/);
    });

    it('has emerald (green) styling for "paid"', () => {
      render(<StatusBadge status="paid" />);
      const badge = screen.getByText('Paid');
      expect(badge.className).toMatch(/emerald/);
    });

    it('has emerald (green) styling for "completed"', () => {
      render(<StatusBadge status="completed" />);
      const badge = screen.getByText('Completed');
      expect(badge.className).toMatch(/emerald/);
    });
  });

  // -------------------------------------------------------------------------
  // Amber styling for pending/warning states
  // -------------------------------------------------------------------------
  describe('pending status', () => {
    it('has amber styling for "pending"', () => {
      render(<StatusBadge status="pending" />);
      const badge = screen.getByText('Pending');
      expect(badge.className).toMatch(/amber/);
    });

    it('has amber styling for "postponed"', () => {
      render(<StatusBadge status="postponed" />);
      const badge = screen.getByText('Postponed');
      expect(badge.className).toMatch(/amber/);
    });
  });

  // -------------------------------------------------------------------------
  // Red styling for error states
  // -------------------------------------------------------------------------
  describe('suspended / error status', () => {
    it('has red styling for "suspended"', () => {
      render(<StatusBadge status="suspended" />);
      const badge = screen.getByText('Suspended');
      expect(badge.className).toMatch(/red/);
    });

    it('has red styling for "overdue"', () => {
      render(<StatusBadge status="overdue" />);
      const badge = screen.getByText('Overdue');
      expect(badge.className).toMatch(/red/);
    });

    it('has red styling for "cancelled"', () => {
      render(<StatusBadge status="cancelled" />);
      const badge = screen.getByText('Cancelled');
      expect(badge.className).toMatch(/red/);
    });
  });

  // -------------------------------------------------------------------------
  // Gray styling for inactive / default states
  // -------------------------------------------------------------------------
  describe('inactive status', () => {
    it('has gray styling for "inactive"', () => {
      render(<StatusBadge status="inactive" />);
      const badge = screen.getByText('Inactive');
      expect(badge.className).toMatch(/gray/);
    });

    it('has gray styling for "refunded"', () => {
      render(<StatusBadge status="refunded" />);
      const badge = screen.getByText('Refunded');
      expect(badge.className).toMatch(/gray/);
    });

    it('has gray styling for "bye"', () => {
      render(<StatusBadge status="bye" />);
      const badge = screen.getByText('Bye');
      expect(badge.className).toMatch(/gray/);
    });
  });

  // -------------------------------------------------------------------------
  // Unknown status falls back to default (gray)
  // -------------------------------------------------------------------------
  describe('unknown status', () => {
    it('defaults to gray styling for an unknown status string', () => {
      render(<StatusBadge status="some_unknown_status" />);
      const badge = screen.getByText('Some Unknown Status');
      expect(badge.className).toMatch(/gray/);
    });

    it('still renders the capitalised label for unknown status', () => {
      render(<StatusBadge status="mystery" />);
      expect(screen.getByText('Mystery')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Blue styling for info states
  // -------------------------------------------------------------------------
  describe('info status', () => {
    it('has blue styling for "scheduled"', () => {
      render(<StatusBadge status="scheduled" />);
      const badge = screen.getByText('Scheduled');
      expect(badge.className).toMatch(/blue/);
    });

    it('has blue styling for "in_progress"', () => {
      render(<StatusBadge status="in_progress" />);
      const badge = screen.getByText('In Progress');
      expect(badge.className).toMatch(/blue/);
    });
  });

  // -------------------------------------------------------------------------
  // className prop
  // -------------------------------------------------------------------------
  describe('className prop', () => {
    it('applies additional className to the badge element', () => {
      render(<StatusBadge status="active" className="my-custom-class" />);
      const badge = screen.getByText('Active');
      expect(badge.className).toContain('my-custom-class');
    });
  });
});
