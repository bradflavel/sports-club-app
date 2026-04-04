import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemberForm } from '@/features/members/components/member-form';

// Next.js components used inside MemberForm are not needed for unit tests
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// Radix Select uses pointer events not supported in jsdom. Replace it with a
// simple native <select> that calls onValueChange on change so react-hook-form
// receives the value properly.
vi.mock('@/components/ui/select', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require('react');

  // We track the latest onValueChange so SelectContent's native select can call it.
  let currentOnValueChange: ((v: string) => void) | undefined;

  const Select = ({ onValueChange, children }: { value?: string; onValueChange?: (v: string) => void; children: React.ReactNode }) => {
    currentOnValueChange = onValueChange;
    return React.createElement(React.Fragment, null, children);
  };
  const SelectTrigger = ({ children, id }: { children: React.ReactNode; id?: string }) =>
    React.createElement('div', { id }, children);
  const SelectValue = ({ placeholder }: { placeholder?: string }) =>
    React.createElement('span', null, placeholder ?? '');
  const SelectContent = ({ children }: { children: React.ReactNode }) =>
    React.createElement(
      'select',
      {
        'data-testid': 'membership-type-select',
        onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
          currentOnValueChange?.(e.target.value);
        },
      },
      children
    );
  const SelectItem = ({ value, children }: { value: string; children: React.ReactNode }) =>
    React.createElement('option', { value }, children);

  return { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
});

describe('MemberForm', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe('field rendering', () => {
    it('renders the First Name field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    });

    it('renders the Last Name field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    });

    it('renders the Email field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it('renders the Phone field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      // Use exact label text to avoid matching "Contact Phone"
      expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    });

    it('renders the Date of Birth field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    });

    it('renders the Membership Type selector', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByTestId('membership-type-select')).toBeInTheDocument();
    });

    it('renders the Registration Date field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/registration date/i)).toBeInTheDocument();
    });

    it('renders the Medical Conditions textarea', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/medical conditions/i)).toBeInTheDocument();
    });

    it('renders the Dietary Requirements textarea', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/dietary requirements/i)).toBeInTheDocument();
    });

    it('renders the Emergency Contact Name field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
    });

    it('renders the Emergency Contact Phone field', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
    });

    it('renders an "Add Member" submit button when no defaultValues', () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument();
    });

    it('renders "Save Changes" button when defaultValues are provided', () => {
      render(
        <MemberForm
          onSubmit={mockOnSubmit}
          defaultValues={{ firstName: 'Jane', lastName: 'Doe' }}
        />
      );
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------
  describe('validation', () => {
    it('shows validation error for missing firstName on submit', async () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);
      const submitButton = screen.getByRole('button', { name: /add member/i });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for missing lastName on submit', async () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);

      fireEvent.input(screen.getByLabelText(/first name/i), {
        target: { value: 'Jane' },
      });

      fireEvent.click(screen.getByRole('button', { name: /add member/i }));

      await waitFor(() => {
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      });
    });

    it('shows validation error for invalid email', async () => {
      const user = userEvent.setup();
      render(<MemberForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      // Use fireEvent.change on the email input to bypass native type=email browser
      // validation and let React Hook Form handle validation itself.
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
      await user.type(screen.getByLabelText(/registration date/i), '2024-01-15');
      fireEvent.change(screen.getByTestId('membership-type-select'), { target: { value: 'senior' } });

      // Submit the form directly to trigger RHF validation
      fireEvent.submit(screen.getByRole('button', { name: /add member/i }).closest('form')!);

      await waitFor(() => {
        // The zod schema message is "Please enter a valid email"
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('does not call onSubmit when required fields are empty', async () => {
      render(<MemberForm onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByRole('button', { name: /add member/i }));

      await waitFor(() => {
        expect(mockOnSubmit).not.toHaveBeenCalled();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Successful submission
  // -------------------------------------------------------------------------
  describe('successful submission', () => {
    it('calls onSubmit with valid form data', async () => {
      const user = userEvent.setup();
      render(<MemberForm onSubmit={mockOnSubmit} />);

      await user.type(screen.getByLabelText(/first name/i), 'Jane');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/email/i), 'jane@example.com');
      await user.type(screen.getByLabelText(/registration date/i), '2024-01-15');

      // Select membership type via the mocked native <select>
      const nativeSelect = screen.getByTestId('membership-type-select');
      fireEvent.change(nativeSelect, { target: { value: 'senior' } });

      fireEvent.click(screen.getByRole('button', { name: /add member/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledOnce();
      });

      const submittedData = mockOnSubmit.mock.calls[0][0];
      expect(submittedData.firstName).toBe('Jane');
      expect(submittedData.lastName).toBe('Doe');
      expect(submittedData.email).toBe('jane@example.com');
      expect(submittedData.membershipType).toBe('senior');
    });

    it('shows loading spinner when loading prop is true', () => {
      render(<MemberForm onSubmit={mockOnSubmit} loading />);
      // The submit button should be disabled
      expect(screen.getByRole('button', { name: /add member/i })).toBeDisabled();
    });
  });
});
