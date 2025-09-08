import { ArrowRight, BarChart3, Users2, CircleDollarSign } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const Home = () => {
  const features = [
    {
      title: 'Sistema de gestión de ingresos y gastos',
      desc: 'Registra, clasifica y concilia tus movimientos en segundos. Visión clara de flujo de caja para mantener un control preciso de todas las transacciones financieras de tu empresa.',
      icon: (
        <CircleDollarSign className='w-7 h-7 text-emerald-600' aria-hidden />
      ),
      route: '/income',
      art: (
        <Image
          alt='Sistema de gestión financiera'
          width={400}
          height={240}
          src={'/images/features/incomeAndExpenses.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
      gradient: 'from-emerald-50 to-teal-50',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200',
      buttonColor:
        'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    },
    {
      title: 'Gestión de usuarios',
      desc: 'Roles, permisos y actividad. Control fino para tu equipo y auditoría simple. Administra el acceso de usuarios con diferentes niveles de permisos y mantén un registro detallado de todas las actividades.',
      icon: <Users2 className='w-7 h-7 text-blue-600' aria-hidden />,
      route: '/users',
      art: (
        <Image
          alt='Gestión de usuarios y permisos'
          width={400}
          height={240}
          src={'/images/features/users.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
      gradient: 'from-blue-50 to-indigo-50',
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      buttonColor:
        'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    },
    {
      title: 'Reportes',
      desc: 'Dashboards y exportables. Indicadores clave listos para tomar decisiones. Visualiza datos importantes a través de gráficos interactivos y exporta reportes detallados en diferentes formatos.',
      icon: <BarChart3 className='w-7 h-7 text-purple-600' aria-hidden />,
      route: '/reports',
      art: (
        <Image
          alt='Reportes y análisis'
          width={400}
          height={240}
          src={'/images/features/reports.webp'}
          className='w-full h-48 object-cover rounded-xl transition-all duration-300 group-hover:scale-110'
        />
      ),
      gradient: 'from-purple-50 to-pink-50',
      iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
      buttonColor:
        'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    },
  ];

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='flex items-center justify-center p-8 py-12 min-h-screen'>
        <div className='max-w-7xl w-full'>
          <div className='grid gap-8 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
            {features.map((f) => (
              <div
                key={f.title}
                className='group rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-xl hover:border-gray-300 transition-all duration-300 min-h-[420px] flex flex-col'
              >
                {/* Header con icono y título */}
                <div className='flex items-center gap-4 mb-6'>
                  <div className='rounded-xl bg-gray-100 p-3 flex-shrink-0 group-hover:bg-gray-200 transition-colors duration-300'>
                    {f.icon}
                  </div>
                  <h3 className='text-xl font-semibold text-gray-900 leading-tight'>
                    {f.title}
                  </h3>
                </div>

                {/* Imagen con overlay */}
                <div className='relative mb-6 rounded-xl overflow-hidden shadow-sm cursor-pointer'>
                  {f.art}

                  {/* Overlay oscuro sutil */}
                  <div className='absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                    <Link href={f.route} passHref>
                      <button
                        className='bg-white text-gray-900 px-6 py-3 rounded-lg shadow-lg inline-flex items-center gap-2 text-base font-medium hover:bg-gray-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300'
                        aria-label={`Acceder a ${f.title}`}
                      >
                        Acceder
                        <ArrowRight className='w-5 h-5' />
                      </button>
                    </Link>
                  </div>
                </div>

                {/* Descripción */}
                <p className='text-gray-600 leading-relaxed flex-grow text-base'>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
