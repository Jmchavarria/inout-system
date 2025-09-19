'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useAuth } from '../context/auth-context';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
} from '@/components/ui';
import {
  Copy,
  Check,
  Mail,
  ShieldCheck,
  Phone,
  Loader2,
  User2,
} from 'lucide-react';
import Image from 'next/image';

type Role = 'admin' | 'user';

interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  tel?: string;
  role?: Role;
}

interface AuthContext {
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  signOut: (opts?: Record<string, unknown>) => Promise<void>;
}

interface ApiMeResponse {
  userId: string;
  role: Role;
  name?: string;
  email?: string;
  image?: string;
}

interface ApiPhoneResponse {
  tel?: string;
}

interface PhoneUpdateRequest {
  tel: string;
  userId: string;
}

// Cache simple en memoria para evitar consultas repetidas
const userDataCache = new Map<string, {
  data: ApiMeResponse;
  timestamp: number;
}>();

const phoneDataCache = new Map<string, {
  data: ApiPhoneResponse;
  timestamp: number;
}>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Componente de loading
function ProfileLoading(): JSX.Element {
  return (
    <div className=' flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-4xl'>
        <Card className='shadow-lg'>
          <CardHeader className='pb-6 flex justify-center items-center'>
            {/* <CardTitle className='text-center text-2xl'>My profile</CardTitle> */}
            <h1 className='w-28 h-8 bg-gray-300 animate-pulse rounded' />
          </CardHeader>

          <CardContent className='space-y-8'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              <div className='flex flex-col items-center space-y-4'>
                <div className='relative h-24 w-24 shrink-0 rounded-full  bg-gray-100 ring-2 ring-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600 overflow-hidden animate-pulse'>

                  {/* Avatar */}
                  <div className="flex items-center justify-center w-full h-full bg-gray-300 rounded-sm sm:w-96 dark:bg-gray-700">
                    <svg className="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
                      <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                    </svg>
                  </div>
                </div>

                <div className='text-center space-y-2'>
                  <h2 className="h-6 w-40 bg-gray-300 rounded animate-pulse" />

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm `}
                  >
                    <div className='h-4 w-4 bg-gray-300 animate-pulse rounded' />
                    <span className="h-4 w-10 bg-gray-300 rounded animate-pulse" />
                  </span>
                </div>
              </div>


              {/* Información de contacto */}
              <div className='space-y-6'>
                <div className='space-y-4'>
                  {/* Titulo: Contact Information  */}
                  <h3 className='text-lg font-semibold bg-gray-300 rounded w-44 h-8 animate-pulse'>
                  </h3>

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <span className='h-6 w-4 bg-gray-300 rounded animate-pulse' />
                      <span className='w-10 h-6 bg-gray-300 animate-pulse rounded'></span>
                    </div>

                    <div className='flex items-center gap-2'>
                      {/* email */}
                      <span className='text-sm w-48 h-4 bg-gray-300 rounded animate-pulse' />
                      {/* Botón de copy */}
                      <button className='w-14 h-8 bg-gray-300 animate-pulse rounded' />

                    </div>
                  </div>


                  {/* Cuenta */}
                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-gray-600'>
                      <span className='h-6 w-4 bg-gray-300 rounded animate-pulse' />

                      <span className=' bg-gray-300 w-12 h-6 animate-pulse rounded' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='relative'>

                        {/* input para cambiar el numero de telefono */}
                        <div className='h-8 w-48 bg-gray-300 animate-pulse rounded' />

                      </div>

                      <button className='w-12 h-8  bg-gray-300 animate-pulse rounded'></button>

                    </div>

                  </div>
                </div>
              </div>


              <div className='space-y-6 ml-10'>
                <div className='space-y-4'>
                  <h3 className='h-6 w-16  bg-gray-300 rounded animate-pulse' />

                  <div className='space-y-2'>
                    <div className='flex items-center gap-2 '>
                      <span className='h-4 w-4 bg-gray-300 rounded animate-pulse' />
                      <span className=' bg-gray-300 rounded w-14 h-6 animate-pulse' />
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='bg-gray-300 h-4 w-44 animate-pulse rounded'>
                      </span>
                      <button className='w-14 h-8 bg-gray-300 animate-pulse rounded'>

                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

{/* For devs */}
            <div className='mt-8'>
              <div className='w-20 h-6 bg-gray-300 rounded animate-pulse'>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function NoUserProfile(): JSX.Element {
  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-4xl'>
        <Card>
          <CardHeader>
            <CardTitle>My profile</CardTitle>
          </CardHeader>
          <CardContent>Sin sesión</CardContent>
        </Card>
      </div>
    </div>
  );
}

interface ProfileAvatarProps {
  user: User;
  initials: string;
  resolvedRole: Role | null;
  loadingRole: boolean;
}

function ProfileAvatar({
  user,
  initials,
  resolvedRole,
  loadingRole,
}: ProfileAvatarProps): JSX.Element {
  const roleBadgeClass =
    resolvedRole === 'admin'
      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
      : 'bg-blue-50 text-blue-700 ring-1 ring-blue-200';

  return (
    <div className='flex flex-col items-center space-y-4'>
      <div className='relative h-24 w-24 shrink-0 rounded-full bg-gray-100 ring-2 ring-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-600 overflow-hidden'>
        {user.image ? (
          <Image
            width={150}
            height={150}
            src={user.image}
            alt='avatar'
            className='h-full w-full object-cover'
          />
        ) : (
          initials
        )}
      </div>

      <div className='text-center space-y-2'>
        <h2 className='text-2xl font-semibold'>{user.name ?? 'Sin nombre'}</h2>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${roleBadgeClass}`}
        >
          <ShieldCheck className='h-4 w-4' />
          {loadingRole ? '…' : (resolvedRole ?? '—')}
        </span>
      </div>
    </div>
  );
}

