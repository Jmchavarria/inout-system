// pages/welcome.tsx
import { FormEvent, ReactElement, useState } from 'react';
import { Phone, Shield, Heart, CheckCircle } from 'lucide-react';
import { useStore } from '@nanostores/react';
import { useSession } from '@/lib/auth-client';

export default function Welcome() {
  const { data, isPending } = useStore(useSession); // <-- sesión (nanostores)
  const userId = data?.user?.id ?? null;

  const [tel, setTel] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch('/api/me/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tel, userId }), // enviamos userId (opcional)
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        alert(
          `No se pudo guardar el teléfono: ${body?.error || res.statusText}`
        );
        return;
      }

      window.location.href = '/';
    } catch (err) {
      console.error('[/api/me/phone] network error:', err);
      alert('Error de red. Revisa la consola.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return <div className='p-6'>Cargando…</div>;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6'>
      <div className='max-w-md w-full'>
        <div className='text-center mb-8'>
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Phone className='w-8 h-8 text-blue-600' />
          </div>
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>
            Welcome to InOut! 👋
          </h1>
          <p className='text-gray-600'>We're excited to have you on board</p>
        </div>

        <div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-100'>
          <div className='text-center mb-6'>
            <Heart className='w-6 h-6 text-red-500 mx-auto mb-3' />
            <h2 className='text-xl font-semibold text-gray-800 mb-3'>
              Your security matters to us
            </h2>
            <p className='text-gray-600 text-sm leading-relaxed'>
              We care about keeping your account safe. Adding your phone number
              helps us protect your financial data and reach you if we notice
              anything unusual with your account.
            </p>
          </div>

          <div className='space-y-3 mb-6'>
            <div className='flex items-center gap-3 text-sm'>
              <Shield className='w-4 h-4 text-green-500 flex-shrink-0' />
              <span className='text-gray-700'>Account recovery protection</span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
              <span className='text-gray-700'>
                Important security notifications
              </span>
            </div>
            <div className='flex items-center gap-3 text-sm'>
              <Heart className='w-4 h-4 text-red-500 flex-shrink-0' />
              <span className='text-gray-700'>
                We'll never spam you - promise!
              </span>
            </div>
          </div>

          <form onSubmit={onSubmit} className='space-y-4'>
            <div>
              <label
                htmlFor='phone'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Phone Number
              </label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5' />
                <input
                  id='phone'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                  placeholder='+57 300 123 4567'
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type='submit'
              disabled={isLoading}
              className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
            >
              {isLoading ? (
                <div className='flex items-center justify-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Saving...
                </div>
              ) : (
                'Continue to Dashboard'
              )}
            </button>
          </form>

          <div className='mt-6 pt-4 border-t border-gray-100'>
            <p className='text-xs text-gray-500 text-center'>
              🔒 Your information is encrypted and secure. We respect your
              privacy.
            </p>
          </div>
        </div>

        <div className='text-center mt-6'>
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

Welcome.getLayout = function getLayout(page: ReactElement) {
  return page; // sin sidebar
};
