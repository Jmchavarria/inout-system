'use client';

import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';

export type Income = {
  id: string;
  concept: string;
  amount: number; // + ingreso, - egreso
  date: string; // YYYY-MM-DD
  user: { id: string; name: string; email: string };
};

// Función para manejar las acciones de edición
const handleEditAction = (income: Income) => {
  // Aquí puedes implementar la lógica de edición
  // Por ejemplo, abrir un modal, navegar a una página de edición, etc.
  console.warn('Edit action for income:', income.id, income.concept);
};

export const columns: ColumnDef<Income>[] = [
  {
    accessorKey: 'concept',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Concept
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => {
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
    cell: ({ row }) => {
      const date = row.getValue('date') as string;
      return new Date(date).toLocaleDateString('es-CO');
    },
  },
  {
    accessorFn: (row) => `${row.user.name} ${row.user.email}`,
    id: 'user',
    header: 'User',
    cell: ({ row }) => {
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
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => handleEditAction(row.original)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                console.warn('Delete action for income:', row.original.id)
              }
              className='text-red-600'
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
