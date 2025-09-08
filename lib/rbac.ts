// lib/rbac.ts
import type { NextApiRequest } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export type Role = 'admin' | 'user';

export async function requireSession(req: NextApiRequest) {
  // Crear Headers object compatible
  const headers = new Headers();
  if (req.headers.cookie) {
    headers.set('cookie', req.headers.cookie);
  }

  const session = await auth.api.getSession({
    headers,
  });

  if (!session?.user)
    throw Object.assign(new Error('unauthorized'), { status: 401 });
  return session;
}

/** Verifica que el usuario autenticado tenga alguno de los roles permitidos. */
export async function requireRole(
  req: NextApiRequest,
  roles: Role[] = ['admin']
) {
  const session = await requireSession(req);
  // Leemos rol de la BD para no depender de que venga en la cookie
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!me?.role || !roles.includes(me.role as Role)) {
    throw Object.assign(new Error('forbidden'), { status: 403 });
  }
  return { session, role: me.role as Role, userId: session.user.id };
}
