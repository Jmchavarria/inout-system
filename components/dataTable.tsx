'use client';

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import type { Table as TanstackTable } from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import React from 'react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  showTotal?: boolean;
  showFinancialSummary?: boolean;
  totalField?: string;
  headerActions?: React.ReactNode;
  isLoading?: boolean;
}

// Tipo para elementos con campo numérico
interface DataWithNumericField {
  [key: string]: unknown;
}

// Componente para mostrar el estado de carga
const LoadingRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className='h-24 text-center'>
      <div className='flex items-center justify-center gap-2'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
        Cargando...
      </div>
    </TableCell>
  </TableRow>
);

// Componente para mostrar cuando no hay resultados
const NoResultsRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <TableRow>
    <TableCell colSpan={colSpan} className='h-24 text-center'>
      No results.
    </TableCell>
  </TableRow>
);

// Componente para el resumen financiero
const FinancialSummary: React.FC<{
  calculateTotal: number;
  isLoading: boolean;
  formatCurrency: (amount: number) => string;
}> = ({ calculateTotal, isLoading, formatCurrency }) => {
  if (isLoading) {
    return <div className='animate-pulse bg-gray-200 h-6 w-24 rounded' />;
  }

  return (
    <>
      <span
        className={`font-bold text-lg ${
          calculateTotal >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {calculateTotal >= 0 ? '+' : ''}
        {formatCurrency(calculateTotal)}
      </span>
      <div className='text-sm text-gray-500'>
        <div>Incomes: {formatCurrency(Math.max(calculateTotal, 0))}</div>
        <div>Expenses: {formatCurrency(Math.min(calculateTotal, 0))}</div>
      </div>
    </>
  );
};

// Hook personalizado para manejar el cálculo de totales
const useFinancialCalculation = (
  showFinancialSummary: boolean,
  isLoading: boolean,
  totalField: string,
  filteredRows: Array<{ original: unknown }>
) => {
  return React.useMemo(() => {
    if (!showFinancialSummary || isLoading) return 0;

    return filteredRows.reduce((sum, row) => {
      const item = row.original as DataWithNumericField;
      const value = item[totalField];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, [showFinancialSummary, isLoading, totalField, filteredRows]);
};

// ──────────────────────────────────────────────
// Header con filtros (GENÉRICO EN TData)
// ──────────────────────────────────────────────
interface TableHeaderFiltersProps<TData> {
  globalFilter: string;
  setGlobalFilter: (value: React.SetStateAction<string>) => void;
  isLoading: boolean;
  table: TanstackTable<TData>;
  headerActions?: React.ReactNode;
}

const TableHeaderFilters = <TData,>({
  globalFilter,
  setGlobalFilter,
  isLoading,
  table,
  headerActions,
}: TableHeaderFiltersProps<TData>) => (
  <div className='flex gap-2.5 py-4 justify-between'>
    <div className='flex flex-1 gap-2.5'>
      <Input
        placeholder='Buscar...'
        value={globalFilter ?? ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className='max-w-sm'
        disabled={isLoading}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' disabled={isLoading}>
            Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className='capitalize'
                checked={column.getIsVisible()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {headerActions}
  </div>
);

// ──────────────────────────────────────────────
// Footer con totales
// ──────────────────────────────────────────────
interface TableFooterProps {
  showTotal: boolean;
  isLoading: boolean;
  filteredRowsLength: number;
  showFinancialSummary: boolean;
  calculateTotal: number;
  formatCurrency: (amount: number) => string;
}

const TableFooter: React.FC<TableFooterProps> = ({
  showTotal,
  isLoading,
  filteredRowsLength,
  showFinancialSummary,
  calculateTotal,
  formatCurrency,
}) => {
  if (!showTotal) return null;

  return (
    <div className='border-t bg-gray-50 px-6 py-3'>
      <div className='flex justify-between items-center'>
        <span className='font-semibold text-gray-700'>
          Total: {isLoading ? '...' : filteredRowsLength} records
        </span>

        {showFinancialSummary && (
          <div className='flex gap-4'>
            <FinancialSummary
              calculateTotal={calculateTotal}
              isLoading={isLoading}
              formatCurrency={formatCurrency}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────
// Paginación (GENÉRICO EN TData)
// ──────────────────────────────────────────────
interface TablePaginationProps<TData> {
  table: TanstackTable<TData>;
  isLoading: boolean;
}

const TablePagination = <TData,>({
  table,
  isLoading,
}: TablePaginationProps<TData>) => (
  <div className='flex items-center justify-end gap-2 py-4 pr-6 md:pr-8'>
    <Button
      variant='outline'
      size='sm'
      onClick={() => table.previousPage()}
      disabled={!table.getCanPreviousPage() || isLoading}
    >
      Previous
    </Button>
    <Button
      variant='outline'
      size='sm'
      onClick={() => table.nextPage()}
      disabled={!table.getCanNextPage() || isLoading}
    >
      Next
    </Button>
  </div>
);

export function DataTable<TData, TValue>({
  columns,
  data,
  showTotal = true,
  showFinancialSummary = false,
  totalField = 'amount',
  headerActions,
  isLoading = false,
}: DataTableProps<TData, TValue>): JSX.Element {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    initialState: {
      pagination: { pageSize: 4 },
    },
  });

  // Extraer las filas filtradas para evitar la expresión compleja en el hook
  const filteredRows = table.getFilteredRowModel().rows;

  // Usar el hook personalizado para el cálculo
  const calculateTotal = useFinancialCalculation(
    showFinancialSummary,
    isLoading,
    totalField,
    filteredRows
  );

  // Función para formatear moneda (memoizada)
  const formatCurrency = React.useCallback(
    (amount: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(Math.abs(amount)),
    []
  );

  // Función para renderizar las filas de datos
  const renderDataRows = () => {
    return table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ));
  };

  // Función para renderizar el contenido del tbody
  const renderTableContent = () => {
    if (isLoading) {
      return <LoadingRow colSpan={columns.length} />;
    }

    if (!table.getRowModel().rows?.length) {
      return <NoResultsRow colSpan={columns.length} />;
    }

    return renderDataRows();
  };

  return (
    <div>
      {/* Header con filtros */}
      <TableHeaderFilters<TData>
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        isLoading={isLoading}
        table={table}
        headerActions={headerActions}
      />

      {/* Tabla */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader className='bg-gray-100'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderTableContent()}</TableBody>
        </Table>

        {/* Footer con totales */}
        <TableFooter
          showTotal={showTotal}
          isLoading={isLoading}
          filteredRowsLength={filteredRows.length}
          showFinancialSummary={showFinancialSummary}
          calculateTotal={calculateTotal}
          formatCurrency={formatCurrency}
        />

        {/* Paginación */}
        <TablePagination<TData> table={table} isLoading={isLoading} />
      </div>
    </div>
  );
}
