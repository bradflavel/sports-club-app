const ALLOWED_DOCUMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'text/csv',
]);

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateDocumentFile(file: File): string | null {
  if (!ALLOWED_DOCUMENT_TYPES.has(file.type)) {
    return `File type "${file.type}" is not allowed. Accepted: PDF, Word, Excel, images, text, CSV.`;
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return `File size exceeds 10MB limit.`;
  }
  return null;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return `File type "${file.type}" is not allowed. Accepted: PNG, JPEG, WebP, GIF.`;
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return `File size exceeds 5MB limit.`;
  }
  return null;
}
