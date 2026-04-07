'use client';

import { useState } from 'react';
import { Loader2, Plus, Pencil, Trash2, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import {
  createVenue,
  updateVenue,
  deleteVenue,
} from '@/features/club-profile/services/club-profile-service';
import type { ClubVenue } from '@/lib/supabase/database.types';
import { VENUE_CATEGORY_OPTIONS } from '@/lib/supabase/database.types';
import { Checkbox } from '@/components/ui/checkbox';

interface ClubVenuesManagerProps {
  orgId: string;
  venues: ClubVenue[];
  onChanged: () => void;
}

interface VenueFormState {
  name: string;
  address: string;
  is_primary: boolean;
  categories: string[];
  notes: string;
}

const emptyForm: VenueFormState = { name: '', address: '', is_primary: false, categories: [], notes: '' };

export function ClubVenuesManager({ orgId, venues, onChanged }: ClubVenuesManagerProps) {
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formState, setFormState] = useState<VenueFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleFieldChange = (field: keyof VenueFormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  };

  const startAdd = () => {
    setEditingId(null);
    setFormState(emptyForm);
    setShowAddForm(true);
  };

  const toggleCategory = (cat: string) => {
    setFormState((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  };

  const startEdit = (venue: ClubVenue) => {
    setShowAddForm(false);
    setEditingId(venue.id);
    setFormState({
      name: venue.name,
      address: venue.address ?? '',
      is_primary: venue.is_primary,
      categories: venue.categories ?? [],
      notes: venue.notes ?? '',
    });
  };

  const cancelForm = () => {
    setShowAddForm(false);
    setEditingId(null);
    setFormState(emptyForm);
  };

  const handleCreate = async () => {
    if (!formState.name.trim()) {
      toast({ title: 'Validation', description: 'Venue name is required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await createVenue(orgId, {
        name: formState.name.trim(),
        address: formState.address.trim() || null,
        is_primary: formState.is_primary,
        categories: formState.categories,
        notes: formState.notes.trim() || null,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Venue added', description: `${formState.name} has been added.` });
      cancelForm();
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formState.name.trim()) {
      toast({ title: 'Validation', description: 'Venue name is required.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await updateVenue(editingId, {
        name: formState.name.trim(),
        address: formState.address.trim() || null,
        is_primary: formState.is_primary,
        categories: formState.categories,
        notes: formState.notes.trim() || null,
      });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Venue updated', description: `${formState.name} has been updated.` });
      cancelForm();
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (venue: ClubVenue) => {
    setDeletingId(venue.id);
    try {
      const { error } = await deleteVenue(venue.id);

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Venue deleted', description: `${venue.name} has been removed.` });
      onChanged();
    } catch {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const renderForm = (mode: 'add' | 'edit') => (
    <Card className="border-dashed">
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Venue Name</Label>
            <Input
              value={formState.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Main Oval"
            />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              value={formState.address}
              onChange={(e) => handleFieldChange('address', e.target.value)}
              placeholder="123 Sport St, Suburb NSW 2000"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Venue Type</Label>
          <div className="flex flex-wrap gap-3">
            {VENUE_CATEGORY_OPTIONS.map((cat) => (
              <label key={cat.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={formState.categories.includes(cat.value)}
                  onCheckedChange={() => toggleCategory(cat.value)}
                />
                {cat.label}
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={formState.notes}
            onChange={(e) => handleFieldChange('notes', e.target.value)}
            placeholder="Parking, facilities, etc."
            rows={2}
          />
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={formState.is_primary}
            onCheckedChange={(checked) => handleFieldChange('is_primary', checked)}
          />
          <Label>Primary venue</Label>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={mode === 'add' ? handleCreate : handleUpdate}
            disabled={saving}
            size="sm"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'add' ? 'Add Venue' : 'Update Venue'}
          </Button>
          <Button variant="ghost" size="sm" onClick={cancelForm} disabled={saving}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Venues</h3>
        {!showAddForm && (
          <Button variant="outline" size="sm" onClick={startAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        )}
      </div>

      {showAddForm && renderForm('add')}

      {venues.length === 0 && !showAddForm && (
        <p className="text-sm text-muted-foreground">No venues added yet.</p>
      )}

      {venues.map((venue) =>
        editingId === venue.id ? (
          <div key={venue.id}>{renderForm('edit')}</div>
        ) : (
          <Card key={venue.id}>
            <CardContent className="flex items-start justify-between pt-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{venue.name}</span>
                  {venue.is_primary && (
                    <Badge variant="outline" className="text-xs">
                      <Star className="mr-1 h-3 w-3" />
                      Primary
                    </Badge>
                  )}
                </div>
                {venue.address && (
                  <p className="text-sm text-muted-foreground">{venue.address}</p>
                )}
                {venue.categories && venue.categories.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {venue.categories.map((cat) => {
                      const label = VENUE_CATEGORY_OPTIONS.find((o) => o.value === cat)?.label ?? cat;
                      return (
                        <Badge key={cat} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {venue.notes && (
                  <p className="text-xs text-muted-foreground">{venue.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => startEdit(venue)}
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(venue)}
                  disabled={deletingId === venue.id}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  {deletingId === venue.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