interface ContactInfoProps {
  user: User;
  tel: string;
  setTel: (tel: string) => void;
  loadingPhone: boolean;
  saving: boolean;
  msg: string | null;
  err: string | null;
  copied: 'id' | 'email' | null;
  onCopy: (what: 'id' | 'email') => void;
  onSavePhone: () => void;
}

function ContactInfo({
  user,
  tel,
  setTel,
  loadingPhone,
  saving,
  msg,
  err,
  copied,
  onCopy,
  onSavePhone,
}: ContactInfoProps): JSX.Element {
  return (
    <div className='space-y-6'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Contact information
        </h3>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-gray-600'>
            <Mail className='h-4 w-4' />
            <span className='text-sm font-medium'>Email</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm'>{user.email ?? '—'}</span>
            <Button variant='outline' size='sm' onClick={() => onCopy('email')}>
              {copied === 'email' ? (
                <>
                  <Check className='h-3 w-3' /> Copied
                </>
              ) : (
                <>
                  <Copy className='h-3 w-3' /> Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-gray-600'>
            <Phone className='h-4 w-4' />
            <span className='text-sm font-medium'>Phone</span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative flex-1'>
              <Input
                placeholder='+57 300 123 4567'
                value={tel}
                onChange={(e) => setTel(e.target.value)}
                className='text-sm'
                disabled={loadingPhone}
              />
            </div>
            <Button
              size='sm'
              onClick={onSavePhone}
              disabled={saving || loadingPhone || !tel.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className='h-3 w-3 animate-spin' /> Saving
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
          {msg && (
            <div className='text-sm text-green-600 flex items-center gap-1'>
              <Check className='h-3 w-3' /> {msg}
            </div>
          )}
          {err && <div className='text-sm text-red-600'>{err}</div>}
        </div>
      </div>
    </div>
  );
}

interface AccountInfoProps {
  user: User;
  copied: 'id' | 'email' | null;
  onCopy: (what: 'id' | 'email') => void;
}

function AccountInfo({ user, copied, onCopy }: AccountInfoProps): JSX.Element {
  return (
    <div className='space-y-6 ml-10'>
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold text-gray-900'>Account</h3>

        <div className='space-y-2'>
          <div className='flex items-center gap-2 text-gray-600'>
            <User2 className='h-4 w-4' />
            <span className='text-sm font-medium'>user ID</span>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-xs text-gray-500 font-mono truncate'>
              {user.id}
            </span>
            <Button variant='outline' size='sm' onClick={() => onCopy('id')}>
              {copied === 'id' ? (
                <>
                  <Check className='h-3 w-3' /> Copied
                </>
              ) : (
                <>
                  <Copy className='h-3 w-3' /> Copy
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook optimizado para obtener el rol con caché
function useUserRole(user: User | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [userInfo, setUserInfo] = useState<Partial<User> | null>(null);
  const [loadingRole, setLoadingRole] = useState(false); // ✅ Cambio: inicia en false
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoadingRole(false);
      setRole(null);
      setUserInfo(null);
      return;
    }

    // ✅ Si ya tenemos el rol del contexto y no hemos hecho fetch, usarlo inmediatamente
    if (user.role && !fetchedRef.current) {
      setRole(user.role as Role);
      return;
    }

    // ✅ Evitar fetch repetido para el mismo usuario
    if (fetchedRef.current === user.id) {
      return;
    }

    // ✅ Verificar caché primero
    const cached = userDataCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setRole(cached.data.role);
      setUserInfo({
        name: cached.data.name,
        email: cached.data.email,
        image: cached.data.image,
      });
      fetchedRef.current = user.id;
      return;
    }

    let cancelled = false;

    const loadUserData = async () => {
      try {
        setLoadingRole(true);

        const response = await fetch('/api/me');

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as ApiMeResponse;

        if (cancelled) return;

        // ✅ Guardar en caché
        userDataCache.set(user.id, {
          data,
          timestamp: Date.now()
        });

        setRole(data.role);
        setUserInfo({
          name: data.name,
          email: data.email,
          image: data.image,
        });
        fetchedRef.current = user.id;

      } catch (error) {
        if (cancelled) return;

        console.warn('Error loading user data from API:', error);

        // Fallback al contexto de auth si está disponible
        if (user?.role === 'admin' || user?.role === 'user') {
          setRole(user.role as Role);
        }
      } finally {
        if (!cancelled) {
          setLoadingRole(false);
        }
      }
    };

    loadUserData();

    return () => {
      cancelled = true;
    };
  }, [user?.id]); // ✅ Solo depende del ID del usuario

  // Resolver el rol final con fallback
  const resolvedRole: Role | null =
    role ??
    (user?.role === 'admin' || user?.role === 'user' ? user.role : null);

  // Combinar información del usuario con los datos del API
  const enrichedUser: User | null = user ? {
    ...user,
    name: userInfo?.name ?? user.name,
    email: userInfo?.email ?? user.email,
    image: userInfo?.image ?? user.image,
    role: resolvedRole ?? user.role,
  } : null;

  return {
    resolvedRole,
    loadingRole,
    enrichedUser
  };
}

// Hook optimizado para manejar el teléfono con caché
function useUserPhone(user: User | null) {
  const [tel, setTel] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(false); // ✅ Cambio: inicia en false
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoadingPhone(false);
      setTel('');
      return;
    }

    // ✅ Si ya tenemos el teléfono del contexto, usarlo inmediatamente
    if (user.tel && !fetchedRef.current) {
      setTel(String(user.tel));
      return;
    }

    // ✅ Evitar fetch repetido para el mismo usuario
    if (fetchedRef.current === user.id) {
      return;
    }

    // ✅ Verificar caché primero
    const cached = phoneDataCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTel(String(cached.data?.tel ?? ''));
      fetchedRef.current = user.id;
      return;
    }

    let cancelled = false;

    const loadPhone = async () => {
      try {
        setLoadingPhone(true);

        const response = await fetch('/api/me/phone', {
          method: 'GET',
        });

        if (cancelled) return;

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = (await response.json()) as ApiPhoneResponse;

        if (cancelled) return;

        // ✅ Guardar en caché
        phoneDataCache.set(user.id, {
          data,
          timestamp: Date.now()
        });

        setTel(String(data?.tel ?? ''));
        fetchedRef.current = user.id;

      } catch (error) {
        if (cancelled) return;

        console.warn('Error loading phone:', error);
        // Fallback al contexto si está disponible
        setTel(String(user?.tel ?? ''));
      } finally {
        if (!cancelled) {
          setLoadingPhone(false);
        }
      }
    };

    loadPhone();

    return () => {
      cancelled = true;
    };
  }, [user?.id]); // ✅ Solo depende del ID del usuario

  const savePhone = async (): Promise<void> => {
    if (!user?.id) return;

    try {
      setSaving(true);
      setErr(null);
      setMsg(null);

      const requestBody: PhoneUpdateRequest = {
        tel,
        userId: user.id,
      };

      const response = await fetch('/api/me/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errorData?.error || `HTTP ${response.status}`);
      }

      setMsg('Teléfono actualizado');

      // ✅ Invalidar caché después de actualizar
      phoneDataCache.delete(user.id);

    } catch (error: unknown) {
      const err = error as { message?: string };
      setErr(err?.message ?? 'No se pudo actualizar el teléfono');
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2000);
    }
  };

  return {
    tel,
    setTel,
    loadingPhone,
    saving,
    msg,
    err,
    savePhone,
  };
}

