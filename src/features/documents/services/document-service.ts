import { createClient } from '@/lib/supabase/server';
import type { Document, DocumentCategory } from '@/lib/supabase/database.types';

const DOCUMENTS_BUCKET = 'documents';

export async function getDocuments(orgId: string, category?: DocumentCategory) {
  const supabase = await createClient();

  let query = supabase
    .from('documents')
    .select('*')
    .eq('organisation_id', orgId);

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;

  return { data: data as Document[] | null, error };
}

export async function uploadDocument(
  orgId: string,
  file: File,
  metadata: {
    title: string;
    description?: string | null;
    category: DocumentCategory;
    is_public?: boolean;
    uploaded_by: string;
  }
) {
  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${orgId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { data: null, error: uploadError };

  const {
    data: { publicUrl },
  } = supabase.storage.from(DOCUMENTS_BUCKET).getPublicUrl(fileName);

  const { data, error } = await supabase
    .from('documents')
    .insert({
      organisation_id: orgId,
      title: metadata.title,
      description: metadata.description ?? null,
      file_url: publicUrl,
      file_name: file.name,
      file_size_bytes: file.size,
      file_type: file.type || null,
      uploaded_by: metadata.uploaded_by,
      category: metadata.category,
      is_public: metadata.is_public ?? false,
    })
    .select()
    .single();

  return { data: data as Document | null, error };
}

export async function updateDocument(
  id: string,
  documentData: Partial<
    Pick<Document, 'title' | 'description' | 'category' | 'is_public'>
  >
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('documents')
    .update(documentData)
    .eq('id', id)
    .select()
    .single();

  return { data: data as Document | null, error };
}

export async function deleteDocument(id: string) {
  const supabase = await createClient();

  // Fetch the record first to get the storage file path
  const { data: doc, error: fetchError } = await supabase
    .from('documents')
    .select('file_url')
    .eq('id', id)
    .single();

  if (fetchError) return { data: null, error: fetchError };

  // Delete the DB record
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id);

  if (deleteError) return { data: null, error: deleteError };

  // Best-effort storage deletion — derive the path from the public URL
  if (doc?.file_url) {
    const urlPath = new URL(doc.file_url).pathname;
    // pathname is /storage/v1/object/public/<bucket>/<filePath>
    const bucketPrefix = `/storage/v1/object/public/${DOCUMENTS_BUCKET}/`;
    const filePath = urlPath.startsWith(bucketPrefix)
      ? urlPath.slice(bucketPrefix.length)
      : null;

    if (filePath) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    }
  }

  return { data: null, error: null };
}

export async function getDocumentUrl(filePath: string) {
  const supabase = await createClient();

  // Try public URL first; fall back to signed URL for private buckets
  const { data: publicData } = supabase.storage
    .from(DOCUMENTS_BUCKET)
    .getPublicUrl(filePath);

  if (publicData?.publicUrl) {
    return { data: publicData.publicUrl, error: null };
  }

  const { data: signedData, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(filePath, 3600);

  return { data: signedData?.signedUrl ?? null, error };
}
