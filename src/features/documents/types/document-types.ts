export type {
  Document,
  DocumentCategory,
} from '@/lib/supabase/database.types';

export interface DocumentFormData {
  title: string;
  description?: string;
  category: string;
  isPublic: boolean;
  file?: File;
}
