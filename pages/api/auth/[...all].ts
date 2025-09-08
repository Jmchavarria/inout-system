// Archivo: pages/api/auth/[...nextauth].ts o app/api/auth/[...nextauth]/route.ts
// Este es el handler principal de autenticación para Better Auth

// ============================================================================
// IMPORTACIONES
// ============================================================================

// Importa la instancia de Better Auth configurada
import { auth } from '@/lib/auth';

// Importa el adaptador de Better Auth para Next.js (Node.js)
import { toNodeHandler } from 'better-auth/node';

// ============================================================================
// CONFIGURACIÓN DE LA API ROUTE
// ============================================================================

// Configuración especial para Next.js API routes
export const config = { 
  api: { 
    bodyParser: false  // Desactiva el bodyParser automático de Next.js
                       // Better Auth maneja el parsing del body internamente
                       // Esto evita conflictos y permite que Better Auth
                       // procese correctamente las peticiones
  } 
};

// ============================================================================
// EXPORT DEL HANDLER
// ============================================================================

// Exporta el handler de Better Auth convertido para Node.js/Next.js
// Este handler maneja todas las rutas de autenticación:
// - /api/auth/sign-in
// - /api/auth/sign-out  
// - /api/auth/session
// - /api/auth/callback/[provider]
// - Y todas las demás rutas de Better Auth
export default toNodeHandler(auth);