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
    // Crear Headers object compatible
    const headers = new Headers();
    if (ctx.req.headers.cookie) {
      headers.set('cookie', ctx.req.headers.cookie);
    }

    const session = await auth.api.getSession({
      headers,
    });

    if (!session?.user) {
      return { redirect: { destination: '/auth/login', permanent: false } };
    }

    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!me?.role || !allowed.includes(me.role as Role)) {
      return { redirect: { destination: '/403', permanent: false } };
    }

    return { props: {} };
  };
  return gssp;
}
