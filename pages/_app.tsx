// pages/_app.tsx
import type { AppProps } from 'next/app';
import type { NextPage } from 'next';
import Link from 'next/link';
import { ReactElement, ReactNode } from 'react';
import { Sidebar } from '@/components/ui';
import { AuthProvider, useAuth } from '../context/auth-context';
import { TransactionsProvider } from '@/context/transaction-context';
import '@/styles/globals.css';
import { Avatar } from '@/features/profile/components/profileAvatar';

type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

const AppLayout = ({ page }: { page: ReactElement }) => {
  const { user } = useAuth();
  
  return (
    <div className='flex h-screen'>
      <Sidebar />

      <main className='flex-1 bg-gray-50 overflow-y-auto'>
        <div>
          <div className='flex items-center justify-end py-3 px-2 sticky top-0 bg-gray-50 z-10  border-gray-200'>
            <Link href={'/profile'}>
              <Avatar
                initials={user?.name?.slice(0, 2).toUpperCase() || 'U'}
                height={40}
                width={40}
                user={user}
              />
            </Link>
          </div>
          {page}
        </div>
      </main>
    </div>
  );
};

const MyApp = ({ Component, pageProps }: AppPropsWithLayout) => {
  const getLayout = Component.getLayout ?? ((page) => <AppLayout page={page} />);

  return (
    <AuthProvider>
      <TransactionsProvider>
        {getLayout(<Component {...pageProps} />)}
      </TransactionsProvider>
    </AuthProvider>
  );
};

export default MyApp;