function useCopyToClipboard() {
  const [copied, setCopied] = useState<'id' | 'email' | null>(null);

  const copy = async (what: 'id' | 'email', user: User): Promise<void> => {
    try {
      const text = what === 'id' ? String(user.id) : String(user.email ?? '');
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1200);
    } catch (error) {
      console.warn('Copy operation failed:', error);
    }
  };

  return { copied, copy };
}

export default function Profile(): JSX.Element {
  const { user, status } = useAuth() as AuthContext;

  const { resolvedRole, loadingRole, enrichedUser } = useUserRole(user);
  const { tel, setTel, loadingPhone, saving, msg, err, savePhone } = useUserPhone(user);
  const { copied, copy } = useCopyToClipboard();

  const displayUser = enrichedUser ?? user;

  const initials = useMemo(() => {
    if (!displayUser) return 'U';

    const name = String(displayUser.name ?? displayUser.email ?? displayUser.id ?? '');
    const parts = name.trim().split(/\s+/);

    if (!parts.length) return 'U';

    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';

    return (first + second).toUpperCase();
  }, [displayUser]);

  const handleCopy = (what: 'id' | 'email'): void => {
    if (displayUser) {
      void copy(what, displayUser);
    }
  };

  const handleSavePhone = (): void => {
    void savePhone();
  };





  if (status === 'loading') {
    return <ProfileLoading />;
  }

  if (!displayUser) {
    return <NoUserProfile />;

  }


  // if (true) {
  //   return <ProfileLoading />;
  // }

  return (
    <div className=' flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-4xl'>
        <Card className='shadow-lg'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-center text-2xl'>My profile</CardTitle>
          </CardHeader>

          <CardContent className='space-y-8'>
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              <ProfileAvatar
                user={displayUser}
                initials={initials}
                resolvedRole={resolvedRole}
                loadingRole={loadingRole}
              />

              <ContactInfo
                user={displayUser}
                tel={tel}
                setTel={setTel}
                loadingPhone={loadingPhone}
                saving={saving}
                msg={msg}
                err={err}
                copied={copied}
                onCopy={handleCopy}
                onSavePhone={handleSavePhone}
              />

              <AccountInfo user={displayUser} copied={copied} onCopy={handleCopy} />
            </div>

            <details className='mt-8'>
              <summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-900'>
                For devs
              </summary>
              <pre className='mt-3 max-h-72 overflow-auto rounded bg-gray-50 p-3 text-xs'>
                {JSON.stringify({
                  originalUser: user,
                  enrichedUser: displayUser,
                  resolvedRole,
                  loadingRole,
                  cacheSize: {
                    userData: userDataCache.size,
                    phoneData: phoneDataCache.size
                  }
                }, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}