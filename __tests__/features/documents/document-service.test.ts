import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/lib/supabase/server';
import {
  getDocuments,
  uploadDocument,
  updateDocument,
  deleteDocument,
  getDocumentUrl,
} from '@/features/documents/services/document-service';

const mockFrom = vi.fn();
const mockStorage = {
  from: vi.fn(),
};
const mockSupabase = { from: mockFrom, storage: mockStorage };

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createClient).mockResolvedValue(mockSupabase as never);
});

const mockDocument = {
  id: 'doc-1',
  organisation_id: 'org-1',
  title: 'Club Constitution',
  description: 'Official club constitution document',
  file_url: 'https://storage.example.com/documents/org-1/constitution.pdf',
  file_name: 'constitution.pdf',
  file_size_bytes: 204800,
  file_type: 'application/pdf',
  uploaded_by: 'user-1',
  category: 'policy',
  is_public: false,
  created_at: '2025-01-15T00:00:00Z',
};

describe('getDocuments', () => {
  it('returns documents for an organisation', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockDocument], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getDocuments('org-1');

    expect(mockFrom).toHaveBeenCalledWith('documents');
    expect(result.data).toHaveLength(1);
    expect(result.error).toBeNull();
  });

  it('filters by category when provided', async () => {
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [mockDocument], error: null }),
    };
    mockFrom.mockReturnValue(builder);

    await getDocuments('org-1', 'policy' as never);

    // eq is called twice: once for org_id, once for category
    expect(builder.eq).toHaveBeenCalledTimes(2);
  });

  it('returns error when query fails', async () => {
    const dbError = new Error('Query failed');
    const builder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: null, error: dbError }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await getDocuments('org-1');

    expect(result.error).toBe(dbError);
  });
});

describe('uploadDocument', () => {
  it('uploads file to storage and creates document record', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.example.com/test.pdf' } }),
    });

    const insertBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDocument, error: null }),
    };
    mockFrom.mockReturnValue(insertBuilder);

    const result = await uploadDocument('org-1', mockFile, {
      title: 'Test Document',
      category: 'policy' as never,
      uploaded_by: 'user-1',
    });

    expect(mockStorage.from).toHaveBeenCalledWith('documents');
    expect(result.data).toEqual(mockDocument);
    expect(result.error).toBeNull();
  });

  it('returns error when storage upload fails', async () => {
    const uploadError = new Error('Upload failed');
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: uploadError }),
    });

    const result = await uploadDocument('org-1', mockFile, {
      title: 'Test',
      category: 'policy' as never,
      uploaded_by: 'user-1',
    });

    expect(result.data).toBeNull();
    expect(result.error).toBe(uploadError);
  });

  it('defaults is_public to false', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    let capturedInsert: Record<string, unknown> = {};

    mockStorage.from.mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.pdf' } }),
    });

    const insertBuilder = {
      insert: vi.fn().mockImplementation((arg) => { capturedInsert = arg; return insertBuilder; }),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockDocument, error: null }),
    };
    mockFrom.mockReturnValue(insertBuilder);

    await uploadDocument('org-1', mockFile, {
      title: 'Test',
      category: 'policy' as never,
      uploaded_by: 'user-1',
    });

    expect(capturedInsert.is_public).toBe(false);
  });
});

describe('updateDocument', () => {
  it('updates document fields', async () => {
    let capturedUpdate: unknown;
    const builder = {
      update: vi.fn().mockImplementation((arg) => { capturedUpdate = arg; return builder; }),
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { ...mockDocument, title: 'Updated Title' }, error: null }),
    };
    mockFrom.mockReturnValue(builder);

    const result = await updateDocument('doc-1', { title: 'Updated Title' });

    expect(capturedUpdate).toMatchObject({ title: 'Updated Title' });
    expect(result.data?.title).toBe('Updated Title');
    expect(result.error).toBeNull();
  });
});

describe('deleteDocument', () => {
  it('fetches file path, deletes record, then removes from storage', async () => {
    // First call: fetch file_url
    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { file_url: 'https://example.com/storage/v1/object/public/documents/org-1/file.pdf' },
        error: null,
      }),
    };

    // Second call: delete record
    const deleteBuilder = {
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };

    let fromCallCount = 0;
    mockFrom.mockImplementation(() => {
      fromCallCount++;
      if (fromCallCount === 1) return fetchBuilder;
      return deleteBuilder;
    });

    mockStorage.from.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ error: null }),
    });

    const result = await deleteDocument('doc-1');

    expect(result.error).toBeNull();
    expect(mockStorage.from).toHaveBeenCalledWith('documents');
  });

  it('returns error when fetch fails', async () => {
    const fetchError = new Error('Not found');
    const fetchBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: fetchError }),
    };
    mockFrom.mockReturnValue(fetchBuilder);

    const result = await deleteDocument('doc-1');

    expect(result.error).toBe(fetchError);
  });
});

describe('getDocumentUrl', () => {
  it('returns public URL when available', async () => {
    mockStorage.from.mockReturnValue({
      getPublicUrl: vi.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/doc.pdf' },
      }),
    });

    const result = await getDocumentUrl('org-1/doc.pdf');

    expect(result.data).toBe('https://example.com/doc.pdf');
    expect(result.error).toBeNull();
  });
});
