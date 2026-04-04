import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/shared/data-table';

// ---------------------------------------------------------------------------
// Test data & columns
// ---------------------------------------------------------------------------
interface Person {
  id: string;
  name: string;
  age: number;
  role: string;
}

// Base columns without selection
const columns: ColumnDef<Person>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
  {
    accessorKey: 'age',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Age
      </button>
    ),
    cell: ({ getValue }) => <span>{getValue() as number}</span>,
    enableSorting: true,
  },
  {
    accessorKey: 'role',
    header: 'Role',
    cell: ({ getValue }) => <span>{getValue() as string}</span>,
  },
];

// Columns with a checkbox select column for row-selection tests
const selectableColumns: ColumnDef<Person>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        aria-label="Select all"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        aria-label="Select row"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
      />
    ),
    enableSorting: false,
  },
  ...columns,
];

const mockData: Person[] = [
  { id: '1', name: 'Alice Johnson', age: 28, role: 'admin' },
  { id: '2', name: 'Bob Smith', age: 34, role: 'member' },
  { id: '3', name: 'Carol White', age: 22, role: 'coach' },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('DataTable', () => {
  describe('row rendering', () => {
    it('renders a row for each data item', () => {
      render(<DataTable columns={columns} data={mockData} />);

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Carol White')).toBeInTheDocument();
    });

    it('renders cell values correctly', () => {
      render(<DataTable columns={columns} data={mockData} />);

      expect(screen.getByText('28')).toBeInTheDocument();
      expect(screen.getByText('34')).toBeInTheDocument();
      expect(screen.getByText('22')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<DataTable columns={columns} data={mockData} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Age')).toBeInTheDocument();
      expect(screen.getByText('Role')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders "No results." when data is empty', () => {
      render(<DataTable columns={columns} data={[]} />);

      expect(screen.getByText('No results.')).toBeInTheDocument();
    });

    it('does not render any data rows when data is empty', () => {
      render(<DataTable columns={columns} data={[]} />);

      expect(screen.queryByText('Alice Johnson')).not.toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('toggles sort when clicking a sortable header', () => {
      render(<DataTable columns={columns} data={mockData} />);

      const ageHeader = screen.getByRole('button', { name: /age/i });
      fireEvent.click(ageHeader);

      // After click the rows should still be rendered
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    });

    it('data re-renders after sort click without errors', () => {
      render(<DataTable columns={columns} data={mockData} />);

      const ageHeader = screen.getByRole('button', { name: /age/i });
      fireEvent.click(ageHeader);
      fireEvent.click(ageHeader); // toggle back

      expect(screen.getAllByRole('row').length).toBeGreaterThan(1);
    });
  });

  describe('pagination', () => {
    it('renders pagination controls', () => {
      render(<DataTable columns={columns} data={mockData} pageSize={2} />);

      // Page info text
      expect(screen.getByText(/page 1 of/i)).toBeInTheDocument();
    });

    it('shows page 1 of N with multiple pages', () => {
      render(<DataTable columns={columns} data={mockData} pageSize={2} />);

      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    it('shows page 1 of 1 when all rows fit on one page', () => {
      render(<DataTable columns={columns} data={mockData} pageSize={20} />);

      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });

    it('renders navigation buttons', () => {
      render(<DataTable columns={columns} data={mockData} pageSize={2} />);

      // There should be prev/next buttons (they use icons, check by button count)
      const buttons = screen.getAllByRole('button');
      // At least pagination navigation buttons exist alongside any sort buttons
      expect(buttons.length).toBeGreaterThanOrEqual(4);
    });

    it('first page button is disabled on page 1', () => {
      render(<DataTable columns={columns} data={mockData} pageSize={2} />);

      // The first two navigation buttons (first page, prev page) should be disabled
      const navButtons = screen.getAllByRole('button').filter(
        (btn) => btn.hasAttribute('disabled')
      );
      expect(navButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('row selection', () => {
    it('renders checkboxes when enableRowSelection is true and columns include a select column', () => {
      render(
        <DataTable columns={selectableColumns} data={mockData} enableRowSelection />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // One "select all" header checkbox + one per row
      expect(checkboxes.length).toBe(mockData.length + 1);
    });

    it('does not render checkboxes when columns do not include a select column', () => {
      render(
        <DataTable columns={columns} data={mockData} enableRowSelection={false} />
      );

      expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    });
  });
});
