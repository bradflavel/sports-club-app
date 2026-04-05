'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { centsToDollars, dollarsToCents } from '@/lib/format';
import {
  getAllMembershipTypes,
  createMembershipType,
  updateMembershipType,
  deleteMembershipType,
} from '@/features/members/services/membership-type-service';
import {
  updateOrganisationDetails,
} from '@/features/club-profile/services/club-profile-service';
import { useOrganisation } from '@/hooks/use-organisation';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import type { MembershipTypeRecord } from '@/lib/supabase/database.types';

interface ClubMembershipConfigProps {
  orgId: string;
  onChanged: () => void;
}

interface TypeFormState {
  name: string;
  description: string;
  feeDollars: string;
  has_expiry: boolean;
  default_duration_months: string;
  auto_renewal: boolean;
  grace_period_days: string;
  is_active: boolean;
}

function emptyForm(): TypeFormState {
  return {
    name: '',
    description: '',
    feeDollars: '0',
    has_expiry: true,
    default_duration_months: '12',
    auto_renewal: false,
    grace_period_days: '0',
    is_active: true,
  };
}

function typeToForm(t: MembershipTypeRecord): TypeFormState {
  return {
    name: t.name,
    description: t.description ?? '',
    feeDollars: String(centsToDollars(t.fee_cents ?? 0)),
    has_expiry: t.has_expiry,
    default_duration_months: t.default_duration_months != null ? String(t.default_duration_months) : '',
    auto_renewal: t.auto_renewal,
    grace_period_days: String(t.grace_period_days),
    is_active: t.is_active,
  };
}

