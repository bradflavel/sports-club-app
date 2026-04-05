'use client';

import Link from 'next/link';
import type { Organisation, ClubVenue, MembershipTypeRecord } from '@/lib/supabase/database.types';

interface CompletionItem {
  label: string;
  completed: boolean;
  editTab: string;
  category: string;
}

export function getCompletionItems(
  org: Organisation,
  venues: ClubVenue[],
  membershipTypes: MembershipTypeRecord[]
): CompletionItem[] {
  return [
    { label: 'Club name', completed: !!org.name, editTab: 'details', category: 'Details' },
    { label: 'Sport type', completed: !!org.sport_type, editTab: 'details', category: 'Details' },
    { label: 'Club logo', completed: !!org.logo_url, editTab: 'details', category: 'Details' },
    { label: 'ABN', completed: !!org.abn, editTab: 'details', category: 'Details' },
    { label: 'Timezone', completed: !!org.timezone, editTab: 'details', category: 'Details' },
    { label: 'State', completed: !!org.state, editTab: 'details', category: 'Details' },
    { label: 'Contact email', completed: !!org.contact_email, editTab: 'contact', category: 'Contact' },
    { label: 'Contact phone', completed: !!org.contact_phone, editTab: 'contact', category: 'Contact' },
    { label: 'Website', completed: !!org.website, editTab: 'contact', category: 'Contact' },
    { label: 'At least one venue', completed: venues.length > 0, editTab: 'venues', category: 'Venues' },
    { label: 'Primary venue set', completed: venues.some((v) => v.is_primary), editTab: 'venues', category: 'Venues' },
    { label: 'Governing body', completed: !!org.affiliated_body, editTab: 'affiliations', category: 'Affiliations' },
    { label: 'Insurance provider', completed: !!org.insurance_provider, editTab: 'affiliations', category: 'Affiliations' },
    { label: 'Insurance policy number', completed: !!org.insurance_policy_number, editTab: 'affiliations', category: 'Affiliations' },
    { label: 'Membership types configured', completed: membershipTypes.length > 0, editTab: 'membership', category: 'Membership' },
    { label: 'Bank details', completed: !!(org.bank_bsb && org.bank_account_number), editTab: 'financials', category: 'Financials' },
    { label: 'Payment terms', completed: !!org.default_payment_terms_days, editTab: 'financials', category: 'Financials' },
    { label: 'Privacy policy', completed: !!org.privacy_policy_url, editTab: 'legal', category: 'Legal' },
    { label: 'Child safety policy', completed: !!org.child_safety_policy_url, editTab: 'legal', category: 'Legal' },
  ];
}

export function getCompletionPercentage(
  org: Organisation,
  venues: ClubVenue[],
  membershipTypes: MembershipTypeRecord[]
): number {
  const items = getCompletionItems(org, venues, membershipTypes);
  return Math.round((items.filter((i) => i.completed).length / items.length) * 100);
}

/**
 * Small circular progress ring with percentage, links to the completion detail page.
 * Renders nothing at 100%.
 */
interface ClubCompletionBadgeProps {
  organisation: Organisation;
  venues: ClubVenue[];
  membershipTypes: MembershipTypeRecord[];
}

export function ClubCompletionBadge({ organisation, venues, membershipTypes }: ClubCompletionBadgeProps) {
  const percentage = getCompletionPercentage(organisation, venues, membershipTypes);

  if (percentage === 100) return null;

  // SVG circular progress
  const size = 44;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 75 ? 'text-emerald-500' : percentage >= 40 ? 'text-amber-500' : 'text-red-500';

  return (
    <Link
      href="/club/completion"
      className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
      title={`Profile ${percentage}% complete — click to see what's missing`}
    >
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/40"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold">
          {percentage}%
        </span>
      </div>
    </Link>
  );
}
