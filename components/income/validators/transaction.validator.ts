// income/validators/transaction.validator.ts
import { z } from 'zod';

export const transactionSchema = z.object({
  amount: z
    .string()
    .min(1)
    .refine(v => !isNaN(Number(v)) && Number(v) !== 0),
  concept: z.string().min(3).max(100),
  date: z.string().min(1)
});
