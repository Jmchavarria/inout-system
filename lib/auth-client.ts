// /lib/auth-client.ts
import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  // Con Pages Router el handler vive en /api/auth → baseURL relativo
  baseURL: '/api/auth',
});

// Helpers cómodos:
export const { useSession } = authClient;

export const signOut = async () => authClient.signOut();

export const signInWithGitHub = async (opts?: {
  callbackURL?: string;
  newUserCallbackURL?: string;
}) => {
  await authClient.signIn.social({
    provider: 'github',
    callbackURL: opts?.callbackURL,
    newUserCallbackURL: opts?.newUserCallbackURL,
  });
};
