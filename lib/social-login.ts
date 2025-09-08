// lib/social-login.ts
'use client';

import { signIn } from '@/lib/auth-client';

type Opts = {
  callbackURL?: string;
  newUserCallbackURL?: string;
};

export async function signInWithGitHub(opts: Opts = {}) {
  // Better Auth redirige automáticamente al proveedor
  const data = await signIn.social({
    provider: 'github',
    callbackURL: '/',
    newUserCallbackURL: '/welcome',
    ...opts,
  });

  // Si algo rarísimo pasa y no redirige, validamos el error:
  if (data && 'error' in data && data.error) {
    throw new Error((data as any).error?.message ?? 'Login failed');
  }

  return data;
}   
