import { createClient } from '@/lib/supabase/client';
import type { Document, DocumentCategory } from '@/lib/supabase/database.types';

const DOCUMENTS_BUCKET = 'documents';

export async function getDocumentsClient(
  orgId: string,
  options?: { category?: string; search?: string }
) {
  const supabase = createClient();

  let query = supabase
    .from('documents')
    .select('*')
    .eq('organisation_id', orgId)
    .order('created_at', { ascending: false });

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category as DocumentCategory);
  }

  if (options?.search) {
    query = query.ilike('title', `%${options.search}%`);
  }

  const { data, error } = await query;

  return { data: (data as Document[] | null) ?? null, error };
}

export async function uploadDocumentClient(
  orgId: string,
  profileId: string,
  file: File,
  metadata: {
    title: string;
    description: string;
    category: string;
    isPublic: boolean;
  }
) {
  const supabase = createClient();

  const filePath = `${orgId}/${Date.now()}-${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(filePath, file);

  if (uploadError) return { error: uploadError };

  const { error } = await supabase.from('documents').insert({
    organisation_id: orgId,
    title: metadata.title,
    description: metadata.description,
    category: metadata.category as Document['category'],
    is_public: metadata.isPublic,
    file_url: filePath,
    file_name: file.name,
    file_size_bytes: file.size,
    file_type: file.type,
    uploaded_by: profileId,
  });

  return { error };
}

export async function deleteDocumentClient(id: string) {
  const supabase = createClient();

  const { data: doc } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  const { error } = await supabase.from('documents').delete().eq('id', id);

  if (!error && doc?.file_url) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([doc.file_url]);
  }

  return { error };
}
