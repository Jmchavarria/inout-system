// pages/api/users/index.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/rbac';
import { z } from 'zod';

type Role = 'admin' | 'user';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  role: z.enum(['admin', 'user']),
  email: z.string().email().optional(),
  tel: z.string().optional(),
});

type UserDTO = {
  id: string;
  name: string | null;
  email: string | null;
  tel: string | null;
  role: Role;
  createdAt: string;
};

type ListResponse = { items: UserDTO[] };
type ErrorKey =
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_body'
  | 'method_not_allowed'
  | 'internal_error';
type ErrorResponse = { error: ErrorKey; details?: unknown };

// Normaliza cualquier valor a 'admin' | 'user'
const toRole = (r: unknown): Role => {
  if (r === 'admin' || r === 'user') return r;
  const s = String(r ?? '').toLowerCase();
  return s === 'admin' ? 'admin' : 'user';
};

// Prisma devuelve role como string; aquí lo normalizamos al DTO
const toUserDTO = (u: {
  id: string;
  name: string | null;
  email: string | null;
  tel: string | null;
  role: string; // ← importante: string de Prisma
  createdAt: Date;
}): UserDTO => ({
  id: u.id,
  name: u.name,
  email: u.email,
  tel: u.tel,
  role: toRole(u.role),
  createdAt: u.createdAt.toISOString(),
});

const getStatusFromError = (err: unknown): number => {
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>;
    const s = obj.status ?? obj.code;
    if (typeof s === 'number' && s >= 400 && s <= 599) return s;
  }
  return 500;
};

async function handleGet(
  _req: NextApiRequest,
  res: NextApiResponse<ListResponse | ErrorResponse>
) {
  const rows = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      tel: true,
      role: true, // Prisma: string
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return res.status(200).json({ items: rows.map(toUserDTO) });
}

async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<UserDTO | ErrorResponse>
) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: 'invalid_body', details: parsed.error.flatten() });
  }

  const { name, role, email, tel } = parsed.data;

  const created = await prisma.user.create({
    data: { name, role, email: email ?? null, tel: tel ?? null },
    select: {
      id: true,
      name: true,
      email: true,
      tel: true,
      role: true, // Prisma: string
      createdAt: true,
    },
  });

  return res.status(201).json(toUserDTO(created));
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ListResponse | UserDTO | ErrorResponse>
) {
  try {
    // 🔒 solo admins
    await requireRole(req, ['admin']);

    if (req.method === 'GET') return handleGet(req, res);
    if (req.method === 'POST') return handlePost(req, res);

    return res.status(405).json({ error: 'method_not_allowed' });
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
