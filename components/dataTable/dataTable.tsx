// components/dataTable/DataTable.tsx
'use client';

import React, { useMemo, useState, useCallback, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SearchBar } from '../searchBar';
import { Pagination } from '../pagination';
import { TableHeader } from '../tableHeader';
import { TableBody } from '../TableBody';
import { UseDataTable } from '@/context/dataTableContext';
import type { ModalController, ModalType } from '@/components/dataTable/types';

// ✅ Cargar forms SOLO cuando se necesiten (reduce unused JS)
const IncomeExpenseForm = dynamic(
  () => import('../income').then((m) => m.IncomeExpenseForm),
  { ssr: false, loading: () => null }
);

const UserForm = dynamic(
  () => import('../users/components/usersForm').then((m) => m.UserForm),
  { ssr: false, loading: () => null }
);

type SortDirection = 'asc' | 'desc';

interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

interface SortIconProps {
  column: string;
}

interface DataTableProps {
  fetchExecuted?: (data: any) => Promise<void>;
}

export const DataTable: React.FC<DataTableProps> = ({ fetchExecuted }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const deferredSearch = useDeferredValue(searchTerm);

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { title, columns, actions, data, addLabel } = UseDataTable();
  const itemsPerPage = 5;

  const modal: ModalController = useMemo(
    () => ({
      isOpen: isModalOpen,
      type: modalType,
      selected: selectedUser,
      open: (type: ModalType, selected: any | null = null) => {
        setModalType(type);
        setSelectedUser(selected);
        setIsModalOpen(true);
      },
      close: () => {
        setIsModalOpen(false);
        setModalType(null);
        setSelectedUser(null);
      },
    }),
    [isModalOpen, modalType, selectedUser],
  );

  const handleTransactionSubmit = useCallback(
    async (payload: any) => {
      if (fetchExecuted) await fetchExecuted(payload);
    },
    [fetchExecuted],
  );

  // ✅ Filtrado más amigable con rendimiento (usa deferredSearch)
  const filteredData = useMemo(() => {
    if (!data) return [];
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return data;

    return data.filter((item: any) =>
      Object.values(item).some((value) =>
        String(value ?? '').toLowerCase().includes(q),
      ),
    );
  }, [data, deferredSearch]);

  // Ordenamiento
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;

    return [...filteredData].sort((a: any, b: any) => {
      const aVal = a[sortConfig.key as string];
      const bVal = b[sortConfig.key as string];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginatedData = useMemo(
    () =>
      sortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [sortedData, currentPage],
  );

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const SortIcon: React.FC<SortIconProps> = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronsUpDown className="w-4 h-4 ml-1" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  const handleAdd = useCallback(() => {
    const type: ModalType = title.toLowerCase().includes('income') ? 'income' : 'user';
    modal.open(type, null);
  }, [title, modal]);

  return (
    <div className="from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <TableHeader title={title} addLabel={addLabel} onAdd={handleAdd} />

            <SearchBar
              value={searchTerm}
              onChange={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              placeholder="Buscar en todos los campos..."
            />
          </div>

          {/* Tabla */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((col, index) => (
                    <th
                      key={index}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                        } transition`}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {col.sortable !== false && <SortIcon column={col.key} />}
                      </div>
                    </th>
                  ))}

                  {actions && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <TableBody paginatedData={paginatedData} modal={modal} />
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* ✅ Modales SOLO si se usan, y forms se cargan en demanda */}
      {modal.type === 'income' && (
        <IncomeExpenseForm
          isOpen={modal.isOpen}
          onClose={modal.close}
          onSubmit={async (formData: any) => {
            await handleTransactionSubmit(formData);
            modal.close();
          }}
        />
      )}

      {modal.type === 'user' && (
        <UserForm
          isOpen={modal.isOpen}
          onClose={modal.close}
          initialData={modal.selected}
          onSubmit={async (formData: any) => {
            if (modal.selected && fetchExecuted) {
              await fetchExecuted({ id: modal.selected.id, ...formData });
              modal.close();
            }
          }}
        />
      )}
    </div>
  );
};
