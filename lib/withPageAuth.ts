// lib/withPageAuth.ts
// Higher-Order Component para proteger páginas con autenticación y autorización

// ============================================================================
// IMPORTACIONES
// ============================================================================

import type { GetServerSideProps, GetServerSidePropsContext } from 'next';
import { auth } from '@/lib/auth';      // Instancia de Better Auth
import { prisma } from '@/lib/prisma';  // Cliente de base de datos

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

// Roles válidos en el sistema
type Role = 'admin' | 'user';

// ============================================================================
// HIGHER-ORDER COMPONENT PARA AUTENTICACIÓN DE PÁGINAS
// ============================================================================

/**
 * HOC que envuelve getServerSideProps para agregar autenticación y autorización
 * 
 * Flujo de autorización:
 * 1. Verifica si hay una sesión activa
 * 2. Si no hay sesión -> redirige a /auth/login
 * 3. Si hay sesión, consulta el rol del usuario en la base de datos
 * 4. Si el rol no está en la lista permitida -> redirige a /403
 * 5. Si todo está bien -> permite acceso a la página
 * 
 * @param allowed - Array de roles que pueden acceder a la página
 * @returns Una función getServerSideProps configurada con autenticación
 */
export function withPageAuth(allowed: Role[]) {
  // Define la función getServerSideProps que Next.js ejecutará en el servidor
  const gssp: GetServerSideProps = async (ctx: GetServerSidePropsContext) => {
    console.log('🔍 [withPageAuth] Starting page auth check...');
    console.log('🔍 [withPageAuth] Allowed roles:', allowed);
    
    // ========================================================================
    // PASO 1: PREPARAR HEADERS PARA BETTER AUTH
    // ========================================================================
    
    // Crear un objeto Headers compatible con Better Auth
    const headers = new Headers();
    if (ctx.req.headers.cookie) {
      // Pasar las cookies de la petición para mantener la sesión
      headers.set('cookie', ctx.req.headers.cookie);
    }

    // ========================================================================
    // PASO 2: VERIFICAR SESIÓN ACTIVA
    // ========================================================================
    
    // Obtener la sesión usando Better Auth
    const session = await auth.api.getSession({
      headers, // Pasar headers con cookies para validar la sesión
    });

    // Si no hay sesión o no hay usuario en la sesión
    if (!session?.user) {
      console.log('❌ [withPageAuth] No session found, redirecting to login');
      // Redirigir al login - permanent: false significa que es temporal
      return { redirect: { destination: '/auth/login', permanent: false } };
    }

    console.log('✅ [withPageAuth] Session found for user:', session.user.id);

    // ========================================================================
    // PASO 3: CONSULTAR ROL DEL USUARIO EN LA BASE DE DATOS
    // ========================================================================
    
    // Consultar el usuario en la base de datos para obtener su rol actual
    // No confiamos en el rol que pueda venir en la sesión/cookie
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }, // Solo necesitamos el rol
    });

    console.log('🔍 [withPageAuth] User from DB:', me);
    console.log('🔍 [withPageAuth] User role type:', typeof me?.role);
    console.log('🔍 [withPageAuth] User role value:', me?.role);

    // ========================================================================
    // PASO 4: NORMALIZAR Y VALIDAR EL ROL
    // ========================================================================
    
    // Normalizar el rol para manejar posibles inconsistencias:
    // - Convertir a minúsculas para comparación case-insensitive
    // - Eliminar espacios en blanco
    // - Usar 'user' como valor por defecto si el rol es null/undefined
    const userRole = (me?.role as string)?.toLowerCase().trim() || 'user';
    console.log('🔍 [withPageAuth] Normalized role:', userRole);

    // Verificar si el rol normalizado está en la lista de roles permitidos
    const isAllowed = allowed.some(role => role.toLowerCase() === userRole);
    console.log('🔍 [withPageAuth] Is role allowed?', isAllowed);

    // ========================================================================
    // PASO 5: DECISIÓN DE ACCESO
    // ========================================================================
    
    if (!isAllowed) {
      // El usuario está autenticado pero no tiene permisos para esta página
      console.error('❌ [withPageAuth] Access denied. User role:', userRole, 'Allowed:', allowed);
      // Redirigir a página de error 403 (Forbidden)
      return { redirect: { destination: '/403', permanent: false } };
    }

    console.log('✅ [withPageAuth] Access granted for role:', userRole);
    
    // ========================================================================
    // PASO 6: PERMITIR ACCESO
    // ========================================================================
    
    // Si llegamos aquí, el usuario está autenticado y autorizado
    // Retornar props vacío - la página puede renderizarse normalmente
    return { props: {} };
  };
  
  // Retornar la función getServerSideProps configurada
  return gssp;
}