// pages/_app.tsx
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import Link from 'next/link';
import { ReactElement, ReactNode, useMemo } from 'react';
import { Sidebar } from '@/components/ui';
import { AuthProvider, useAuth } from '../context/auth-context';
import '@/styles/globals.css';
import Image from 'next/image';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

// ─────────────────────────────────────────────────────────────
// Tipos mínimos para evitar `any` en useAuth()
// ─────────────────────────────────────────────────────────────
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';
type AuthUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  image?: string | null;
} | null;

type UseAuthReturn = {
  user: AuthUser;
  status: AuthStatus;
};

// ─────────────────────────────────────────────────────────────
// Helpers puros -> reducen complejidad
// ─────────────────────────────────────────────────────────────
const pickDisplayBase = (user: AuthUser): string => {
  if (user?.name && user.name.trim()) return user.name;
  if (user?.email && user.email.trim()) return user.email;
  if (user?.id && String(user.id).trim()) return String(user.id);
  return 'U';
};

const initialsFromBase = (base: string): string => {
  const parts = base.trim().split(/\s+/);
  const a = parts[0]?.[0] ?? 'U';
  const b = parts.length > 1 ? (parts[1]?.[0] ?? '') : '';
  return (a + b).toUpperCase();
};

const getInitials = (user: AuthUser): string => {
  return initialsFromBase(pickDisplayBase(user));
};

type AvatarVariant = 'loading' | 'image' | 'initials' | 'anon';

const decideAvatarVariant = (status: AuthStatus, user: AuthUser): AvatarVariant => {
  return status === 'loading'
    ? 'loading'
    : user?.image
      ? 'image'
      : user
        ? 'initials'
        : 'anon';
};

const getTitle = (user: AuthUser): string => {
  return user?.name ?? user?.email ?? 'Profile';
};

const getAvatarContent = (
  variant: AvatarVariant,
  user: AuthUser,
  initials: string
): ReactNode => {
  switch (variant) {
    case 'image':
      return user?.image ? (
        <Image
          width={150}
          height={150}
          src={user.image}
          alt={user?.name ?? 'Profile'}
          className='h-full w-full object-cover'
        />
      ) : (
        'U'
      );
    case 'loading':
      return <div className='h-4 w-4 rounded-full bg-gray-300 animate-pulse' />;
    case 'initials':
      return initials;
    default:
      return 'U';
  }
};

const AvatarCircle = ({
  status,
  user,
  initials,
}: {
  status: AuthStatus;
  user: AuthUser;
  initials: string;
}) => {
  const variant = decideAvatarVariant(status, user);
  const content = getAvatarContent(variant, user, initials);
  const title = getTitle(user);

  return (
    <div
      className='h-9 w-9 rounded-full ring-1 ring-gray-200 overflow-hidden grid place-items-center text-[11px] font-semibold text-gray-600 hover:ring-gray-300 transition bg-gray-50'
      title={title}
    >
      {content}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Topbar con baja complejidad y sin `any`
// ─────────────────────────────────────────────────────────────
const Topbar = () => {
  const { user, status } = useAuth() as UseAuthReturn;
  const initials = useMemo(() => getInitials(user), [user]);

  return (
    <div className='h-12 mb-2 flex items-center justify-end px-4 flex-shrink-0'>
      <Link href='/profile' aria-label='Go to profile' className='inline-flex'>
        <AvatarCircle status={status} user={user} initials={initials} />
      </Link>
    </div>
  );
};

const AppLayout = ({ page }: { page: ReactElement }) => {
  return (
    <div className='flex h-screen overflow-hidden'>
      <Sidebar /> {/* Aparecerá en todas las páginas que usen este layout */}
      <main className='flex-1 overflow-y-auto bg-gray-50  py-2'>
        <div className='max-w-7xl '>
          {page}
        </div>
      </main>
    </div>
  );
};



const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <AppLayout page={page} />);


  return <AuthProvider>{getLayout(<Component {...pageProps} />)}</AuthProvider>;
};

export default MyApp;