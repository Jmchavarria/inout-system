// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

// 👇 Fuerza a que este middleware se ejecute en runtime Node.js
export const runtime = 'nodejs';

export async function middleware(req: NextRequest) {
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
    console.error('❌ [middleware] Error en auth check:', err);

    // fallback → redirigir al login si algo falla
    const loginUrl = new URL('/auth/login', req.url);
    return NextResponse.redirect(loginUrl);
  }
}

// 📌 Configuración CORREGIDA - excluye también /images/
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|images).*)'
  ],
};