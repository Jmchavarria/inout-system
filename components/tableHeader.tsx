// components/dataTable/TableHeader.tsx
'use client';

import React from 'react';
import { Plus } from 'lucide-react';

interface TableHeaderProps {
  title: string;
  addLabel?: string | null;
  onAdd?: () => void;
}

export const TableHeader: React.FC<TableHeaderProps> = ({ title, addLabel, onAdd }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>

      {addLabel && (
        <button
          className="rounded-lg w-10 h-10 bg-gray-600 text-white flex items-center justify-center hover:bg-gray-800 transition-all duration-200 hover:scale-105 active:scale-95"
          title={addLabel}
          onClick={onAdd}
        >
          <Plus className="w-5 h-5" aria-label={addLabel} />
        </button>
      )}
    </div>
  );
};
