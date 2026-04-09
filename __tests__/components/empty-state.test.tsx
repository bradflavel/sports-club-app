import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/shared/empty-state';
import { Users } from 'lucide-react';

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(
      <EmptyState icon={Users} title="No members" description="Add your first member to get started." />
    );

    expect(screen.getByText('No members')).toBeInTheDocument();
    expect(screen.getByText('Add your first member to get started.')).toBeInTheDocument();
  });

  it('renders action button when actionLabel is provided', () => {
    render(
      <EmptyState
        icon={Users}
        title="No members"
        description="Get started."
        actionLabel="Add Member"
        onAction={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
  });

  it('calls onAction when button is clicked', async () => {
    const onAction = vi.fn();
    render(
      <EmptyState
        icon={Users}
        title="No members"
        description="Get started."
        actionLabel="Add Member"
        onAction={onAction}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: 'Add Member' }));

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renders action as link when actionHref is provided', () => {
    render(
      <EmptyState
        icon={Users}
        title="No members"
        description="Get started."
        actionLabel="Add Member"
        actionHref="/members/new"
      />
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/members/new');
  });

  it('does not render action button when no actionLabel', () => {
    render(
      <EmptyState icon={Users} title="No members" description="Nothing here." />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
