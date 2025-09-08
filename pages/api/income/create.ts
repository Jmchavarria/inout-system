// pages/api/income/create.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { z } from 'zod';

const createSchema = z.object({
  concept: z.string().trim().min(1).max(200),
  amount: z.coerce
    .number()
    .refine(Number.isFinite, { message: 'amount must be a number' }),
  date: z.union([z.string(), z.date()]),
});

type Role = 'admin' | 'user';
type ApiOk = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: { id: string; name: string | null; email: string | null };
};
type ErrorKey =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_body'
  | 'method_not_allowed'
  | 'internal_error';
type ApiErr = { error: ErrorKey; details?: unknown };

// 🔧 Error tipado con status
class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const getStatusFromError = (err: unknown): number => {
  if (err instanceof HttpError) return err.status;
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const s = obj.status ?? obj.code;
    if (typeof s === 'number' && s >= 400 && s <= 599) return s;
  }
  return 500;
};

// Parseo de fecha robusto
function toUTCDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const s = String(input);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo, d));
  }
  const dt = new Date(s);
  if (isNaN(dt.getTime())) {
    throw new HttpError('invalid_date', 400);
  }
  return dt;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiOk | ApiErr>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Solo admin puede crear
    const { userId } = await requireRole(req, ['admin' as Role]);

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: 'invalid_body', details: parsed.error.flatten() });
    }

    const concept = parsed.data.concept.trim();
    const amount = parsed.data.amount;
    const date = toUTCDate(parsed.data.date as string | Date);

    const created = await prisma.transaction.create({
      data: { concept, amount, date, userId },
      select: {
        id: true,
        concept: true,
        amount: true,
        date: true,
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json({
      id: created.id,
      concept: created.concept,
      amount: Number(created.amount),
      date: created.date.toISOString(),
      user: created.user,
    });
  } catch (err: unknown) {
    const code = getStatusFromError(err);
    const error: ErrorKey =
      code === 401
        ? 'unauthorized'
        : code === 403
          ? 'forbidden'
          : 'internal_error';
    return res.status(code).json({ error });
  }
}
