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

  const features = [
    {
      title: 'Income & Expense Management System',
      desc: 'Record, classify, and reconcile your transactions in seconds. Get a clear view of your cash flow to maintain precise control of all your company’s financial operations.',
      icon: <CircleDollarSign className='w-7 h-7 text-emerald-600' aria-hidden />,
      route: '/income',
      restricted: false, // acceso para todos
      art: (
        <Image
          alt='Financial management system'
          width={400}
          height={240}
          src={'/images/features/incomeAndExpenses.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
    },
    {
      title: 'User Management',
      desc: 'Roles, permissions, and activity logs. Fine-grained control for your team with simple auditing. Manage user access at different permission levels and keep detailed records of all activities.',
      icon: <Users2 className='w-7 h-7 text-blue-600' aria-hidden />,
      route: '/users',
      restricted: true, // solo admin
      art: (
        <Image
          alt='User and permission management'
          width={400}
          height={240}
          src={'/images/features/users.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
    },
    {
      title: 'Reports',
      desc: 'Dashboards and exportable files. Key metrics ready to support decision-making. Visualize important data with interactive charts and export detailed reports in multiple formats.',
      icon: <BarChart3 className='w-7 h-7 text-purple-600' aria-hidden />,
      route: '/reports',
      restricted: true, // solo admin
      art: (
        <Image
          alt='Reports and analytics'
          width={400}
          height={240}
          src={'/images/features/reports.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
    },
  ];

  return (
    <div className='bg-gray-50'>
      <div className='flex items-center justify-center border-black'>
        <div className='max-w-7xl w-full'>
         

          <div className='grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
            {features.map((f) => {
              const isRestricted = f.restricted && role === 'user';
              return (
                <div
                  key={f.title}
                  className={`relative group rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 min-h-[420px] flex flex-col ${
                    !isRestricted && 'hover:shadow-xl hover:border-gray-300'
                  }`}
                >
                  {/* Overlay de restricción */}
                  {isRestricted && (
                    <div className="absolute inset-0 bg-white/80 z-10 rounded-2xl flex flex-col items-center justify-center text-gray-600">
                      <Lock className="w-12 h-12 mb-2" />
                      <p className="font-medium">Restricted for your role</p>
                    </div>
                  )}

                  {/* Header */}
                  <div className='flex items-center gap-4 mb-6'>
                    <div className='rounded-xl bg-gray-100 p-3 flex-shrink-0 group-hover:bg-gray-200 transition-colors duration-300'>
                      {f.icon}
                    </div>
                    <h3 className='text-xl font-semibold text-gray-900 leading-tight'>
                      {f.title}
                    </h3>
                  </div>

                  {/* Image with overlay */}
                  <div className='relative mb-6 rounded-xl overflow-hidden shadow-sm cursor-pointer'>
                    {f.art}
                    {!isRestricted && (
                      <div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                        <Link href={f.route} passHref>
                          <button
                            className='bg-white text-gray-900 px-6 py-3 rounded-lg shadow-lg inline-flex items-center gap-2 text-base font-medium hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300'
                            aria-label={`Access ${f.title}`}
                          >
                            Access
                            <ArrowRight className='w-5 h-5' />
                          </button>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className='text-gray-600 leading-relaxed flex-grow text-base'>
                    {f.desc}
                  </p>
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
