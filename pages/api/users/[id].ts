// pages/api/users/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user']),
});

const getHttpStatus = (err: unknown): number => {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const candidates = [obj.status, obj.code];
    for (const c of candidates) {
      if (typeof c === 'number' && c >= 400 && c <= 599) return c;
    }
  }
  return 500;
};

type UserPayload = {
  id: string;
  name: string | null;
  email: string | null;
  tel: string | null;
  role: 'admin' | 'user';
  createdAt: string;
};

type ErrorKey =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_body'
  | 'method_not_allowed'
  | 'internal_error';

type ErrorResponse = { error: ErrorKey; details?: unknown };
type ApiResponse = UserPayload | ErrorResponse | void;

// Normaliza cualquier string a 'admin' | 'user'
const toRole = (r: unknown): 'admin' | 'user' => {
  if (r === 'admin' || r === 'user') return r;
  const s = String(r ?? '').toLowerCase();
  return s === 'admin' ? 'admin' : 'user';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  try {
    await requireRole(req, ['admin']);
    const { id } = req.query as { id: string };

    if (req.method === 'PATCH') {
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        res
          .status(400)
          .json({ error: 'invalid_body', details: parsed.error.flatten() });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: parsed.data,
        select: {
          id: true,
          name: true,
          email: true,
          tel: true,
          role: true,
          createdAt: true,
        },
      });

      // Construimos explícitamente el payload para respetar el tipo estricto
      const payload: UserPayload = {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        tel: updated.tel,
        role: toRole(updated.role),
        createdAt: updated.createdAt.toISOString(),
      };

      res.status(200).json(payload);
      return;
    }

    if (req.method === 'DELETE') {
      await prisma.user.delete({ where: { id } });
      res.status(204).end();
      return;
    }

    res.status(405).json({ error: 'method_not_allowed' });
  } catch (err: unknown) {
    const code = getHttpStatus(err);
    const key: ErrorKey =
      code === 401
        ? 'unauthorized'
        : code === 403
        ? 'forbidden'
        : 'internal_error';
    res.status(code).json({ error: key });
  }
}
