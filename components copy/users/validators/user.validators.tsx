// components/users/validators/user.validator.ts
import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  role: z.enum(['admin', 'user'], {
    message: 'Invalid role',
  }),
});

export type UserFormData = z.infer<typeof userSchema>;
