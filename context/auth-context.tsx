// /context/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authClient } from '@/lib/auth-client';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

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
  isLoading: boolean; // ✅ NUEVO: flag explícito de loading
  refresh: () => Promise<void>;
  signInWithGitHub: (opts?: SignInOptions) => Promise<void>;
  signOut: () => Promise<void>;
};

// ============================================================================
// CREACIÓN DEL CONTEXTO
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVEEDOR DEL CONTEXTO DE AUTENTICACIÓN
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // ✅ OPTIMIZACIÓN: Función fetchMe más eficiente
  const fetchMe = async () => {
    try {
      setStatus('loading');
      
      const res = await fetch('/api/me', { 
        credentials: 'include',
        // ✅ NUEVO: Cache policy para evitar fetches innecesarios
        cache: 'no-store'
      });
      
      if (!res.ok) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }
      
      const data = (await res.json()) as { 
        userId: string; 
        role: string;
        name?: string;
        email?: string;
        image?: string;
        tel?: string;
      };
      
      const userData: AuthUser = {
        id: data.userId,
        name: data.name || null,
        email: data.email || null,
        image: data.image || null,
        role: data.role as 'admin' | 'user',
        tel: data.tel || null 
      };
      
      setUser(userData);
      setStatus('authenticated');
      
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  // ✅ OPTIMIZACIÓN: Solo ejecuta una vez al montar
  useEffect(() => {
    void fetchMe();
  }, []);

  const refresh = async () => {
    await fetchMe();
  };

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

  const signOut = async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      window.location.replace('/auth/login');
    }
  };

  // ✅ OPTIMIZACIÓN: Incluye isLoading en el value
  const value = useMemo<AuthContextValue>(
    () => ({ 
      user,
      status,
      isLoading: status === 'loading', // ✅ NUEVO: flag booleano simple
      refresh,
      signInWithGitHub,
      signOut
    }),
    [user, status]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK PERSONALIZADO PARA USAR EL CONTEXTO
// ============================================================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider />');
  
  return ctx;
}