export function ClubMembershipConfig({
  orgId,
  onChanged,
}: ClubMembershipConfigProps) {
  const { toast } = useToast();
  const { organisation } = useOrganisation();

  const [types, setTypes] = useState<MembershipTypeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [form, setForm] = useState<TypeFormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MembershipTypeRecord | null>(null);

  // Membership settings
  const [minimumAge, setMinimumAge] = useState<string>('');
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (organisation) {
      setMinimumAge(organisation.minimum_age != null ? String(organisation.minimum_age) : '');
      setRegistrationOpen(organisation.registration_open ?? false);
    }
  }, [organisation]);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    const { data } = await getAllMembershipTypes(orgId);
    setTypes(data ?? []);
    setLoading(false);
  }, [orgId]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleSettingsSave = async () => {
    if (!organisation) return;
    setSavingSettings(true);
    try {
      const { error } = await updateOrganisationDetails(organisation.id, {
        minimum_age: minimumAge ? Number(minimumAge) : null,
        registration_open: registrationOpen,
      });

      if (error) {
        toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Saved', description: 'Membership settings updated.' });
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  const startEdit = (t: MembershipTypeRecord) => {
    setAddingNew(false);
    setEditingId(t.id);
    setForm(typeToForm(t));
  };

  const startAdd = () => {
    setEditingId(null);
    setAddingNew(true);
    setForm(emptyForm());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setAddingNew(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        fee_cents: dollarsToCents(parseFloat(form.feeDollars) || 0),
        has_expiry: form.has_expiry,
        default_duration_months: form.has_expiry
          ? (parseInt(form.default_duration_months) || 12)
          : null,
        auto_renewal: form.auto_renewal,
        grace_period_days: parseInt(form.grace_period_days) || 0,
        is_active: form.is_active,
      };

      if (addingNew) {
        const { error } = await createMembershipType(orgId, payload);
        if (error) {
          toast({ title: 'Create failed', description: error.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Created', description: `${payload.name} membership type added.` });
      } else if (editingId) {
        const { error } = await updateMembershipType(editingId, payload);
        if (error) {
          toast({ title: 'Save failed', description: error.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Saved', description: `${payload.name} updated.` });
      }

      setEditingId(null);
      setAddingNew(false);
      await fetchTypes();
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const { error } = await deleteMembershipType(deleteTarget.id);
      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Deleted', description: `${deleteTarget.name} removed.` });
      setDeleteTarget(null);
      if (editingId === deleteTarget.id) {
        setEditingId(null);
      }
      await fetchTypes();
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (t: MembershipTypeRecord) => {
    const { error } = await updateMembershipType(t.id, { is_active: !t.is_active });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    await fetchTypes();
    onChanged();
  };

  const updateField = <K extends keyof TypeFormState>(key: K, value: TypeFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const renderForm = () => (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Name *</Label>
          <Input
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="e.g. Senior"
            className="h-8"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Fee ($)</Label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={form.feeDollars}
              onChange={(e) => updateField('feeDollars', e.target.value)}
              className="h-8 w-28"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs">Description</Label>
        <Textarea
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
          placeholder="Optional description"
          rows={2}
          className="resize-none text-sm"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={form.has_expiry}
            onCheckedChange={(v) => updateField('has_expiry', v)}
          />
          <Label className="text-sm">Has Expiry</Label>
        </div>
        {form.has_expiry && (
          <div className="space-y-1.5">
            <Label className="text-xs">Duration (months)</Label>
            <Input
              type="number"
              min={1}
              value={form.default_duration_months}
              onChange={(e) => updateField('default_duration_months', e.target.value)}
              className="h-8 w-24"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-2.5">
          <Switch
            checked={form.auto_renewal}
            onCheckedChange={(v) => updateField('auto_renewal', v)}
          />
          <Label className="text-sm">Auto Renewal</Label>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Grace Period (days)</Label>
          <Input
            type="number"
            min={0}
            value={form.grace_period_days}
            onChange={(e) => updateField('grace_period_days', e.target.value)}
            className="h-8 w-24"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Switch
          checked={form.is_active}
          onCheckedChange={(v) => updateField('is_active', v)}
        />
        <Label className="text-sm">Active</Label>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {addingNew ? 'Create' : 'Save'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl space-y-6">
      {/* Settings - compact inline */}
      <div className="flex items-center gap-6">
        <div className="space-y-1">
          <Label htmlFor="minimum-age" className="text-xs">Minimum Age</Label>
          <Input
            id="minimum-age"
            type="number"
            min={0}
            value={minimumAge}
            onChange={(e) => setMinimumAge(e.target.value)}
            placeholder="No minimum"
            className="h-8 w-32"
          />
        </div>
        <div className="flex items-center gap-2.5 pt-4">
          <Switch
            checked={registrationOpen}
            onCheckedChange={setRegistrationOpen}
          />
          <Label className="text-sm">Registration Open</Label>
        </div>
      </div>

      <Separator />

      {/* Membership Types */}
      <div>
        <div className="flex items-center justify-between h-9 mb-3">
          <h4 className="text-sm font-medium">Membership Types</h4>
          {!addingNew && !editingId && (
            <Button size="sm" variant="outline" onClick={startAdd}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Type
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </div>
        ) : addingNew ? (
          renderForm()
        ) : (
          <div className="space-y-2">
            {types.map((t) => (
              <div key={t.id}>
                {editingId === t.id ? (
                  renderForm()
                ) : (
                  <div
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                      !t.is_active ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{t.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ${centsToDollars(t.fee_cents ?? 0).toFixed(2)}
                        </span>
                        {t.has_expiry && t.default_duration_months && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {t.default_duration_months}mo
                          </Badge>
                        )}
                        {!t.has_expiry && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            No expiry
                          </Badge>
                        )}
                        {t.auto_renewal && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Auto-renew
                          </Badge>
                        )}
                        {!t.is_active && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Switch
                        checked={t.is_active}
                        onCheckedChange={() => handleToggleActive(t)}
                        className="scale-75"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => startEdit(t)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(t)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {types.length === 0 && !addingNew && (
              <p className="text-sm text-muted-foreground/50 italic py-2">
                No membership types configured. Click &quot;Add Type&quot; to create one.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save at the bottom - hidden when adding/editing a type */}
      {!addingNew && !editingId && (
        <div className="flex justify-end">
          <Button onClick={handleSettingsSave} disabled={savingSettings} size="sm">
            {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Membership Type"
        description={`This will deactivate "${deleteTarget?.name}". Existing members with this type will not be affected.`}
        variant="destructive"
        confirmLabel="Delete"
        onConfirm={handleDelete}
      />
    </div>
  );
}
