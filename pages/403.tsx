// pages/403.tsx
import { ReactElement } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldAlert, Home, Lock } from 'lucide-react';

function Error403Page() {
  return (
    <div className='min-h-screen white flex items-center justify-center p-4'>
      <div className='max-w-2xl w-full text-center'>
        {/* Logo */}
        <div className='mb-8 flex justify-center'>
          <Image
            src='/images/logo.webp'
            width={120}
            height={120}
            alt='InOut Logo'
            className='opacity-75'
          />
        </div>

        {/* Error Icon */}
        <div className='mb-8 flex justify-center'>
          <div className='relative'>
            <div className='w-32 h-32 bg-red-100 rounded-full flex items-center justify-center'>
              <ShieldAlert className='w-16 h-16 text-red-500' />
            </div>
            <div className='absolute -top-2 -right-2 w-12 h-12 bg-red-500 rounded-full flex items-center justify-center'>
              <Lock className='w-6 h-6 text-white' />
            </div>
          </div>
        </div>

        {/* Error Content */}
        <div className='mb-8'>
          <h1 className='text-6xl font-bold text-gray-800 mb-4'>403</h1>
          <h2 className='text-3xl font-semibold text-gray-700 mb-4'>
            Access Forbidden
          </h2>
          <p className='text-lg text-gray-600 mb-6 leading-relaxed'>
            You don't have permission to access this financial resource. Your
            current account level may not include access to this feature or
            section of <span className='font-semibold text-black'>InOut</span>.
          </p>
        </div>

        {/* Financial Context */}
        <div className='bg-gray-50 rounded-xl shadow-lg p-6 mb-8 border border-gray-200'>
          <h3 className='text-xl font-semibold text-gray-800 mb-4'>
            Why am I seeing this?
          </h3>
          <div className='grid md:grid-cols-2 gap-4 text-left'>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-blue-600 font-semibold text-sm'>1</span>
              </div>
              <div>
                <h4 className='font-medium text-gray-800'>
                  Account Permissions
                </h4>
                <p className='text-sm text-gray-600'>
                  Your current role may not have access to advanced financial
                  analytics or administrative features.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-green-600 font-semibold text-sm'>2</span>
              </div>
              <div>
                <h4 className='font-medium text-gray-800'>
                  Subscription Level
                </h4>
                <p className='text-sm text-gray-600'>
                  Some premium features require an upgraded subscription to
                  access detailed reports.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-purple-600 font-semibold text-sm'>3</span>
              </div>
              <div>
                <h4 className='font-medium text-gray-800'>Session Expired</h4>
                <p className='text-sm text-gray-600'>
                  Your security session may have expired. Try logging out and
                  back in.
                </p>
              </div>
            </div>
            <div className='flex items-start gap-3'>
              <div className='w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                <span className='text-orange-600 font-semibold text-sm'>4</span>
              </div>
              <div>
                <h4 className='font-medium text-gray-800'>Restricted Area</h4>
                <p className='text-sm text-gray-600'>
                  This section contains sensitive financial data that requires
                  special authorization.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
          <Link
            href='/'
            className='flex items-center gap-2 px-6 py-3 bg-black hover:bg-gray-800 text-white font-medium rounded-lg transition-colors'
          >
            <Home className='w-4 h-4' />
            Return to Home
          </Link>

          <Link
            href='/auth/login'
            className='flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors'
          >
            <Lock className='w-4 h-4' />
            Sign In Again
          </Link>
        </div>

        {/* Footer */}
        <div className='mt-12 text-center'>
          <p className='text-sm text-gray-500'>
            Need help? Contact our support team or check your account
            permissions in
            <Link
              href='/profile'
              className='text-blue-600 hover:text-blue-700 font-medium ml-1'
            >
              profile settings
            </Link>
          </p>
        </div>

        {/* Decorative Elements */}
        <div className='absolute top-10 left-10 w-20 h-20 bg-red-100 rounded-full opacity-50'></div>
        <div className='absolute bottom-10 right-10 w-16 h-16 bg-blue-100 rounded-full opacity-50'></div>
        <div className='absolute top-1/2 left-5 w-12 h-12 bg-green-100 rounded-full opacity-30'></div>
      </div>
    </div>
  );
}

Error403Page.getLayout = function getLayout(page: ReactElement) {
  return page; // Sin sidebar ni layout principal
};

export default Error403Page;
