// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { requireRole } from '@/lib/rbac';

type Role = 'admin' | 'user';
type OkResponse = { userId: string; role: Role };
type ErrResponse = { error: 'unauthorized' | 'forbidden' };

const getStatus = (err: unknown): 401 | 403 => {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const s = obj.status;
    if (s === 403) return 403;
    if (s === 401) return 401;
  }
  return 401; // por defecto tratamos como no autenticado
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>
) {
  try {
    // Acepta admin y user para poder identificarte
    const { userId, role } = await requireRole(req, ['admin', 'user']);
    return res.status(200).json({ userId, role: role as Role });
  } catch (err: unknown) {
    const code = getStatus(err);
    return res
      .status(code)
      .json({ error: code === 401 ? 'unauthorized' : 'forbidden' });
  }
}
