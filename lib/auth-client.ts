import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://inout-system.vercel.app'
    : 'http://localhost:3000',
});

export const { signIn, useSession, signOut } = authClient;