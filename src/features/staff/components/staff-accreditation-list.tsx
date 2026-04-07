'use client';

import { useState, useCallback, useEffect } from 'react';
import { Plus, Pencil, Trash2, FileText, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getAccreditationsForStaff, deleteAccreditation } from '../services/staff-accreditation-service';
import { StaffAccreditationForm } from './staff-accreditation-form';
import type { StaffAccreditation } from '@/lib/supabase/database.types';

interface StaffAccreditationListProps {
  staffId: string;
  organisationId: string;
  isAdmin: boolean;
  requiresWwc?: boolean;
}

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  current: { label: 'Current', icon: CheckCircle, className: 'text-green-600 bg-green-50 border-green-200' },
  expired: { label: 'Expired', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' },
  pending: { label: 'Pending', icon: Clock, className: 'text-amber-600 bg-amber-50 border-amber-200' },
  revoked: { label: 'Revoked', icon: XCircle, className: 'text-red-600 bg-red-50 border-red-200' },
};

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const expiry = new Date(expiryDate);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return expiry <= thirtyDaysFromNow && expiry > new Date();
}

export function StaffAccreditationList({
  staffId,
  organisationId,
  isAdmin,
  requiresWwc = false,
}: StaffAccreditationListProps) {
  const [accreditations, setAccreditations] = useState<StaffAccreditation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingAccreditation, setEditingAccreditation] = useState<StaffAccreditation | null>(null);
  const { toast } = useToast();

  const fetchAccreditations = useCallback(async () => {
    const { data, error } = await getAccreditationsForStaff(staffId);
    if (!error) setAccreditations(data ?? []);
    setLoading(false);
  }, [staffId]);

  useEffect(() => {
    fetchAccreditations();
  }, [fetchAccreditations]);

  const handleDelete = async (id: string) => {
    const { error } = await deleteAccreditation(id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      fetchAccreditations();
    }
  };

  const handleEdit = (accreditation: StaffAccreditation) => {
    setEditingAccreditation(accreditation);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingAccreditation(null);
    fetchAccreditations();
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading accreditations...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Accreditations & Qualifications</h3>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => { setEditingAccreditation(null); setFormOpen(true); }}>
            <Plus className="mr-1 h-3 w-3" />
            Add
          </Button>
        )}
      </div>

      {accreditations.length === 0 ? (
        <p className="text-sm text-muted-foreground">No accreditations recorded.</p>
      ) : (
        <div className="space-y-2">
          {accreditations.map((accreditation) => {
            const config = statusConfig[accreditation.status] ?? statusConfig.current;
            const expiringSoon = isExpiringSoon(accreditation.expiry_date);
            const Icon = config.icon;

            return (
              <div key={accreditation.id} className={`flex items-center justify-between rounded-md border p-3 ${expiringSoon ? 'border-amber-300 bg-amber-50/50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${expiringSoon ? 'text-amber-600' : config.className.split(' ')[0]}`} />
                  <div>
                    <p className="text-sm font-medium">{accreditation.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {accreditation.issuing_body && <span>{accreditation.issuing_body}</span>}
                      {accreditation.credential_number && <span>#{accreditation.credential_number}</span>}
                      {accreditation.expiry_date && (
                        <span>
                          Expires: {new Date(accreditation.expiry_date).toLocaleDateString('en-AU')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {expiringSoon && (
                    <Badge variant="outline" className="gap-1 border-amber-300 text-amber-700 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Expiring Soon
                    </Badge>
                  )}
                  <Badge variant="outline" className={`text-xs ${config.className}`}>
                    {config.label}
                  </Badge>
                  {accreditation.document_url && (
                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                      <a href={accreditation.document_url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-3 w-3" />
                      </a>
                    </Button>
                  )}
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(accreditation)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(accreditation.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StaffAccreditationForm
        open={formOpen}
        onClose={handleFormClose}
        staffId={staffId}
        organisationId={organisationId}
        editingAccreditation={editingAccreditation}
        requiresWwc={requiresWwc}
      />
    </div>
  );
}
