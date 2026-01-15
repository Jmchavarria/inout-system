// income/validators/transaction.validator.ts
import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1, { message: 'Amount is required' })
    .refine(
      v => !isNaN(Number(v)),
      { message: 'Amount must be a valid number' }
    )
    .refine(
      v => Number(v) !== 0,
      { message: 'Amount must be greater than zero' }
    ),

  concept: z
    .string()
    .min(3, { message: 'Concept must have at least 3 characters' })
    .max(100, { message: 'Concept must not exceed 100 characters' }),

  date: z
    .string()
    .min(1, { message: 'Date is required' }),
});
