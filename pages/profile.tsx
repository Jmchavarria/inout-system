'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './context/auth-context';
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
}

interface ApiPhoneResponse {
  tel?: string;
}

interface PhoneUpdateRequest {
  tel: string;
  userId: string;
}

// Componente de loading
function ProfileLoading(): JSX.Element {
  return (
    <div className='min-h-screen flex items-center justify-center px-4'>
      <div className='w-full max-w-4xl'>
        <Card>
          <CardHeader>
            <CardTitle>My profile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center gap-6'>
              <div className='h-20 w-20 rounded-full bg-gray-200 animate-pulse' />
              <div className='flex-1 space-y-3'>
                <div className='h-6 w-48 bg-gray-200 rounded animate-pulse' />
                <div className='h-4 w-64 bg-gray-200 rounded animate-pulse' />
                <div className='h-4 w-56 bg-gray-200 rounded animate-pulse' />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Componente cuando no hay usuario
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

// Componente del avatar
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

// Componente de información de contacto
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

        {/* Email */}
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

        {/* Teléfono */}
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

// Componente de información de cuenta
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

        {/* ID */}
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

// Hook personalizado para manejar el rol
function useUserRole(user: User | null) {
  const [role, setRole] = useState<Role | null>(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoadingRole(false);
      return;
    }

    const ac = new AbortController();

    const loadRole = async (): Promise<void> => {
      try {
        setLoadingRole(true);
        const r = await fetch('/api/me', { signal: ac.signal });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const j = (await r.json()) as ApiMeResponse;
        setRole(j.role);
      } catch {
        // Fallback si el contexto tuviera role
        if (user?.role === 'admin' || user?.role === 'user') {
          setRole(user.role as Role);
        } else {
          setRole(null);
        }
      } finally {
        if (!ac.signal.aborted) {
          setLoadingRole(false);
        }
      }
    };

    void loadRole();
    return () => {
      ac.abort();
    };
  }, [user?.id, user?.role]);

  const resolvedRole: Role | null =
    role ??
    (user?.role === 'admin' || user?.role === 'user' ? user.role : null);

  return { resolvedRole, loadingRole };
}

// Hook personalizado para manejar el teléfono
function useUserPhone(user: User | null) {
  const [tel, setTel] = useState('');
  const [loadingPhone, setLoadingPhone] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setLoadingPhone(false);
      return;
    }

    const ac = new AbortController();

    const loadPhone = async (): Promise<void> => {
      try {
        setLoadingPhone(true);
        const r = await fetch('/api/me/phone', {
          method: 'GET',
          signal: ac.signal,
        });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const j = (await r.json()) as ApiPhoneResponse;
        setTel(String(j?.tel ?? ''));
      } catch {
        setTel(String(user?.tel ?? ''));
      } finally {
        if (!ac.signal.aborted) {
          setLoadingPhone(false);
        }
      }
    };

    void loadPhone();
    return () => {
      ac.abort();
    };
  }, [user?.id, user?.tel]);

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

      const res = await fetch('/api/me/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j?.error || `HTTP ${res.status}`);
      }

      setMsg('Teléfono actualizado');
    } catch (e: unknown) {
      const error = e as { message?: string };
      setErr(error?.message ?? 'No se pudo actualizar el teléfono');
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

// Hook personalizado para copiar al portapapeles
function useCopyToClipboard() {
  const [copied, setCopied] = useState<'id' | 'email' | null>(null);

  const copy = async (what: 'id' | 'email', user: User): Promise<void> => {
    try {
      const text = what === 'id' ? String(user.id) : String(user.email ?? '');
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1200);
    } catch (e) {
      console.warn('Profile: operación omitida', e);
    }
  };

  return { copied, copy };
}

export default function Profile(): JSX.Element {
  const { user, status } = useAuth() as AuthContext;

  const { resolvedRole, loadingRole } = useUserRole(user);
  const { tel, setTel, loadingPhone, saving, msg, err, savePhone } =
    useUserPhone(user);
  const { copied, copy } = useCopyToClipboard();

  const initials = useMemo(() => {
    if (!user) return 'U';

    const n = String(user.name ?? user.email ?? user.id ?? '');
    const parts = n.trim().split(/\s+/);

    if (!parts.length) return 'U';

    const first = parts[0]?.[0] ?? '';
    const second = parts[1]?.[0] ?? '';

    return (first + second).toUpperCase();
  }, [user]);

  const handleCopy = (what: 'id' | 'email'): void => {
    if (user) {
      void copy(what, user);
    }
  };

  const handleSavePhone = (): void => {
    void savePhone();
  };

  if (status === 'loading') {
    return <ProfileLoading />;
  }

  if (!user) {
    return <NoUserProfile />;
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-8'>
      <div className='w-full max-w-4xl'>
        <Card className='shadow-lg'>
          <CardHeader className='pb-6'>
            <CardTitle className='text-center text-2xl'>My profile</CardTitle>
          </CardHeader>

          <CardContent className='space-y-8'>
            {/* Layout horizontal */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
              {/* Izquierda: avatar + nombre + rol */}
              <ProfileAvatar
                user={user}
                initials={initials}
                resolvedRole={resolvedRole}
                loadingRole={loadingRole}
              />

              {/* Centro: contacto */}
              <ContactInfo
                user={user}
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

              {/* Derecha: cuenta */}
              <AccountInfo user={user} copied={copied} onCopy={handleCopy} />
            </div>

            {/* Debug */}
            <details className='mt-8'>
              <summary className='cursor-pointer text-sm text-gray-600 hover:text-gray-900'>
                For devs
              </summary>
              <pre className='mt-3 max-h-72 overflow-auto rounded bg-gray-50 p-3 text-xs'>
                {JSON.stringify(user, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
