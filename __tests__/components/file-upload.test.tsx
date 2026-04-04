import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '@/components/shared/file-upload';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function createFile(name: string, sizeBytes: number, type = 'text/plain'): File {
  const file = new File(['x'.repeat(sizeBytes)], name, { type });
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

const mockOnFilesSelected = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('FileUpload', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  describe('rendering', () => {
    it('renders the dropzone area', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
    });

    it('renders the hidden file input', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      expect(input).toBeTruthy();
      expect(input.type).toBe('file');
    });

    it('shows max size hint in the dropzone', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxSize={5 * 1024 * 1024} />);

      expect(screen.getByText(/max size/i)).toBeInTheDocument();
      expect(screen.getByText(/5 MB/i)).toBeInTheDocument();
    });

    it('shows "a file" hint for single file mode (multiple=false)', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} multiple={false} />);

      expect(screen.getByText(/drag & drop a file here/i)).toBeInTheDocument();
    });

    it('shows "files" hint for multiple file mode', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} multiple />);

      expect(screen.getByText(/drag & drop files here/i)).toBeInTheDocument();
    });

    it('does not render any file list items initially', () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // File selection — shows file name
  // -------------------------------------------------------------------------
  describe('file selection', () => {
    it('shows the selected file name after a file is chosen', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('my-document.pdf', 1024, 'application/pdf');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('my-document.pdf')).toBeInTheDocument();
      });
    });

    it('calls onFilesSelected with the selected files', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('report.csv', 512, 'text/csv');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalledWith([file]);
      });
    });

    it('shows the formatted file size alongside the file name', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('data.csv', 2048, 'text/csv');

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('2 KB')).toBeInTheDocument();
      });
    });

    it('replaces the previous file when a new one is selected (single mode)', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} multiple={false} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file1 = createFile('first.txt', 100);
      const file2 = createFile('second.txt', 200);

      fireEvent.change(input, { target: { files: [file1] } });
      await waitFor(() => screen.getByText('first.txt'));

      fireEvent.change(input, { target: { files: [file2] } });
      await waitFor(() => {
        expect(screen.queryByText('first.txt')).not.toBeInTheDocument();
        expect(screen.getByText('second.txt')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // File size validation
  // -------------------------------------------------------------------------
  describe('file size validation', () => {
    it('shows an error message for an oversized file', async () => {
      const maxSize = 1 * 1024 * 1024; // 1 MB
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const oversizedFile = createFile('big-file.zip', 5 * 1024 * 1024, 'application/zip');

      fireEvent.change(input, { target: { files: [oversizedFile] } });

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum size/i)).toBeInTheDocument();
      });
    });

    it('does not call onFilesSelected when file is too large', async () => {
      const maxSize = 512 * 1024; // 512 KB
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const oversizedFile = createFile('huge.png', 10 * 1024 * 1024, 'image/png');

      fireEvent.change(input, { target: { files: [oversizedFile] } });

      await waitFor(() => {
        expect(mockOnFilesSelected).not.toHaveBeenCalled();
      });
    });

    it('does not show the oversized file name in the list', async () => {
      const maxSize = 100;
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('too-large.txt', 200);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByText('too-large.txt')).not.toBeInTheDocument();
      });
    });

    it('accepts a file within the size limit without error', async () => {
      const maxSize = 10 * 1024 * 1024;
      render(<FileUpload onFilesSelected={mockOnFilesSelected} maxSize={maxSize} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('ok-file.txt', 1024);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.queryByText(/exceeds maximum size/i)).not.toBeInTheDocument();
        expect(screen.getByText('ok-file.txt')).toBeInTheDocument();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Remove file button
  // -------------------------------------------------------------------------
  describe('remove file button', () => {
    it('renders a remove button after a file is selected', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('deletable.txt', 512);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('deletable.txt')).toBeInTheDocument();
      });

      // The remove button is a ghost icon button rendered next to the file
      const removeButtons = screen.getAllByRole('button');
      // Filter out any other buttons (dropzone area itself is not a button)
      expect(removeButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('removes the file from the list when the remove button is clicked', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('removable.txt', 512);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('removable.txt')).toBeInTheDocument();
      });

      // Click the ghost remove button (the only button in the file list row)
      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(screen.queryByText('removable.txt')).not.toBeInTheDocument();
      });
    });

    it('calls onFilesSelected with empty array after removing the only file', async () => {
      render(<FileUpload onFilesSelected={mockOnFilesSelected} />);

      const input = document.getElementById('file-upload-input') as HTMLInputElement;
      const file = createFile('single.txt', 256);

      fireEvent.change(input, { target: { files: [file] } });

      await waitFor(() => screen.getByText('single.txt'));

      mockOnFilesSelected.mockClear();

      const removeButton = screen.getByRole('button');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnFilesSelected).toHaveBeenCalledWith([]);
      });
    });
  });
});
