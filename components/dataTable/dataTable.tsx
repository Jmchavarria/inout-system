// components/dataTable/DataTable.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { SearchBar } from '../searchBar';
import { Pagination } from '../pagination';
import { TableHeader } from '../tableHeader';
import { TableBody } from '../TableBody';
import { UseDataTable } from '@/context/dataTableContext';
import type { ModalController, ModalType } from '@/components/dataTable/types';

// Importa tus forms reales
import { IncomeExpenseForm } from '../income';
import { UserForm } from '../users/components/usersForm';

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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { title, columns, actions, data, addLabel } = UseDataTable();

  const itemsPerPage = 5;

  const modal: ModalController = {
    isOpen: isModalOpen,
    type: modalType,
    selected: selectedUser,
    open: (type, selected = null) => {
      setModalType(type);
      setSelectedUser(selected);
      setIsModalOpen(true);
    },
    close: () => {
      setIsModalOpen(false);
      setModalType(null);
      setSelectedUser(null);
    },
  };

  const handleTransactionSubmit = async (payload: any) => {
    if (fetchExecuted) await fetchExecuted(payload);
  };

  // Filtrado
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item: any) =>
      Object.values(item).some((value) =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [data, searchTerm]);

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

  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIcon: React.FC<SortIconProps> = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronsUpDown className="w-4 h-4 ml-1" />;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  return (
    <div className="from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <TableHeader
              title={title}
              addLabel={addLabel}
              onAdd={() => {
                // Si quieres que dependa del módulo:
                // modal.open(title === 'users' ? 'user' : 'income', null)
                modal.open('user', null);
              }}
            />

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
                      className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                        col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                      } transition`}
                    >
                      <div className="flex items-center">
                        {col.label}
                        {col.sortable !== false && <SortIcon column={col.key} />}
                      </div>
                    </th>
                  ))}

                  {/* Columna acciones */}
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

      {/* ✅ Modales SIEMPRE fuera del table */}
      {modal.type === 'income' && (
        <IncomeExpenseForm
          isOpen={modal.isOpen}
          onClose={modal.close}
          onSubmit={async (formData) => {
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
          onSubmit={async (formData) => {
            // editar
            if (modal.selected && fetchExecuted) {
              await fetchExecuted({
                id: modal.selected.id,
                ...formData,
              });
              modal.close();
              return;
            }

            // crear (si luego implementas create)
            // if (fetchExecuted) await fetchExecuted(formData);
            // modal.close();
          }}
        />
      )}
    </div>
  );
};
