'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, List, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SearchInput } from '@/components/shared/search-input';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { DocumentCard } from './document-card';
import { DocumentUploadDialog } from './document-upload-dialog';
import {
  getDocumentsClient,
  uploadDocumentClient,
  deleteDocumentClient,
} from '@/features/documents/services/document-client-service';
import { validateDocumentFile } from '@/lib/file-validation';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@/hooks/use-user';
import { DOCUMENT_CATEGORY_OPTIONS } from '@/lib/constants';
import { FileText } from 'lucide-react';
import type { Document } from '@/lib/supabase/database.types';
import { TableSkeleton } from '@/components/shared/loading-skeleton';

export function DocumentLibrary() {
  const { profile } = useUser();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';

  const fetchDocuments = useCallback(async () => {
    if (!profile?.organisation_id) return;
    const { data } = await getDocumentsClient(profile.organisation_id, { category, search });
    setDocuments(data || []);
    setLoading(false);
  }, [profile?.organisation_id, category, search]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (data: {
    title: string;
    description: string;
    category: string;
    isPublic: boolean;
    file: File;
  }) => {
    if (!profile?.organisation_id) return;

    const validationError = validateDocumentFile(data.file);
    if (validationError) {
      toast({ title: 'Invalid file', description: validationError, variant: 'destructive' });
      return;
    }

    const { error } = await uploadDocumentClient(profile.organisation_id, profile.id, data.file, {
      title: data.title,
      description: data.description,
      category: data.category,
      isPublic: data.isPublic,
    });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Document uploaded successfully' });
    fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteDocumentClient(id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Document deleted' });
    fetchDocuments();
  };

  if (loading) return <TableSkeleton rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        actions={
          canEdit ? (
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              {DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value}>
                  {opt.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center gap-2">
          <SearchInput placeholder="Search documents..." onSearch={setSearch} className="w-64" />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          >
            {viewMode === 'list' ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {documents.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents yet"
          description="Upload your first document to get started."
          actionLabel={canEdit ? 'Upload Document' : undefined}
          onAction={canEdit ? () => setUploadOpen(true) : undefined}
        />
      ) : (
        <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-3'}>
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              canEdit={canEdit}
              onDelete={() => handleDelete(doc.id)}
            />
          ))}
        </div>
      )}

      <DocumentUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUpload={handleUpload} />
    </div>
  );
}
