'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2, GripVertical, ChevronDown, ChevronUp, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { staffTypeSchema, type StaffTypeInput } from '../schemas/staff-schemas';
import {
  getAllStaffTypes,
  createStaffType,
  updateStaffType,
  deleteStaffType,
} from '../services/staff-type-service';
import { StaffTypeFieldsEditor } from './staff-type-fields-editor';
import { AccreditationTemplateEditor } from './accreditation-template-editor';
import type { StaffType } from '@/lib/supabase/database.types';

interface StaffTypeManagerProps {
  organisationId: string;
}

export function StaffTypeManager({ organisationId }: StaffTypeManagerProps) {
  const [types, setTypes] = useState<StaffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<StaffType | null>(null);
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StaffType | null>(null);
  const { toast } = useToast();

  const form = useForm<StaffTypeInput>({
    resolver: zodResolver(staffTypeSchema),
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      requires_wwc: false,
      is_publicly_visible: false,
    },
  });

  const fetchTypes = useCallback(async () => {
    const { data, error } = await getAllStaffTypes(organisationId);
    if (error) {
      toast({ title: 'Error loading staff types', description: error.message, variant: 'destructive' });
    } else {
      setTypes(data ?? []);
    }
    setLoading(false);
  }, [organisationId, toast]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleOpenCreate = () => {
    setEditingType(null);
    form.reset({ name: '', description: '', icon: '', requires_wwc: false, is_publicly_visible: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (type: StaffType) => {
    setEditingType(type);
    form.reset({
      name: type.name,
      description: type.description ?? '',
      icon: type.icon ?? '',
      requires_wwc: type.requires_wwc,
      is_publicly_visible: type.is_publicly_visible,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: StaffTypeInput) => {
    if (editingType) {
      const { error } = await updateStaffType(editingType.id, {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        requires_wwc: data.requires_wwc,
        is_publicly_visible: data.is_publicly_visible,
      });
      if (error) {
        toast({ title: 'Error updating staff type', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff type updated' });
    } else {
      const { error } = await createStaffType(organisationId, {
        name: data.name,
        description: data.description || null,
        icon: data.icon || null,
        requires_wwc: data.requires_wwc,
        is_publicly_visible: data.is_publicly_visible,
      });
      if (error) {
        toast({ title: 'Error creating staff type', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Staff type created' });
    }
    setDialogOpen(false);
    fetchTypes();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error, staffCount } = await deleteStaffType(deleteTarget.id);
    if (error) {
      toast({ title: 'Cannot delete', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Staff type deleted' });
      fetchTypes();
    }
    setDeleteTarget(null);
  };

  const handleToggleActive = async (type: StaffType) => {
    const { error } = await updateStaffType(type.id, { is_active: !type.is_active });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchTypes();
    }
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading staff types...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Staff Types</h2>
          <p className="text-sm text-muted-foreground">Configure the types of staff your club uses</p>
        </div>
        <Button onClick={handleOpenCreate} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Type
        </Button>
      </div>

      <div className="space-y-3">
        {types.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No staff types configured. Add your first type to get started.
            </CardContent>
          </Card>
        ) : (
          types.map((type) => (
            <Card key={type.id} className={!type.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    <CardTitle className="text-base">{type.name}</CardTitle>
                    {!type.is_active && <Badge variant="secondary">Inactive</Badge>}
                    {type.requires_wwc && (
                      <Badge variant="outline" className="gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        WWC Required
                      </Badge>
                    )}
                    {type.is_publicly_visible && (
                      <Badge variant="outline" className="gap-1">
                        <Eye className="h-3 w-3" />
                        Public
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedTypeId(expandedTypeId === type.id ? null : type.id)}
                    >
                      {expandedTypeId === type.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                      <span className="ml-1 text-xs">Fields & Templates</span>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(type)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleActive(type)}>
                      {type.is_active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(type)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {type.description && (
                  <p className="text-sm text-muted-foreground mt-1">{type.description}</p>
                )}
              </CardHeader>
              {expandedTypeId === type.id && (
                <CardContent className="space-y-6 border-t pt-4">
                  <StaffTypeFieldsEditor staffTypeId={type.id} organisationId={organisationId} />
                  <AccreditationTemplateEditor staffTypeId={type.id} organisationId={organisationId} />
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingType ? 'Edit Staff Type' : 'Add Staff Type'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...form.register('name')} placeholder="e.g. Coach, Referee, Photographer" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...form.register('description')} placeholder="Optional description" rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Requires Working With Children Check</Label>
                <p className="text-xs text-muted-foreground">Staff of this type must provide a WWC check</p>
              </div>
              <Switch
                checked={form.watch('requires_wwc')}
                onCheckedChange={(checked) => form.setValue('requires_wwc', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Publicly Visible</Label>
                <p className="text-xs text-muted-foreground">Show staff of this type in the public directory</p>
              </div>
              <Switch
                checked={form.watch('is_publicly_visible')}
                onCheckedChange={(checked) => form.setValue('is_publicly_visible', checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {editingType ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Staff Type"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
