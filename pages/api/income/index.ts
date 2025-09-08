// pages/api/income/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';

type ApiItem = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: { id: string; name: string | null; email: string | null };
};

type ApiResponse =
  | { items: ApiItem[] }
  | {
      error:
        | 'unauthorized'
        | 'forbidden'
        | 'internal_error'
        | 'method_not_allowed';
    };

// Helper para status seguro desde unknown
const getHttpStatus = (err: unknown): number => {
  if (typeof err === 'object' && err !== null) {
    const anyErr = err as { status?: unknown; code?: unknown };
    const s =
      typeof anyErr.status === 'number'
        ? anyErr.status
        : typeof anyErr.code === 'number'
          ? anyErr.code
          : undefined;
    if (typeof s === 'number' && s >= 400 && s <= 599) return s;
  }
  return 500;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // Ambos roles pueden usar este recurso
    const { userId, role } = await requireRole(req, ['admin', 'user']);

    // Admin puede leer de otro usuario via ?userId
    const qUserId =
      role === 'admin' &&
      typeof req.query.userId === 'string' &&
      req.query.userId
        ? req.query.userId
        : userId;

    const rows = await prisma.transaction.findMany({
      where: { userId: qUserId },
      orderBy: { date: 'desc' },
      take: 200,
      select: {
        id: true,
        concept: true,
        amount: true, // Prisma.Decimal
        date: true, // Date
        user: { select: { id: true, name: true, email: true } },
      },
    });

    const items: ApiItem[] = rows.map((r) => ({
      id: r.id,
      concept: r.concept,
      amount: Number(r.amount), // Decimal -> number
      date: r.date.toISOString(), // Date -> ISO
      user: r.user,
    }));

    return res.json({ items });
  } catch (err: unknown) {
    const code = getHttpStatus(err);
    const error: ApiResponse['error'] =
      code === 401
        ? 'unauthorized'
        : code === 403
          ? 'forbidden'
          : 'internal_error';
    return res.status(code).json({ error });
  }
}
