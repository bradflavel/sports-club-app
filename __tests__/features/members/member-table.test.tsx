import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemberTable } from '@/features/members/components/member-table';
import type { MemberWithProfile } from '@/lib/supabase/database.types';

// MemberTable uses Next.js <Link> and lucide icons — mock both
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeProfile(overrides?: Partial<MemberWithProfile['profile']>): MemberWithProfile['profile'] {
  return {
    id: 'profile-1',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane@example.com',
    phone: '+61400000001',
    date_of_birth: '1990-01-15',
    avatar_url: null,
    organisation_id: 'org-1',
    role: 'member',
    emergency_contact_name: null,
    emergency_contact_phone: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeMember(overrides?: Partial<MemberWithProfile>): MemberWithProfile {
  return {
    id: 'member-1',
    profile_id: 'profile-1',
    organisation_id: 'org-1',
    membership_type: 'senior',
    membership_status: 'active',
    registration_date: '2024-01-15',
    expiry_date: '2025-01-15',
    medical_conditions: null,
    dietary_requirements: null,
    notes: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    profile: makeProfile(),
    ...overrides,
  };
}

const mockOnDelete = vi.fn();
const mockOnStatusChange = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('MemberTable', () => {
  describe('rendering rows', () => {
    it('renders a row for each member', () => {
      const members = [
        makeMember({ id: 'member-1', profile: makeProfile({ first_name: 'Jane', last_name: 'Doe' }) }),
        makeMember({ id: 'member-2', profile: makeProfile({ id: 'profile-2', first_name: 'John', last_name: 'Smith', email: 'john@example.com' }) }),
      ];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('John Smith')).toBeInTheDocument();
    });

    it('renders member email in each row', () => {
      const members = [
        makeMember({ profile: makeProfile({ email: 'unique@example.com' }) }),
      ];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('unique@example.com')).toBeInTheDocument();
    });

    it('renders the membership type badge', () => {
      const members = [makeMember({ membership_type: 'junior' })];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Junior')).toBeInTheDocument();
    });
  });

  describe('status badges', () => {
    it('renders "Active" status badge with green styling for active members', () => {
      const members = [makeMember({ membership_status: 'active' })];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      const badge = screen.getByText('Active');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/emerald/);
    });

    it('renders "Suspended" status badge with red styling for suspended members', () => {
      const members = [makeMember({ membership_status: 'suspended' })];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      const badge = screen.getByText('Suspended');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/red/);
    });

    it('renders "Inactive" status badge with gray styling for inactive members', () => {
      const members = [makeMember({ membership_status: 'inactive' })];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      const badge = screen.getByText('Inactive');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/gray/);
    });

    it('renders "Pending" status badge with amber styling for pending members', () => {
      const members = [makeMember({ membership_status: 'pending' })];

      render(
        <MemberTable
          members={members}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toMatch(/amber/);
    });
  });

  describe('empty state', () => {
    it('renders "No results." when members array is empty', () => {
      render(
        <MemberTable
          members={[]}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('No results.')).toBeInTheDocument();
    });
  });

  describe('table structure', () => {
    it('renders header columns including Name, Email, Type, Status, Joined', () => {
      render(
        <MemberTable
          members={[]}
          onDelete={mockOnDelete}
          onStatusChange={mockOnStatusChange}
        />
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Joined')).toBeInTheDocument();
    });
  });
});
