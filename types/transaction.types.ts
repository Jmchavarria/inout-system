// src/types/transaction.types.ts
import { z } from 'zod';
import { transactionSchema } from '@/components/income/validators/transaction.validator';

export type TransactionFormData =
  z.infer<typeof transactionSchema>;

export interface Transaction {
  id: string;
  amount: number;
  concept: string;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
}

