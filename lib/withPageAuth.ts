import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

type Role = 'admin' | 'user';

/**
 * Envuelve getServerSideProps y redirige según roles permitidos.
 * - Si no hay sesión -> /auth/login
 * - Si hay sesión pero el rol no está permitido -> /403
 */
export function withPageAuth(allowed: Role[]) {
  const gssp: GetServerSideProps = async (ctx: GetServerSidePropsContext) => {
    console.log('🔍 [withPageAuth] Starting page auth check...');
    console.log('🔍 [withPageAuth] Allowed roles:', allowed);
    
    // Crear Headers object compatible
    const headers = new Headers();
    if (ctx.req.headers.cookie) {
      headers.set('cookie', ctx.req.headers.cookie);
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      console.log('❌ [withPageAuth] No session found, redirecting to login');
      return { redirect: { destination: '/auth/login', permanent: false } };
    }

    console.log('✅ [withPageAuth] Session found for user:', session.user.id);

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    console.log('🔍 [withPageAuth] User from DB:', me);
    console.log('🔍 [withPageAuth] User role type:', typeof me?.role);
    console.log('🔍 [withPageAuth] User role value:', me?.role);

    // NORMALIZAR EL ROL - convertir null/undefined a 'user', normalizar case
    const userRole = (me?.role as string)?.toLowerCase().trim() || 'user';
    console.log('🔍 [withPageAuth] Normalized role:', userRole);

    // Verificar si el rol normalizado está en los roles permitidos
    const isAllowed = allowed.some(role => role.toLowerCase() === userRole);
    console.log('🔍 [withPageAuth] Is role allowed?', isAllowed);

    if (!isAllowed) {
      console.error('❌ [withPageAuth] Access denied. User role:', userRole, 'Allowed:', allowed);
      return { redirect: { destination: '/403', permanent: false } };
    }

    console.log('✅ [withPageAuth] Access granted for role:', userRole);
    return { props: {} };
  };
  return gssp;
}