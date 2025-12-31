'use client';

import { useEffect, useState } from 'react';
import {
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
    <div className='p-6'>
      <div className='max-w-7xl mx-auto'>
        <div className='grid sm:grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
          {features.map((f) => {
            const isRestricted = f.restricted && role === 'user';

            return (
              <div
                key={f.title}
                className='relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer group'
              >
                {isRestricted ? (
                  <>
                    {/* Imagen */}
                    <div className='relative h-48 w-full overflow-hidden'>
                      <Image
                        alt={f.alt}
                        width={400}
                        height={300}
                        src={f.image}
                        className='object-cover w-full h-full'
                        quality={90}
                      />
                    </div>

                    {/* Contenido */}
                    <div className='p-6'>
                      <div className='flex items-center gap-3 mb-3'>
                        {getIcon(f.iconType)}
                        <h3 className='text-lg font-semibold text-gray-900'>{f.title}</h3>
                      </div>
                      <p className='text-sm text-gray-600 leading-relaxed'>{f.desc}</p>
                    </div>

                    {/* Overlay de restricción */}
                    <div className='absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center text-gray-600'>
                      <Lock className='w-12 h-12 mb-2' />
                      <p className='font-medium'>Restricted for your role</p>
                    </div>
                  </>
                ) : (
                  <Link href={f.route} className='block h-full'>
                    {/* Imagen */}
                    <div className='relative h-48 w-full overflow-hidden'>
                      <Image
                        alt={f.alt}
                        width={400}
                        height={300}
                        src={f.image}
                        className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-110'
                        quality={90}
                      />
                    </div>

                    {/* Contenido */}
                    <div className='p-6'>
                      <div className='flex items-center gap-3 mb-3'>
                        {getIcon(f.iconType)}
                        <h3 className='text-lg font-semibold text-gray-900'>{f.title}</h3>
                      </div>
                      <p className='text-sm text-gray-600 leading-relaxed'>{f.desc}</p>
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;