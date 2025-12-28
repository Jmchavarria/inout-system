'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

// Tipos
interface Column<TData> {
  id: string;
  header: string | ((props: { column: Column<TData> }) => React.ReactNode);
  accessorKey?: string;
  cell?: (props: { row: TData; value: any }) => React.ReactNode;
  enableSorting?: boolean;
  enableHiding?: boolean;
}

interface DataTableProps<TData> {
  columns: Column<TData>[];
  data: TData[];
  showTotal?: boolean;
  showFinancialSummary?: boolean;
  totalField?: string;
  headerActions?: React.ReactNode;
  isLoading?: boolean;
  pageSize?: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

// Componentes auxiliares
const LoadingRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className='h-24 text-center px-4 py-2'>
      <div className='flex items-center justify-center gap-2'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600' />
        Cargando...
      </div>
    </td>
  </tr>
);

const NoResultsRow: React.FC<{ colSpan: number }> = ({ colSpan }) => (
  <tr>
    <td colSpan={colSpan} className='h-24 text-center px-4 py-2'>
      No results.
    </td>
  </tr>
);

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

// Componente principal
export function DataTable<TData extends Record<string, any>>({
  columns,
  data,
  showTotal = true,
  showFinancialSummary = false,
  totalField = 'amount',
  headerActions,
  isLoading = false,
  pageSize = 4,
}: DataTableProps<TData>): JSX.Element {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null });
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    columns.forEach((col) => {
      initial[col.id] = true;
    });
    return initial;
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Obtener valor de una celda
  const getCellValue = useCallback((row: TData, column: Column<TData>) => {
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  }, []);

  // Filtrar datos
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;

    return data.filter((row) => {
      return columns.some((column) => {
        const value = getCellValue(row, column);
        if (value == null) return false;
        return String(value).toLowerCase().includes(globalFilter.toLowerCase());
      });
    });
  }, [data, globalFilter, columns, getCellValue]);

  // Ordenar datos
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData;

    return [...filteredData].sort((a, b) => {
      const column = columns.find((col) => col.id === sortConfig.key);
      if (!column) return 0;

      const aValue = getCellValue(a, column);
      const bValue = getCellValue(b, column);

      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      }
      return bStr.localeCompare(aStr);
    });
  }, [filteredData, sortConfig, columns, getCellValue]);

  // Paginar datos
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Manejar ordenamiento
  const handleSort = useCallback((columnId: string) => {
    setSortConfig((prev) => {
      if (prev.key !== columnId) {
        return { key: columnId, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { key: columnId, direction: 'desc' };
      }
      return { key: '', direction: null };
    });
  }, []);

  // Calcular total financiero
  const calculateTotal = useMemo(() => {
    if (!showFinancialSummary || isLoading) return 0;

    return sortedData.reduce((sum, row) => {
      const value = row[totalField];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0);
  }, [showFinancialSummary, isLoading, totalField, sortedData]);

  // Formatear moneda
  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(Math.abs(amount)),
    []
  );

  // Columnas visibles
  const visibleColumns = useMemo(() => {
    return columns.filter((col) => columnVisibility[col.id]);
  }, [columns, columnVisibility]);

  // Renderizar encabezado de columna
  const renderHeader = (column: Column<TData>) => {
    const isSortable = column.enableSorting !== false;
    const isSorted = sortConfig.key === column.id;

    const headerContent = typeof column.header === 'function' 
      ? column.header({ column }) 
      : column.header;

    if (!isSortable) {
      return <span className="font-medium text-gray-700">{headerContent}</span>;
    }

    return (
      <button
        onClick={() => handleSort(column.id)}
        className='flex items-center gap-1 hover:text-gray-900 font-medium text-gray-700 transition-colors'
      >
        {headerContent}
        {isSorted && sortConfig.direction === 'asc' && <ChevronUp className='w-4 h-4' />}
        {isSorted && sortConfig.direction === 'desc' && <ChevronDown className='w-4 h-4' />}
        {!isSorted && <ChevronsUpDown className='w-4 h-4 opacity-40' />}
      </button>
    );
  };

  // Renderizar celda
  const renderCell = (row: TData, column: Column<TData>) => {
    const value = getCellValue(row, column);
    
    if (column.cell) {
      return column.cell({ row, value });
    }

    return value != null ? String(value) : '';
  };

  return (
    <div className="w-full">
      {/* Header con filtros */}
      <div className='flex gap-2.5 py-4 justify-between flex-wrap'>
        <div className='flex flex-1 gap-2.5 flex-wrap min-w-[200px]'>
          <input
            type="text"
            placeholder='Buscar...'
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value);
              setCurrentPage(1);
            }}
            className='max-w-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            disabled={isLoading}
          />
          <div className="relative">
            <button
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className='px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium'
              disabled={isLoading}
            >
              Columns
            </button>
            {showColumnMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 min-w-[150px]">
                {columns
                  .filter((col) => col.enableHiding !== false)
                  .map((column) => (
                    <label
                      key={column.id}
                      className='flex items-center gap-2 px-4 py-2 hover:bg-gray-50 cursor-pointer'
                    >
                      <input
                        type="checkbox"
                        checked={columnVisibility[column.id]}
                        onChange={(e) =>
                          setColumnVisibility((prev) => ({
                            ...prev,
                            [column.id]: e.target.checked,
                          }))
                        }
                        className="w-4 h-4"
                      />
                      <span className="capitalize text-sm">
                        {typeof column.header === 'string' ? column.header : column.id}
                      </span>
                    </label>
                  ))}
              </div>
            )}
          </div>
        </div>
        {headerActions}
      </div>

      {/* Tabla */}
      <div className='rounded-md border border-gray-200 overflow-hidden'>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className='bg-gray-100'>
              <tr>
                {visibleColumns.map((column) => (
                  <th key={column.id} className="text-left px-4 py-3 border-b border-gray-200">
                    {renderHeader(column)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <LoadingRow colSpan={visibleColumns.length} />
              ) : paginatedData.length === 0 ? (
                <NoResultsRow colSpan={visibleColumns.length} />
              ) : (
                paginatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100">
                    {visibleColumns.map((column) => (
                      <td key={column.id} className="px-4 py-3">{renderCell(row, column)}</td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer con totales */}
        {showTotal && (
          <div className='border-t border-gray-200 bg-gray-50 px-6 py-3'>
            <div className='flex justify-between items-center flex-wrap gap-4'>
              <span className='font-semibold text-gray-700'>
                Total: {isLoading ? '...' : sortedData.length} records
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
        )}

        {/* Paginación */}
        <div className='flex items-center justify-end gap-3 py-4 px-6 border-t border-gray-200'>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className='text-sm text-gray-600 font-medium'>
            Page {currentPage} of {totalPages || 1}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage >= totalPages || isLoading}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}