// context/dataTableContext.tsx
'use client';

import React, { createContext, useContext, useState, Dispatch, SetStateAction } from 'react';
import type { ColumnConfig } from '@/components/dataTable/types';

type DataTableContextValue = {
  title: string;
  setTitle: Dispatch<SetStateAction<string>>;

  columns: ColumnConfig[];
  setColumns: Dispatch<SetStateAction<ColumnConfig[]>>;

  data: any[];
  setData: Dispatch<SetStateAction<any[]>>;

  addLabel: string | null;
  setAddLabel: Dispatch<SetStateAction<string | null>>;

  actions: boolean;
  setActions: Dispatch<SetStateAction<boolean>>;

  fetchExecuted?: (data: any) => Promise<void>;
};

const DataTableContext = createContext<DataTableContextValue | null>(null);

export function DataTableProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string>('');
  const [columns, setColumns] = useState<ColumnConfig[]>([]);
  const [data, setData] = useState<any[]>([]);
  const [addLabel, setAddLabel] = useState<string | null>(null);
  const [actions, setActions] = useState<boolean>(false);

  const value: DataTableContextValue = {
    title,
    setTitle,
    columns,
    setColumns,
    data,
    setData,
    addLabel,
    setAddLabel,
    actions,
    setActions,
  };

  return <DataTableContext.Provider value={value}>{children}</DataTableContext.Provider>;
}

export function useDataTable(): DataTableContextValue {
  const ctx = useContext(DataTableContext);
  if (!ctx) throw new Error('useDataTable must be used within <DataTableProvider />');
  return ctx;
}

// Mantengo tu nombre por compatibilidad si ya lo importaste así
export const UseDataTable = useDataTable;
