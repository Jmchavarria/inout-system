'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';


const transactionSchema = z.object({
  concept: z
    .string()
    .min(1, 'The concept is required')
    .min(3, 'Minimum 3 characters')
    .max(100, 'Maximum 100 characters')
    .trim(),

  amount: z
    .string()
    .min(1, 'The amount is required')
    .regex(/^-?\d+(\.\d{1,2})?$/, 'Enter a valid number')
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num !== 0;
    }, 'Amount cannot be zero')
    .refine((val) => {
      const num = parseFloat(val);
      return Math.abs(num) <= 999999999;
    }, 'Amount too large'),

  date: z
    .string()
    .min(1, 'The date is required')
    .refine((val) => {
      const selectedDate = new Date(val);
      const today = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      return selectedDate <= today && selectedDate >= oneYearAgo;
    }, 'Date must be within the last year and not in the future'),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface NewTransactionFormProps {
  onSubmit: (data: TransactionFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export default function NewTransactionForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: NewTransactionFormProps) {
  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    mode: 'onChange',
    defaultValues: {
      amount: '',
      concept: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  const handleSubmit = (data: TransactionFormData) => {
    onSubmit(data);
    form.reset();
  };

  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <div className='w-full max-w-xl mx-auto'>

      <div>New Transaction</div>

    </div>
  );
}
