// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// ❌ ELIMINA ESTA LÍNEA - No se permite en proxy
// export const runtime = 'nodejs';

export async function proxy(req: NextRequest) {
  try {
    // 📌 Obtenemos la sesión desde auth
    const session = await auth.api.getSession({ headers: req.headers });

    const { pathname } = req.nextUrl;
    const isAuthPage = pathname.startsWith('/auth');

    // 🚫 No hay sesión y no está en /auth → redirigir al login
    if (!session?.user && !isAuthPage) {
      const loginUrl = new URL('/auth/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // ✅ Ya autenticado pero está en /auth → redirigir al home
    if (session?.user && isAuthPage) {
      const homeUrl = new URL('/', req.url);
      return NextResponse.redirect(homeUrl);
    }

    // ✅ Permitir acceso normal
    return NextResponse.next();
  } catch (err) {
    console.error('❌ [proxy] Error en auth check:', err);

    // fallback → redirigir al login si algo falla
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// 📌 Configuración - excluye también /images/
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|images).*)'
  ],
};