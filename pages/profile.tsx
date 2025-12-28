'use client';
import { useMemo } from 'react';
import { AuthUser, useAuth } from '../context/auth-context';
import { ProfileAvatar, Statistics } from '@/features/profile/components';

interface AuthContext {
    user: AuthUser | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    signOut: (opts?: Record<string, unknown>) => Promise<void>;
}

function NoUserProfile(): JSX.Element {
    return (
        <div className='min-h-screen flex items-center justify-center px-4'>
            <div className='w-full max-w-4xl'>
                Sin sesión. Por favor, inicia sesión para ver tu perfil.
            </div>
        </div>
    );
}

export default function Profile(): JSX.Element {
    
    const { user, status } = useAuth() as AuthContext;

    const initials = useMemo(() => {
        if (!user) return 'U';

        const name = String(user.name ?? user.email ?? user.id ?? '');
        const parts = name.trim().split(/\s+/);

        if (!parts.length) return 'U';

        const first = parts[0]?.[0] ?? '';
        const second = parts[1]?.[0] ?? '';

        return (first + second).toUpperCase();
    }, [user]);

    if (status === 'loading') {
        return (
            <div className='min-h-screen flex items-center justify-center'>
                <div className='text-lg text-gray-600'>Cargando perfil...</div>
            </div>
        );
    }

    if (!user) {
        return <NoUserProfile />;
    }

    // ✅ Usar user.tel directamente como fallback
    const displayUser = {
        ...user,
    };

    return (

        <div className='flex flex-col gap-5 px-8'>

            <div className='flex flex-col gap-5'>
                <h2 className='text-2xl font-medium text-gray-800'>Mi Perfil </h2>

                <ProfileAvatar user={displayUser} initials={initials} />

            </div>

            <Statistics />
        </div>
    );
} 