// /pages/auth/login.tsx
import React, { ReactElement, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import Image from 'next/image';
const tips = [
  'Track every expense, no matter how small. The details build your real balance.',
  'Save at least 10% of your income before spending anything else.',
  'A monthly budget is your best tool to avoid financial surprises.',
  'Classify your expenses into needs, wants, and goals. This shows you where to cut back.',
  'Every dollar you save is one step closer to your financial independence.',
];

function LoginPage() {
  const { signInWithGitHub } = useAuth();

  const GitHubIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox='0 0 24 24' fill='currentColor'>
      <path d='M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z' />
    </svg>
  );

  const [currentTip, setCurrentTip] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGitHubSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGitHub({
        callbackURL: '/',
        newUserCallbackURL: '/welcome',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
            ? err
            : 'Something went wrong. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className='flex flex-col min-h-screen bg-gray-50'>
      <div className='border-b bg-white flex items-center justify-center py-4 shadow-sm'>
        {/* Usa next/image con unoptimized para evitar problemas de layout */}
        <Image
          src='/images/features/users.webp'
          width={130}
          height={130}
          alt='Logo'
          className='w-32 h-32 object-contain'
          unoptimized={true}
          onError={() => console.error('Image failed to load')}
          onLoad={() => console.log('Image loaded successfully')}
        />
      </div>

      <div className='flex flex-1 bg-gray-50'>
        <div className='flex flex-col justify-center px-6 md:px-20 bg-white w-full md:w-1/2 gap-6'>
          <h1 className='text-4xl md:text-5xl font-bold text-gray-600'>
            Welcome back <br />
            to <span className='font-bold text-black'>InOut</span>
          </h1>

          <p className='text-gray-600'>
            Log in to your account to manage your <span className='font-semibold'>income</span> and{' '}
            <span className='font-semibold'>expenses</span>, track your balance, and keep control of your finances in one place.
          </p>

          <div className='flex flex-col gap-4'>
            {!!error && (
              <div className='p-4 bg-red-50 border border-red-200 rounded-xl'>
                <p className='text-red-800 text-sm'>{error}</p>
              </div>
            )}

            <button
              onClick={handleGitHubSignIn}
              disabled={loading}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] ${
                loading ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-black hover:bg-gray-800 text-white'
              }`}
            >
              {loading ? <Loader2 className='h-5 w-5 animate-spin' /> : <GitHubIcon className='h-5 w-5' />}
              {loading ? 'Signing in...' : 'Continue with GitHub'}
            </button>
          </div>

          <p className='text-sm text-gray-600'>
            By signing in, you agree to our terms of service. All new users are automatically granted admin access for testing purposes.
          </p>
        </div>

        <div className='relative hidden md:flex items-center justify-center w-1/2 bg-white'>
          <div className='absolute inset-0'>
            {/* Usa next/image con unoptimized para evitar problemas de layout */}
            <Image
              src='/images/features/users.webp'
              alt='Financial background'
              fill
              sizes='(min-width: 768px) 50vw, 100vw'
              className='object-cover rounded-l-lg'
              unoptimized={true}
              onError={() => console.error('Background image failed to load')}
              onLoad={() => console.log('Background image loaded successfully')}
            />
          </div>

          <div className='relative border shadow-2xl p-8 w-2/3 rounded-3xl text-center bg-white/90 backdrop-blur-lg'>
            <h2 className='text-xl font-bold text-gray-800 mb-4'>Financial Tip</h2>
            <p key={currentTip} className='text-gray-600 italic transition-all duration-700 ease-in-out'>
              {tips[currentTip]}
            </p>

            <div className='flex justify-center gap-1 mt-6'>
              {tips.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentTip ? 'w-6 bg-gray-800' : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

LoginPage.getLayout = function getLayout(page: ReactElement) {
  return page;
};

export default LoginPage;