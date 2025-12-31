'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
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

  const features: Feature[] = useMemo(() => [
    {
      title: 'Income & Expense Management System',
      desc: 'Record, classify, and reconcile your transactions in seconds. Get a clear view of your cash flow to maintain precise control of all your company\'s financial operations.',
      iconType: 'dollar',
      route: '/income',
      restricted: false,
      image: '/images/features/incomeAndExpenses.webp',
      alt: 'Financial management system',
    },
    {
      title: 'User Management',
      desc: 'Roles, permissions, and activity logs. Fine-grained control for your team with simple auditing.',
      iconType: 'users',
      route: '/users',
      restricted: true,
      image: '/images/features/users.png',
      alt: 'User and permission management',
    },
    {
      title: 'Reports',
      desc: 'Dashboards and exportable files. Key metrics ready to support decision-making.',
      iconType: 'chart',
      route: '/reports',
      restricted: true,
      image: '/images/features/reports.jpeg',
      alt: 'Reports and analytics',
    },
  ], []);

  const getIcon = useCallback((iconType: Feature['iconType']) => {
    const iconProps = { className: 'w-7 h-7', 'aria-hidden': true as const };
    
    switch (iconType) {
      case 'dollar':
<<<<<<< HEAD
<<<<<<< HEAD
        return <CircleDollarSign {...iconProps} className='w-7 h-7 text-emerald-600' />;
      case 'users':
        return <Users2 {...iconProps} className='w-7 h-7 text-blue-600' />;
      case 'chart':
        return <BarChart3 {...iconProps} className='w-7 h-7 text-purple-600' />;
=======
        return <CircleDollarSign className="w-7 h-7 text-emerald-600" />;
=======
        return <CircleDollarSign {...iconProps} className='w-7 h-7 text-emerald-600' />;
>>>>>>> 67d3771 (New changes in dev)
      case 'users':
        return <Users2 {...iconProps} className='w-7 h-7 text-blue-600' />;
      case 'chart':
<<<<<<< HEAD
        return <BarChart3 className="w-7 h-7 text-purple-600" />;
>>>>>>> c7b1863 (Nuevos cambios en el home)
=======
        return <BarChart3 {...iconProps} className='w-7 h-7 text-purple-600' />;
>>>>>>> 67d3771 (New changes in dev)
    }
  }, []);

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
      <div className="w-full max-w-7xl px-6">
        <div className="flex justify-center items-stretch gap-6 flex-wrap">
          {features.map((f) => {
            const isRestricted = f.restricted && role === 'user';

            return (
              <div
                key={f.title}
                className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow group w-full sm:w-80 lg:w-96 flex flex-col"
              >
                {isRestricted ? (
                  <>
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        alt={f.alt}
                        src={f.image}
                        width={400}
                        height={300}
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 67d3771 (New changes in dev)
                        src={f.image}
                        className='object-cover w-full h-full'
                        quality={75}
                        priority={false}
<<<<<<< HEAD
=======
                        className="object-cover w-full h-full"
>>>>>>> c7b1863 (Nuevos cambios en el home)
=======
>>>>>>> 67d3771 (New changes in dev)
                      />
                    </div>

                    <div className="p-6 flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        {getIcon(f.iconType)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">{f.desc}</p>
                    </div>

                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-gray-600">
                      <Lock className="w-12 h-12 mb-2" />
                      <p className="font-medium">Restricted for your role</p>
                    </div>
                  </>
                ) : (
                  <Link href={f.route} className="flex flex-col h-full">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image
                        alt={f.alt}
                        src={f.image}
                        width={400}
                        height={300}
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 67d3771 (New changes in dev)
                        src={f.image}
                        className='object-cover w-full h-full transition-transform duration-300 group-hover:scale-110'
                        quality={75}
                        priority={false}
<<<<<<< HEAD
=======
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
>>>>>>> c7b1863 (Nuevos cambios en el home)
=======
>>>>>>> 67d3771 (New changes in dev)
                      />
                    </div>

                    <div className="p-6 flex-grow">
                      <div className="flex items-center gap-3 mb-3">
                        {getIcon(f.iconType)}
                        <h3 className="text-lg font-semibold text-gray-900">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">{f.desc}</p>
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