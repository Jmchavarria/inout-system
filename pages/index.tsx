'use client';

import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Users2,
  CircleDollarSign,
  Lock
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Feature {
  title: string;
  desc: string;
  iconType: 'dollar' | 'users' | 'chart';
  route: string;
  restricted: boolean;
  image: string;
  alt: string;
}

const Home = () => {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch('/api/me');
        const data = await res.json();
        setRole(data.role);
      } catch (err) {
        console.error('Error fetching role:', err);
      }
    };

    fetchRole();
  }, []);

  const features: Feature[] = [
    {
      title: 'Income & Expense Management System',
      desc: 'Record, classify, and reconcile your transactions in seconds. Get a clear view of your cash flow to maintain precise control of all your companys financial operations.',
      iconType: 'dollar',
      route: '/income',
      restricted: false,
      image: '/images/features/incomeAndExpenses.webp',
      alt: 'Financial management system',
    },
    {
      title: 'User Management',
      desc: 'Roles, permissions, and activity logs. Fine-grained control for your team with simple auditing. Manage user access at different permission levels and keep detailed records of all activities.',
      iconType: 'users',
      route: '/users',
      restricted: true,
      image: '/images/features/users.png',
      alt: 'User and permission management',
    },
    {
      title: 'Reports',
      desc: 'Dashboards and exportable files. Key metrics ready to support decision-making. Visualize important data with interactive charts and export detailed reports in multiple formats.',
      iconType: 'chart',
      route: '/reports',
      restricted: true,
      image: '/images/features/reports.jpeg',
      alt: 'Reports and analytics',
    },
  ];

  const getIcon = (iconType: Feature['iconType']) => {
    switch (iconType) {
      case 'dollar':
        return <CircleDollarSign className='w-7 h-7 text-emerald-600' aria-hidden='true' />;
      case 'users':
        return <Users2 className='w-7 h-7 text-blue-600' aria-hidden='true' />;
      case 'chart':
        return <BarChart3 className='w-7 h-7 text-purple-600' aria-hidden='true' />;
    }
  };

  return (
    <div>
      <div className='border-black'>
        <div className='w-full'>
          <div className='grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
            {features.map((f) => {
              const isRestricted = f.restricted && role === 'user';
              return (
                <div
                  key={f.title}
                  className='group h-screen bg-white relative overflow-hidden cursor-pointer'
                >
                  {/* Contenedor de imagen con efecto hover */}
                  <div className='absolute inset-0'>
                    {/* Imagen con scale en hover */}
                    <Image
                      alt={f.alt}
                      src={f.image}
                      fill
                      sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                      className='object-cover transition-transform duration-700 ease-out group-hover:scale-110'
                      priority
                      quality={90}
                    />
                    
                    {/* Overlay oscuro que aparece en hover */}
                    <div className='absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-500 ease-out' />
                  </div>

                  {/* Overlay de restricción */}
                  {isRestricted && (
                    <div className='absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-gray-600'>
                      <Lock className='w-12 h-12 mb-2' />
                      <p className='font-medium'>Restricted for your role</p>
                    </div>
                  )}

                  {/* Contenido que aparece en hover */}
                  {!isRestricted && (
                    <div className='absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out z-10'>
                      <h3 className='text-white text-2xl font-bold mb-4 px-4 text-center drop-shadow-lg'>
                        {f.title}
                      </h3>
                      <Link href={f.route}>
                        <button className='bg-white text-gray-900 px-6 py-3 rounded-lg shadow-lg inline-flex items-center gap-2 text-base font-medium hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 ease-out'>
                          Access
                          <ArrowRight className='w-5 h-5' />
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;