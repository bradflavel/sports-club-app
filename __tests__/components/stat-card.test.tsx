import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from '@/components/shared/stat-card';
import { Users } from 'lucide-react';

describe('StatCard', () => {
  it('renders title and value', () => {
    render(<StatCard title="Total Members" value={150} icon={Users} />);

    expect(screen.getByText('Total Members')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
  });

  it('renders string value', () => {
    render(<StatCard title="Revenue" value="$1,250" icon={Users} />);

    expect(screen.getByText('$1,250')).toBeInTheDocument();
  });

  it('renders subtitle when provided', () => {
    render(<StatCard title="Members" value={50} icon={Users} subtitle="this month" />);

    expect(screen.getByText('this month')).toBeInTheDocument();
  });

  it('renders trend when provided', () => {
    render(<StatCard title="Members" value={50} icon={Users} trend="+12%" />);

    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders both trend and subtitle', () => {
    render(
      <StatCard title="Members" value={50} icon={Users} trend="+5%" subtitle="vs last month" />
    );

    expect(screen.getByText('+5%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('does not render subtitle area when neither trend nor subtitle provided', () => {
    const { container } = render(<StatCard title="Members" value={50} icon={Users} />);

    // Only the title and value paragraph elements should be present
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2); // title + value only
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatCard title="Members" value={50} icon={Users} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
