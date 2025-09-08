// /context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authClient } from '@/lib/auth-client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export type AuthUser =
  | {
    id: string;
    name: string | null;
    email: string | null;
    image?: string | null;
    role?: 'admin' | 'user';
    tel?: string | null;
  }
  | null;

type SignInOptions = {
  callbackURL?: string;
  newUserCallbackURL?: string;
};

type AuthContextValue = {
  user: AuthUser;
  status: AuthStatus;
  refresh: () => Promise<void>;
  signInWithGitHub: (opts?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const fetchMe = async () => {
    try {
      setStatus('loading');
      const res = await fetch('/api/me', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      // Cambiar esta línea:
      const data = (await res.json()) as { userId: string; role: string };

      // Y crear el objeto user correctamente:
      const user: AuthUser = {
        id: data.userId,
        name: null, // Better Auth debería tener más info
        email: null,
        role: data.role as 'admin' | 'user',
      };

      setUser(user);
      setStatus('authenticated');
    } catch {
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    void fetchMe();
  }, []);

  const refresh = async () => {
    await fetchMe();
  };

  // Usar Better Auth client correctamente
  const signInWithGitHub = async (opts?: SignInOptions) => {
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: opts?.callbackURL || '/',
        newUserCallbackURL: opts?.newUserCallbackURL || '/welcome',
      });
    } catch (error) {
      console.error('GitHub sign in failed:', error);
      throw error;
    }
  };

  // Usar Better Auth client para signOut
  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      // Continuar con la limpieza local aunque falle
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      window.location.replace('/auth/login');
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, refresh, signInWithGitHub, signOut }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider />');
  return ctx;
}