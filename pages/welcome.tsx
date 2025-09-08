// pages/welcome.tsx
// Página de bienvenida que se muestra a usuarios nuevos para configurar su teléfono

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { FormEvent, ReactElement, useState } from 'react';
// Íconos de Lucide React para la interfaz
import { Phone, Shield, Heart, CheckCircle } from 'lucide-react';
// Cliente de Better Auth para obtener información de sesión
import { authClient } from '@/lib/auth-client';

// ============================================================================
// COMPONENTE PRINCIPAL DE BIENVENIDA
// ============================================================================

export default function Welcome(): JSX.Element {
  // ========================================================================
  // HOOKS Y ESTADO
  // ========================================================================
  
  // Hook de Better Auth para obtener sesión actual del usuario
  const { data, isPending } = authClient.useSession(); // ✅ Uso correcto del hook
  
  // Extrae el ID del usuario de la sesión, null si no existe
  const userId = data?.user?.id ?? null;

  // Estado local para el número de teléfono que ingresa el usuario
  const [tel, setTel] = useState('');
  
  // Estado para controlar el loading durante el envío del formulario
  const [isLoading, setIsLoading] = useState(false);

  // ========================================================================
  // HANDLERS DE EVENTOS
  // ========================================================================

  // Maneja el envío del formulario de teléfono
  const onSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault(); // Previene el comportamiento por defecto del form
    setIsLoading(true); // Activa el estado de carga

    try {
      // Hace petición POST a la API para guardar el teléfono
      const res = await fetch('/api/me/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Incluye cookies de sesión
        body: JSON.stringify({ tel, userId }), // Envía teléfono y userId
      });

      // Si la respuesta no es exitosa
      if (!res.ok) {
        // Intenta extraer mensaje de error del JSON de respuesta
        const body = await res.json().catch(() => ({})) as { error?: string };
        alert(
          `No se pudo guardar el teléfono: ${body?.error || res.statusText}`
        );
        return; // Sale de la función sin continuar
      }

      // Si fue exitoso, redirige al dashboard
      window.location.href = '/';
      
    } catch (err) {
      // Maneja errores de red u otros errores inesperados
      console.error('[/api/me/phone] network error:', err);
      alert('Error de red. Revisa la consola.');
    } finally {
      // Siempre desactiva el loading, independientemente del resultado
      setIsLoading(false);
    }
  };

  // Maneja el botón "Skip" para omitir la configuración del teléfono
  const handleSkip = (): void => {
    window.location.href = '/dashboard'; // Redirige directamente al dashboard
  };

  // ========================================================================
  // RENDERIZADO CONDICIONAL
  // ========================================================================

  // Mientras se carga la sesión, muestra un loading simple
  if (isPending) {
    return <div className='p-6'>Cargando…</div>;
  }

  // ========================================================================
  // RENDERIZADO PRINCIPAL
  // ========================================================================

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-6'>
      {/* Contenedor principal centrado */}
      <div className='max-w-md w-full'>
        
        {/* Header de bienvenida */}
        <div className='text-center mb-8'>
          {/* Ícono circular con teléfono */}
          <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <Phone className='w-8 h-8 text-blue-600' />
          </div>
          
          {/* Título principal con emoji */}
          <h1 className='text-3xl font-bold text-gray-800 mb-2'>
            Welcome to InOut! 👋
          </h1>
          
          {/* Subtítulo */}
          <p className='text-gray-600'>We're excited to have you on board</p>
        </div>

        {/* Card principal con el formulario */}
        <div className='bg-white rounded-2xl shadow-xl p-8 border border-gray-100'>
          
          {/* Sección explicativa sobre seguridad */}
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

          {/* Lista de beneficios de agregar teléfono */}
          <div className='space-y-3 mb-6'>
            {/* Beneficio 1: Recuperación de cuenta */}
            <div className='flex items-center gap-3 text-sm'>
              <Shield className='w-4 h-4 text-green-500 flex-shrink-0' />
              <span className='text-gray-700'>Account recovery protection</span>
            </div>
            
            {/* Beneficio 2: Notificaciones de seguridad */}
            <div className='flex items-center gap-3 text-sm'>
              <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
              <span className='text-gray-700'>
                Important security notifications
              </span>
            </div>
            
            {/* Beneficio 3: Sin spam */}
            <div className='flex items-center gap-3 text-sm'>
              <Heart className='w-4 h-4 text-red-500 flex-shrink-0' />
              <span className='text-gray-700'>
                We'll never spam you - promise!
              </span>
            </div>
          </div>

          {/* Formulario para ingresar teléfono */}
          <form onSubmit={onSubmit} className='space-y-4'>
            <div>
              {/* Label del campo teléfono */}
              <label
                htmlFor='phone'
                className='block text-sm font-semibold text-gray-700 mb-2'
              >
                Phone Number
              </label>
              
              {/* Input con ícono de teléfono */}
              <div className='relative'>
                {/* Ícono posicionado absolutamente dentro del input */}
                <Phone className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5' />
                
                {/* Campo de entrada de teléfono */}
                <input
                  id='phone'
                  className='w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors'
                  placeholder='+57 300 123 4567' // Placeholder para Colombia
                  value={tel}                    // Valor controlado por estado
                  onChange={(e) => setTel(e.target.value)} // Actualiza estado
                  required                       // Campo obligatorio
                  disabled={isLoading}           // Deshabilita durante loading
                />
              </div>
            </div>

            {/* Botón de envío con estados de loading */}
            <button
              type='submit'
              disabled={isLoading} // Deshabilita durante carga
              className='w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl'
            >
              {isLoading ? (
                // Estado de loading con spinner animado
                <div className='flex items-center justify-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Saving...
                </div>
              ) : (
                // Estado normal
                'Continue to Dashboard'
              )}
            </button>
          </form>

          {/* Footer con mensaje de seguridad */}
          <div className='mt-6 pt-4 border-t border-gray-100'>
            <p className='text-xs text-gray-500 text-center'>
              🔒 Your information is encrypted and secure. We respect your
              privacy.
            </p>
          </div>
        </div>

        {/* Botón para omitir configuración */}
        <div className='text-center mt-6'>
          <button
            onClick={handleSkip}
            className='text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// CONFIGURACIÓN DE LAYOUT
// ============================================================================

// Define que esta página no usa el layout por defecto (sin sidebar)
Welcome.getLayout = function getLayout(page: ReactElement) {
  return page; // Retorna la página tal como es, sin envolver en AppLayout
};