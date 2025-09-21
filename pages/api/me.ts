// pages/api/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Role = 'admin' | 'user';

type OkResponse = {
  userId: string;
  role: Role;
  name?: string;
  email?: string;
  image?: string;
};

type ErrResponse = {
  error: 'unauthorized' | 'forbidden' | 'server_error' | 'method_not_allowed';
  message?: string;
};

const isDev = process.env.NODE_ENV !== 'production';

// Normaliza cualquier valor a 'admin' | 'user'
const toRole = (role: unknown): Role =>
  String(role ?? '').trim().toLowerCase() === 'admin' ? 'admin' : 'user';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<OkResponse | ErrResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res
      .status(405)
      .json({ error: 'method_not_allowed', message: 'Method not allowed' });
  }

  try {
    if (isDev) console.debug('[API /me] Getting session from auth');

    // Obtener sesión (pasando headers para compatibilidad con SSR / cookies)
    const session = await auth.api.getSession({ headers: req.headers as any });

    if (!session?.user?.id) {
      if (isDev) console.debug('[API /me] No session / no user id found');
      return res.status(401).json({ error: 'unauthorized', message: 'No session' });
    }

    const userId = session.user.id;
    if (isDev) console.debug('[API /me] Session user id:', userId);

    // Traer solo los campos necesarios (incluimos name/email/image por conveniencia)
    const userFromDb = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, name: true, email: true, image: true },
    });

    if (!userFromDb) {
      if (isDev) console.debug('[API /me] User not found in DB:', userId);
      return res.status(500).json({
        error: 'server_error',
        message: 'User not found in database',
      });
    }

    const finalRole = toRole(userFromDb.role);
    if (isDev) console.debug('[API /me] role from db:', userFromDb.role, '->', finalRole);

    const response: OkResponse = {
      userId: userFromDb.id,
      role: finalRole,
      name: userFromDb.name ?? undefined,
      email: userFromDb.email ?? undefined,
      image: userFromDb.image ?? undefined,
    };

    // Header de cache para CDNs / edge (opcional — ajusta valores según tu infra)
    // Esto ayuda a reducir latencia en llamadas repetidas desde clientes
    res.setHeader('Cache-Control', 'private, max-age=0, s-maxage=60, stale-while-revalidate=30');

    return res.status(200).json(response);
  } catch (err) {
    console.error('[API /me] Unexpected error:', err);
    return res.status(500).json({
      error: 'server_error',
      message: 'Internal server error',
    });
  }
}
