'use client';

import {
  Mail,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Star,
  Shield,
  Landmark,
  FileText,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SPORT_CONFIGS } from '@/lib/constants';
import { ClubCompletionBadge } from './club-completion-tracker';
import { AU_STATE_OPTIONS } from '@/lib/constants';
import type { Organisation, ClubVenue, MembershipTypeRecord } from '@/lib/supabase/database.types';

interface ClubProfileViewProps {
  organisation: Organisation;
  venues: ClubVenue[];
  membershipTypes: MembershipTypeRecord[];
  isAdmin: boolean;
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm text-right">{value || <span className="text-muted-foreground/50 italic">Not set</span>}</span>
    </div>
  );
}

export function ClubProfileView({ organisation, venues, membershipTypes, isAdmin }: ClubProfileViewProps) {
  const sportLabel =
    SPORT_CONFIGS[organisation.sport_type]?.label ?? organisation.sport_type;

  const hasSocial =
    organisation.facebook_url ||
    organisation.instagram_url ||
    organisation.youtube_url ||
    organisation.tiktok_url;

  const hasPolicies =
    organisation.privacy_policy_url ||
    organisation.terms_conditions_url ||
    organisation.code_of_conduct_url ||
    organisation.child_safety_policy_url;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          {organisation.logo_url ? (
            <img
              src={organisation.logo_url}
              alt={`${organisation.name} logo`}
              className="h-16 w-auto max-w-16 rounded-lg object-contain border"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-lg border text-2xl font-bold text-white"
              style={{ backgroundColor: organisation.primary_colour }}
            >
              {organisation.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{organisation.name}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{sportLabel}</Badge>
              {organisation.registration_open === false && (
                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Registration Closed</Badge>
              )}
              <div className="flex items-center gap-1.5">
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: organisation.primary_colour }}
                  title="Primary colour"
                />
                <span
                  className="inline-block h-4 w-4 rounded-full border"
                  style={{ backgroundColor: organisation.secondary_colour }}
                  title="Secondary colour"
                />
              </div>
            </div>
          </div>
          {isAdmin && (
            <ClubCompletionBadge
              organisation={organisation}
              venues={venues}
              membershipTypes={membershipTypes}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {/* Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {organisation.contact_email ? (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${organisation.contact_email}`} className="text-primary hover:underline">
                  {organisation.contact_email}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/50 italic">
                <Mail className="h-4 w-4" />
                No email set
              </div>
            )}
            {organisation.contact_phone ? (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${organisation.contact_phone}`} className="text-primary hover:underline">
                  {organisation.contact_phone}
                </a>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground/50 italic">
                <Phone className="h-4 w-4" />
                No phone set
              </div>
            )}
            {organisation.website && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <a href={organisation.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {organisation.website}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Venues Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              Venues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {venues.length > 0 ? (
              <div className="space-y-3">
                {venues.map((venue, idx) => (
                  <div key={venue.id}>
                    {idx > 0 && <Separator className="mb-3" />}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{venue.name}</span>
                      {venue.is_primary && (
                        <Badge variant="outline" className="text-xs">
                          <Star className="mr-1 h-3 w-3" /> Primary
                        </Badge>
                      )}
                    </div>
                    {venue.address && <p className="text-sm text-muted-foreground mt-0.5">{venue.address}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No venues added</p>
            )}
          </CardContent>
        </Card>

        {/* Social Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasSocial ? (
              <div className="flex flex-wrap gap-2">
                {organisation.facebook_url && (
                  <a href={organisation.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    <ExternalLink className="h-3.5 w-3.5" /> Facebook
                  </a>
                )}
                {organisation.instagram_url && (
                  <a href={organisation.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    <ExternalLink className="h-3.5 w-3.5" /> Instagram
                  </a>
                )}
                {organisation.youtube_url && (
                  <a href={organisation.youtube_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    <ExternalLink className="h-3.5 w-3.5" /> YouTube
                  </a>
                )}
                {organisation.tiktok_url && (
                  <a href={organisation.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
                    <ExternalLink className="h-3.5 w-3.5" /> TikTok
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No social links added</p>
            )}
          </CardContent>
        </Card>

        {/* Affiliation Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Affiliation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <DetailRow label="Governing Body" value={organisation.affiliated_body} />
            <DetailRow label="Affiliation #" value={organisation.affiliation_number} />
          </CardContent>
        </Card>

        {/* Policies Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Policies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasPolicies ? (
              <div className="space-y-2">
                {organisation.privacy_policy_url && (
                  <a href={organisation.privacy_policy_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Privacy Policy
                  </a>
                )}
                {organisation.terms_conditions_url && (
                  <a href={organisation.terms_conditions_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Terms &amp; Conditions
                  </a>
                )}
                {organisation.code_of_conduct_url && (
                  <a href={organisation.code_of_conduct_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Code of Conduct
                  </a>
                )}
                {organisation.child_safety_policy_url && (
                  <a href={organisation.child_safety_policy_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline">
                    <ExternalLink className="h-3.5 w-3.5" /> Child Safety Policy
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No policies linked</p>
            )}
          </CardContent>
        </Card>

        {/* Fee Schedule Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Membership Fees
            </CardTitle>
          </CardHeader>
          <CardContent>
            {membershipTypes.length > 0 ? (
              <div className="space-y-2">
                {membershipTypes.filter((t) => t.is_active).map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span>{t.name}</span>
                    <span className="font-medium">${((t.fee_cents ?? 0) / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No membership types configured</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Admin-only sections ─────────────────────────────────────────── */}
      {isAdmin && (
        <>
          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Admin Only</p>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Business Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Business Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <DetailRow label="State" value={organisation.state ? (AU_STATE_OPTIONS.find((o) => o.value === organisation.state)?.label ?? organisation.state) : null} />
                <DetailRow label="ABN" value={organisation.abn} />
                <DetailRow label="Entity Name" value={organisation.abn_entity_name} />
                <DetailRow label="GST Registered" value={organisation.is_gst_registered ? 'Yes' : 'No'} />
                <DetailRow label="Timezone" value={organisation.timezone} />
              </CardContent>
            </Card>

            {/* Insurance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Insurance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <DetailRow label="Provider" value={organisation.insurance_provider} />
                <DetailRow label="Policy #" value={organisation.insurance_policy_number} />
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  Bank Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <DetailRow label="Bank" value={organisation.bank_name} />
                <DetailRow label="BSB" value={organisation.bank_bsb} />
                <DetailRow label="Account #" value={organisation.bank_account_number} />
                <DetailRow label="Account Name" value={organisation.bank_account_name} />
              </CardContent>
            </Card>

            {/* Payment Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Payment Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <DetailRow label="Payment Terms" value={organisation.default_payment_terms_days ? `${organisation.default_payment_terms_days} days` : null} />
                <DetailRow label="Late Fee" value={organisation.late_fee_cents ? `$${(organisation.late_fee_cents / 100).toFixed(2)}` : null} />
              </CardContent>
            </Card>

            {/* Membership Config */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Membership Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <DetailRow label="Minimum Age" value={organisation.minimum_age ? `${organisation.minimum_age} years` : null} />
                <DetailRow label="Registration" value={organisation.registration_open === false ? 'Closed' : 'Open'} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
