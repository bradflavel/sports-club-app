import { describe, it, expect } from 'vitest';
import { validateDocumentFile, validateImageFile } from '@/lib/file-validation';

describe('validateDocumentFile', () => {
  it('accepts PDF files', () => {
    const file = new File(['content'], 'doc.pdf', { type: 'application/pdf' });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('accepts Word documents', () => {
    const file = new File(['content'], 'doc.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('accepts Excel files', () => {
    const file = new File(['content'], 'data.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('accepts CSV files', () => {
    const file = new File(['name,email'], 'members.csv', { type: 'text/csv' });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('accepts PNG images', () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('accepts JPEG images', () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateDocumentFile(file)).toBeNull();
  });

  it('rejects unsupported file types', () => {
    const file = new File(['data'], 'script.js', { type: 'application/javascript' });
    const error = validateDocumentFile(file);
    expect(error).toContain('not allowed');
  });

  it('rejects files exceeding 10MB', () => {
    const largeContent = new Uint8Array(10 * 1024 * 1024 + 1);
    const file = new File([largeContent], 'big.pdf', { type: 'application/pdf' });
    const error = validateDocumentFile(file);
    expect(error).toContain('10MB');
  });

  it('accepts files at exactly 10MB', () => {
    const content = new Uint8Array(10 * 1024 * 1024);
    const file = new File([content], 'exact.pdf', { type: 'application/pdf' });
    expect(validateDocumentFile(file)).toBeNull();
  });
});

describe('validateImageFile', () => {
  it('accepts PNG images', () => {
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('accepts JPEG images', () => {
    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('accepts WebP images', () => {
    const file = new File(['img'], 'photo.webp', { type: 'image/webp' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('accepts GIF images', () => {
    const file = new File(['img'], 'animation.gif', { type: 'image/gif' });
    expect(validateImageFile(file)).toBeNull();
  });

  it('rejects non-image files', () => {
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const error = validateImageFile(file);
    expect(error).toContain('not allowed');
  });

  it('rejects SVG files', () => {
    const file = new File(['<svg></svg>'], 'icon.svg', { type: 'image/svg+xml' });
    const error = validateImageFile(file);
    expect(error).toContain('not allowed');
  });

  it('rejects files exceeding 5MB', () => {
    const largeContent = new Uint8Array(5 * 1024 * 1024 + 1);
    const file = new File([largeContent], 'big.png', { type: 'image/png' });
    const error = validateImageFile(file);
    expect(error).toContain('5MB');
  });

  it('accepts files at exactly 5MB', () => {
    const content = new Uint8Array(5 * 1024 * 1024);
    const file = new File([content], 'exact.png', { type: 'image/png' });
    expect(validateImageFile(file)).toBeNull();
  });
});
