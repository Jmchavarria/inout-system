'use client';

import { useState } from 'react';
import {
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  User2,
  ChartLine,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  const menuItems = [
    {
      href: '/income',
      label: 'Income and expenses',
      icon: <CircleDollarSign size={20} />,
    },
    { href: '/users', label: 'Users', icon: <User2 size={20} /> },
    { href: '/reports', label: 'Reports', icon: <ChartLine size={20} /> },
  ];

  // Función de logout optimizada
  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevenir múltiples clicks
    
    setIsLoggingOut(true);

    // Redirigir inmediatamente (navegación optimista)
    router.push('/auth/login');

    // Ejecutar logout en segundo plano
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Si falla, podrías revertir la navegación o mostrar error
      // pero el usuario ya está en la página de login
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className='flex h-screen'>
      {/* Botón móvil */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className='md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-200'
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-full bg-white border-r border-gray-200 p-4 transition-all duration-300 ease-in-out z-40 overflow-hidden
        ${isMobileOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0'}
        ${isOpen ? 'md:w-64' : 'md:w-20'}`}
      >
        {/* Header con logo */}
        <div className='flex items-center justify-between mt-10 mb-12 h-20'>
          <div
            className='flex-1 flex justify-center items-center overflow-hidden cursor-pointer'
            onClick={() => router.push('/')}
          >
            {isOpen ? (
              <Image
                width={200}
                height={200}
                alt='logo'
                src='/images/logo.webp'
                className='object-contain max-h-24 w-auto'
                priority
              />
            ) : null}
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className='hidden md:flex items-center justify-center p-1 rounded-md bg-gray-100 hover:bg-gray-200 flex-shrink-0 w-7 h-7 ml-2'
          >
            {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        {/* Navegación */}
        <nav className='space-y-2'>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className='flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 min-w-0'
            >
              <div
                className={`flex items-center w-full min-w-0 ${isOpen ? 'gap-3' : 'gap-0'}`}
                title={!isOpen ? item.label : undefined}
              >
                <div className='flex-shrink-0'>{item.icon}</div>
                <span
                  className={`transition-[opacity,max-width,margin] duration-300 overflow-hidden whitespace-nowrap min-w-0
                  ${isOpen ? 'opacity-100 max-w-[220px] ml-3' : 'opacity-0 max-w-0 ml-0 pointer-events-none'}`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className='absolute bottom-6 left-4 right-4'>
          <button
            className='flex items-center px-3 py-2 rounded-lg text-gray-600 hover:text-red-500 hover:bg-gray-100 w-full min-w-0 disabled:opacity-50 disabled:cursor-not-allowed'
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <div
              className={`flex items-center w-full min-w-0 ${isOpen ? 'gap-3' : 'gap-0'}`}
            >
              <div className='flex-shrink-0'>
                <LogOut size={18} />
              </div>
              <span
                className={`transition-[opacity,max-width,margin] duration-300 overflow-hidden whitespace-nowrap min-w-0
                ${isOpen ? 'opacity-100 max-w-[200px] ml-3' : 'opacity-0 max-w-0 ml-0 pointer-events-none'}`}
              >
                {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
              </span>
            </div>
          </button>
        </div>
      </aside>
    </div>
  );
}