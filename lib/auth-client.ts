// lib/auth-client.ts
'use client';

import { createAuthClient } from 'better-auth/react';

// Si tu API de auth vive en este mismo Next.js, NO necesitas baseURL.
// Better Auth usará /api/auth/... en relativo automáticamente.
export const authClient = createAuthClient();

export const { signIn, signOut, useSession } = authClient;

// (opcional) export default por si quieres importar el cliente entero
export default authClient;
