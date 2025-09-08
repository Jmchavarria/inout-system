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
  console.log('🔍 [requireRole] Starting role check...');
  console.log('🔍 [requireRole] Required roles:', roles);
  
  const session = await requireSession(req);
  console.log('✅ [requireRole] Session found for user:', session.user.id);
  
  // Leemos rol de la BD para no depender de que venga en la cookie
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  
  console.log('🔍 [requireRole] User from DB:', me);
  console.log('🔍 [requireRole] Raw role value:', me?.role);
  console.log('🔍 [requireRole] Role type:', typeof me?.role);
  
  // NO NORMALIZAR - usar el valor exacto de la base de datos
  const userRole = me?.role;
  console.log('🔍 [requireRole] User role:', userRole);
  
  if (!userRole || !roles.includes(userRole as Role)) {
    console.error('❌ [requireRole] Access denied. User role:', userRole, 'Required:', roles);
    throw Object.assign(new Error('forbidden'), { status: 403 });
  }
  
  console.log('✅ [requireRole] Access granted for role:', userRole);
  return { session, role: userRole as Role, userId: session.user.id };
}