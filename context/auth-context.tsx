// /context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
      const data = (await res.json()) as { user?: AuthUser };
      setUser(data?.user ?? null);
      setStatus(data?.user ? 'authenticated' : 'unauthenticated');
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

  // ✅ Better Auth: /api/auth/sign-in/github
  const signInWithGitHub = async (opts?: SignInOptions) => {
    const url = new URL('/api/auth/signin/github', window.location.origin);
    if (opts?.callbackURL) url.searchParams.set('callbackURL', opts.callbackURL);
    if (opts?.newUserCallbackURL) url.searchParams.set('newUserCallbackURL', opts.newUserCallbackURL);
    window.location.assign(url.toString());
  };

  // ✅ Better Auth: /api/auth/sign-out
  const signOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network errors
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
