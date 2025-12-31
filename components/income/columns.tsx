'use client';

import { ArrowUpDown, Pencil } from 'lucide-react';

export type Income = {
  id: string;
  concept: string;
  amount: number; // + ingreso, - egreso
  date: string; // YYYY-MM-DD
  user: { id: string; name: string; email: string };
};

// Función para crear las columnas con callbacks
export const columns = (onEdit: (income: Income) => void) => [
  {
    accessorKey: 'concept',
    header: ({ column }: any) => {
      return (
        <button
          className='flex items-center hover:bg-gray-100 px-3 py-2 rounded'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Concept
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </button>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }: any) => {
      const amount = row.getValue('amount') as number;
      const formattedAmount = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(Math.abs(amount));

      return (
        <span className={amount >= 0 ? 'text-green-600' : 'text-red-600'}>
          {amount >= 0 ? '+' : '-'}
          {formattedAmount}
        </span>
      );
    },
  },
  {
    accessorKey: 'date',
    header: 'Date',
    cell: ({ row }: any) => {
      const date = row.getValue('date') as string;
      return new Date(date).toLocaleDateString('es-CO');
    },
  },
  {
    accessorFn: (row: Income) => `${row.user.name} ${row.user.email}`,
    id: 'user',
    header: 'User',
    cell: ({ row }: any) => {
      const user = row.original.user;
      return (
        <div className='flex flex-col'>
          <span className='font-medium'>{user.name}</span>
          <span className='text-xs text-gray-500'>{user.email}</span>
        </div>
      );
    },
  },
  {
    id: 'action',
    header: 'Action',
    enableGlobalFilter: false,
    cell: ({ row }: any) => {
      const income = row.original;
      
      return (
        <button
          className='h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded'
          onClick={() => onEdit(income)}
          aria-label='Edit income'
          title='Edit'
        >
          <Pencil className='h-4 w-4' />
        </button>
      );
    },
  },
];