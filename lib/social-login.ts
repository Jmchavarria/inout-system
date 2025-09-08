import { signIn } from '@/lib/auth-client';

export const signInWithGitHub = async () => {
  const data = await signIn.social({
    provider: 'github', // 👈 Aquí defines el proveedor
    callbackURL: '/', // dónde quieres que vuelva después del login
    errorCallbackURL: '/error',
    newUserCallbackURL: '/welcome',
  });
  return data;
};
