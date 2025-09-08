// components/users/columns.tsx
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Pencil } from 'lucide-react';
import { Button } from '../ui';

export type User = {
  id: string;
  name: string;
  email: string;
  tel: string;
  role: string;
};

// Función para crear las columnas con callbacks
export const createUserColumns = (
  onEdit: (user: User) => void
): ColumnDef<User>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Name
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Email
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
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
        <Button
          variant='ghost'
          className='h-8 w-8 p-0'
          onClick={() => onEdit(user)}
          aria-label='Edit user'
          title='Edit'
        >
          <Pencil className='h-4 w-4' />
        </Button>
      );
    },
  },
];
