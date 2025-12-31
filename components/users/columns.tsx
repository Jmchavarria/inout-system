// components/users/columns.tsx
'use client';

import { ArrowUpDown, Pencil } from 'lucide-react';

export type User = {
  id: string;
  name: string;
  email: string;
  tel: string;
  role: string;
};

// Función para crear las columnas con callbacks
export const columns = (onEdit: (user: User) => void) => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <button
          className='flex items-center hover:bg-gray-100 px-3 py-2 rounded'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </button>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <button
          className='flex items-center hover:bg-gray-100 px-3 py-2 rounded'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </button>
      );
    },
  },
  {
    accessorKey: 'tel',
    header: 'Phone',
  },
  {
    id: 'action',
    header: 'Action',
    enableGlobalFilter: false,
    cell: ({ row }) => {
      const user = row.original;

      return (
        <button
          className='h-8 w-8 p-0 flex items-center justify-center hover:bg-gray-100 rounded'
          onClick={() => onEdit(user)}
          aria-label='Edit user'
          title='Edit'
        >
          <Pencil className='h-4 w-4' />
        </button>
      );
    },
  },
];