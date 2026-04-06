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
import { createClient } from '@/lib/supabase/client';
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
    const supabase = createClient();
    let query = supabase
      .from('documents')
      .select('*')
      .eq('organisation_id', profile.organisation_id)
      .order('created_at', { ascending: false });

    if (category !== 'all') {
      query = query.eq('category', category as import('@/lib/supabase/database.types').DocumentCategory);
    }
    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data } = await query;
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
    const supabase = createClient();

    const filePath = `${profile.organisation_id}/${Date.now()}-${data.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, data.file);

    if (uploadError) {
      toast({ title: 'Upload failed', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage.from('documents').getPublicUrl(filePath);

    const { error } = await supabase.from('documents').insert({
      organisation_id: profile.organisation_id,
      title: data.title,
      description: data.description,
      category: data.category as Document['category'],
      is_public: data.isPublic,
      file_url: urlData.publicUrl,
      file_name: data.file.name,
      file_size_bytes: data.file.size,
      file_type: data.file.type,
      uploaded_by: profile.id,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Document uploaded successfully' });
    fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    // Get file URL before deleting the record
    const { data: doc } = await supabase.from('documents').select('file_url').eq('id', id).single();
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    // Remove the storage object
    if (doc?.file_url) {
      const path = doc.file_url.split('/storage/v1/object/public/documents/')[1];
      if (path) await supabase.storage.from('documents').remove([decodeURIComponent(path)]);
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
