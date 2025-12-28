import { AuthUser } from '@/context/auth-context';
import { Mail, Phone } from 'lucide-react';
import Image from 'next/image';

interface ProfileAvatarProps {
    user: AuthUser;
    initials: string;
}

export function ProfileAvatar({ user, initials }: ProfileAvatarProps): JSX.Element {

    return (
        <div className='flex items-center space-x-4'>
            <div className='relative h-32 w-32 shrink-0 rounded-full bg-gray-100  ring-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600 overflow-hidden'>
                {user?.image ? (
                    <Image
                        width={160}
                        height={160}
                        src={user.image}
                        alt='avatar'
                        className='h-full w-full object-cover'
                    />
                ) : (
                    initials
                )}
            </div>

            <div className='flex flex-col gap-1'>
                <h2 className='text-2xl font-semibold   text-gray-900'>{user?.name ?? 'Sin nombre'}</h2>

                <div className='flex gap-2 '>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Mail size={14} />
                        <span className="leading-none">
                            {user?.email}
                        </span>
                    </div>

                    <div className='items-center flex gap-1 justify-center text-gray-500'>

                        <Phone size={14} />

                        <span>{user?.tel || 'Sin teléfono'}</span>
                    </div>
                </div>
                <span className={` items-center rounded-full  text-xs font-medium`}>
                    {user?.role ?? 'user'}
                </span> 
            </div>
        </div>
    );
}