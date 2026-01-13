// components/dataTable/TableBody.tsx
'use client';

import React from 'react';
import { SquarePen } from 'lucide-react';
import { UseDataTable } from '@/context/dataTableContext';
import type { ModalController } from '@/components/dataTable/types';

interface TableBodyProps {
  paginatedData: any[];
  modal: ModalController;
}

export const TableBody: React.FC<TableBodyProps> = ({ paginatedData, modal }) => {
  const { columns, actions } = UseDataTable();

  return (
    <tbody className="bg-white divide-y divide-gray-200">
      {paginatedData.length > 0 ? (
        paginatedData.map((item, rowIndex) => (
          <tr key={item.id || rowIndex} className="hover:bg-gray-50 transition">
            {columns.map((col, colIndex) => (
              <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {item[col.key]}
              </td>
            ))}

            {actions && (
              <td className="px-6 py-4 whitespace-nowrap">
                <button title="Editar" onClick={() => modal.open('user', item)}>
                  <SquarePen className="w-4 h-4 cursor-pointer" />
                </button>
              </td>
            )}
          </tr>
        ))
      ) : (
        <tr>
          <td
            colSpan={columns.length + (actions ? 1 : 0)}
            className="px-6 py-4 text-center text-sm text-gray-500"
          >
            No se encontraron resultados
          </td>
        </tr>
      )}
    </tbody>
  );
};
