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
<title>prueba</title>

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
      image: '/images/features/incomeAndExpenses.avif',
      alt: 'Financial management system',
    },
    {
      title: 'User Management',
      desc: 'Roles, permissions, and activity logs. Fine-grained control for your team with simple auditing.',
      iconType: 'users',
      route: '/users',
      restricted: true,
      image: '/images/features/users.avif',
      alt: 'User and permission management',
    },
    {
      title: 'Reports',
      desc: 'Dashboards and exportable files. Key metrics ready to support decision-making.',
      iconType: 'chart',
      route: '/reports',
      restricted: true,
      image: '/images/features/reports.avif',
      alt: 'Reports and analytics',
    },
  ], []);

  const getIcon = useCallback((iconType: Feature['iconType']) => {
    switch (iconType) {
      case 'dollar':
        return (
          <CircleDollarSign
            className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600"
            aria-hidden="true"
          />
        );
      case 'users':
        return (
          <Users2
            className="w-6 h-6 sm:w-7 sm:h-7 text-blue-600"
            aria-hidden="true"
          />
        );
      case 'chart':
        return (
          <BarChart3
            className="w-6 h-6 sm:w-7 sm:h-7 text-purple-600"
            aria-hidden="true"
          />
        );
    }
  }, []);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] py-6 sm:py-8 md:py-12">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {features.map((f, index) => {
            const isRestricted = f.restricted && role === 'user';
            const isFirstImage = index === 0; // 👈 LCP

            return (
              <div
                key={f.title}
                className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                {isRestricted ? (
                  <>
                    {/* Imagen NO LCP → lazy */}
                    <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                      <Image
                        alt={f.alt}
                        src={f.image}
                        width={400}
                        height={300}
                        className="object-cover w-full h-full"
                        quality={85}
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    <div className="p-4 sm:p-6 flex-grow">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {getIcon(f.iconType)}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {f.desc}
                      </p>
                    </div>

                    <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center text-gray-600 px-4">
                      <Lock className="w-10 h-10 sm:w-12 sm:h-12 mb-2" />
                      <p className="font-medium text-sm sm:text-base text-center">
                        Restricted for your role
                      </p>
                    </div>
                  </>
                ) : (
                  <Link href={f.route} className="flex flex-col h-full">
                    <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                      <Image
                        alt={f.alt}
                        src={f.image}
                        width={400}
                        height={300}
                        className={`object-cover w-full h-full ${
                          !isFirstImage
                            ? 'transition-transform duration-300 group-hover:scale-110'
                            : ''
                        }`}
                        quality={90}
                        priority={isFirstImage} // ✅ SOLO LCP
                        loading={!isFirstImage ? 'lazy' : undefined}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>

                    <div className="p-4 sm:p-6 flex-grow">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        {getIcon(f.iconType)}
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                          {f.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {f.desc}
                      </p>
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
