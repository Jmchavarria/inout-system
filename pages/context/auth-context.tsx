// context/auth-context.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { useStore } from '@nanostores/react';
import {
  useSession,
  signIn,
  signOut as signOutClient,
} from '@/lib/auth-client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  tel?: string;
  role?: 'admin' | 'user';
}

interface Session {
  id: string;
  userId: string;
  expiresAt: Date;
  token?: string;
}

interface AuthSessionData {
  user: User;
  session: Session;
}

interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

interface SignInGitHubOptions {
  callbackURL?: string;
  disableRedirect?: boolean;
  newUserCallbackURL?: string;
}

interface SignInResponse {
  data?: AuthSessionData;
  error?: AuthError;
}

interface SignOutOptions {
  redirectTo?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  status: AuthStatus;
  error: AuthError | null;
  signInWithGitHub: (opts?: SignInGitHubOptions) => Promise<SignInResponse>;
  signOut: (opts?: SignOutOptions) => Promise<void>;
}

interface UseSessionReturn {
  data: AuthSessionData | null;
  error: AuthError | null;
  isPending: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps): JSX.Element => {
  const sessionStore = useSession as () => UseSessionReturn;
  const { data, error, isPending } = useStore(sessionStore);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user ?? null,
      session: data?.session ?? null,
      status: isPending
        ? 'loading'
        : data?.user
          ? 'authenticated'
          : 'unauthenticated',
      error: error ?? null,

      signInWithGitHub: async (
        opts?: SignInGitHubOptions
      ): Promise<SignInResponse> => {
        try {
          const response = await signIn.social({
            provider: 'github',
            ...opts,
          });
          return response as SignInResponse;
        } catch (err) {
          const error = err as AuthError;
          return {
            error: {
              message: error.message || 'Sign in failed',
              code: error.code,
              status: error.status,
            },
          };
        }
      },

      signOut: async (opts?: SignOutOptions): Promise<void> => {
        try {
          await signOutClient();
          if (opts?.redirectTo) {
            window.location.assign(opts.redirectTo);
          }
        } catch (err) {
          console.error('Sign out error:', err);
          // Even if signOut fails, we still redirect if requested
          if (opts?.redirectTo) {
            window.location.assign(opts.redirectTo);
          }
        }
      },
    }),
    [data, error, isPending]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within <AuthProvider>');
  }
  return ctx;
};
