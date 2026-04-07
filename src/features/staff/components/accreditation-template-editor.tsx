'use client';

import { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { accreditationTemplateSchema, type AccreditationTemplateInput } from '../schemas/staff-schemas';
import {
  getTemplatesForStaffType,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../services/staff-accreditation-template-service';
import type { StaffAccreditationTemplate } from '@/lib/supabase/database.types';

interface AccreditationTemplateEditorProps {
  staffTypeId: string;
  organisationId: string;
}

export function AccreditationTemplateEditor({ staffTypeId, organisationId }: AccreditationTemplateEditorProps) {
  const [templates, setTemplates] = useState<StaffAccreditationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<StaffAccreditationTemplate | null>(null);
  const { toast } = useToast();

  const form = useForm<AccreditationTemplateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(accreditationTemplateSchema) as any,
    defaultValues: { name: '', issuing_body: '', is_required: false },
  });

  const fetchTemplates = useCallback(async () => {
    const { data, error } = await getTemplatesForStaffType(staffTypeId);
    if (!error) setTemplates(data ?? []);
    setLoading(false);
  }, [staffTypeId]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    form.reset({ name: '', issuing_body: '', is_required: false });
    setDialogOpen(true);
  };

  const handleOpenEdit = (tmpl: StaffAccreditationTemplate) => {
    setEditingTemplate(tmpl);
    form.reset({ name: tmpl.name, issuing_body: tmpl.issuing_body ?? '', is_required: tmpl.is_required });
    setDialogOpen(true);
  };

  const handleSubmit = async (data: AccreditationTemplateInput) => {
    if (editingTemplate) {
      const { error } = await updateTemplate(editingTemplate.id, {
        name: data.name,
        issuing_body: data.issuing_body || null,
        is_required: data.is_required,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Template updated' });
    } else {
      const { error } = await createTemplate({
        staff_type_id: staffTypeId,
        organisation_id: organisationId,
        name: data.name,
        issuing_body: data.issuing_body || null,
        is_required: data.is_required,
      });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      toast({ title: 'Template added' });
    }
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteTemplate(id);
    if (!error) fetchTemplates();
  };

  if (loading) return <div className="text-xs text-muted-foreground">Loading templates...</div>;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Accreditation Templates</h3>
        <Button variant="outline" size="sm" onClick={handleOpenCreate}>
          <Plus className="mr-1 h-3 w-3" />
          Add Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">No accreditation templates. Add common qualifications staff of this type need.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{tmpl.name}</span>
                {tmpl.issuing_body && <span className="text-muted-foreground">({tmpl.issuing_body})</span>}
                {tmpl.is_required && <Badge variant="outline" className="text-xs">Required</Badge>}
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(tmpl)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(tmpl.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Add Accreditation Template'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tmplName">Accreditation Name</Label>
              <Input id="tmplName" {...form.register('name')} placeholder="e.g. Level 1 Coaching, First Aid Certificate" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issuingBody">Issuing Body</Label>
              <Input id="issuingBody" {...form.register('issuing_body')} placeholder="e.g. NRL, Cricket Australia, St John Ambulance" />
            </div>
            <div className="flex items-center justify-between">
              <Label>Required for this staff type</Label>
              <Switch
                checked={form.watch('is_required')}
                onCheckedChange={(checked) => form.setValue('is_required', checked)}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>{editingTemplate ? 'Update' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
