// /context/auth-context.tsx
'use client'; // Directiva de Next.js 13+ para componentes del cliente

// Importaciones de React para manejo de contexto y estado
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
// Cliente de autenticación de Better Auth
import { authClient } from '@/lib/auth-client';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

// Estados posibles de autenticación del usuario
type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

// Tipo para el usuario autenticado - puede ser null si no está logueado
export type AuthUser =
  | {
    id: string;                    // ID único del usuario
    name: string | null;           // Nombre del usuario (puede ser null)
    email: string | null;          // Email del usuario (puede ser null)
    image?: string | null;         // Avatar/imagen del usuario (opcional)
    role?: 'admin' | 'user';       // Rol del usuario en el sistema (opcional)
    tel?: string | null;           // Teléfono del usuario (opcional)
  }
  | null; // null cuando no hay usuario autenticado

// Opciones para el proceso de sign in
type SignInOptions = {
  callbackURL?: string;            // URL a la que redirigir después del login
  newUserCallbackURL?: string;     // URL para usuarios nuevos
};

// Valor del contexto de autenticación - define qué funciones están disponibles
type AuthContextValue = {
  user: AuthUser;                                            // Usuario actual
  status: AuthStatus;                                        // Estado de autenticación
  refresh: () => Promise<void>;                              // Función para refrescar datos del usuario
  signInWithGitHub: (opts?: SignInOptions) => Promise<void>; // Login con GitHub
  signOut: () => Promise<void>;                              // Cerrar sesión
};

// ============================================================================
// CREACIÓN DEL CONTEXTO
// ============================================================================

// Crea el contexto con valor inicial null
const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVEEDOR DEL CONTEXTO DE AUTENTICACIÓN
// ============================================================================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Estado para almacenar la información del usuario actual
  const [user, setUser] = useState<AuthUser>(null);
  
  // Estado para el status de autenticación (loading, authenticated, unauthenticated)
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Función para obtener información del usuario desde la API
  const fetchMe = async () => {
    try {
      setStatus('loading'); // Marca como cargando
      
      // Hace petición a la API /me con credenciales incluidas
      const res = await fetch('/api/me', { credentials: 'include' });
      
      // Si la respuesta no es exitosa (usuario no autenticado)
      if (!res.ok) {
        setUser(null);                    // Limpia usuario
        setStatus('unauthenticated');     // Marca como no autenticado
        return;
      }
      
      // Parsea la respuesta JSON con el tipo esperado
      const data = (await res.json()) as { 
        userId: string; 
        role: string;
        name?: string;
        email?: string;
        image?: string;
        tel?:string;
      };
      
      // Construye el objeto usuario con los datos recibidos
      const user: AuthUser = {
        id: data.userId,                           // ID del usuario
        name: data.name || null,                   // Nombre (convierte undefined a null)
        email: data.email || null,                 // Email (convierte undefined a null)
        image: data.image || null,                 // Imagen (convierte undefined a null)
        role: data.role as 'admin' | 'user',       // Rol (cast al tipo esperado)
        tel: data.tel || null 
      };
      
      setUser(user);                     // Establece el usuario
      setStatus('authenticated');        // Marca como autenticado
      
    } catch {
      // Si hay cualquier error en la petición
      setUser(null);                     // Limpia usuario
      setStatus('unauthenticated');      // Marca como no autenticado
    }
  };

  // Effect que se ejecuta una vez al montar el componente
  useEffect(() => {
    void fetchMe(); // Obtiene información del usuario al cargar
  }, []); // Array vacío = solo se ejecuta una vez

  // Función pública para refrescar los datos del usuario
  const refresh = async () => {
    await fetchMe(); // Simplemente llama a fetchMe
  };

  // Función para iniciar sesión con GitHub usando Better Auth
  const signInWithGitHub = async (opts?: SignInOptions) => {
    try {
      // Usa el cliente de Better Auth para login social con GitHub
      await authClient.signIn.social({
        provider: 'github',                                    // Proveedor de OAuth
        callbackURL: opts?.callbackURL || '/',                // URL de redirección tras login exitoso
        newUserCallbackURL: opts?.newUserCallbackURL || '/welcome', // URL para usuarios nuevos
      });
    } catch (error) {
      // Si falla el login, registra el error y lo re-lanza
      console.error('GitHub sign in failed:', error);
      throw error; // Re-lanza para que el componente que llama pueda manejarlo
    }
  };

  // Función para cerrar sesión
  const signOut = async () => {
    try {
      // Usa el cliente de Better Auth para cerrar sesión en el servidor
      await authClient.signOut();
    } catch (error) {
      // Si falla el signOut del servidor, registra pero continúa
      console.error('Sign out failed:', error);
      // Continuar con la limpieza local aunque falle el servidor
    } finally {
      // Siempre ejecuta la limpieza local, independientemente de si falló el servidor
      setUser(null);                       // Limpia el usuario del estado
      setStatus('unauthenticated');        // Marca como no autenticado
      window.location.replace('/auth/login'); // Redirige al login (reemplaza en historial)
    }
  };

  // Memoriza el valor del contexto para evitar re-renders innecesarios
  const value = useMemo<AuthContextValue>(
    () => ({ 
      user,              // Usuario actual
      status,            // Estado de autenticación
      refresh,           // Función para refrescar
      signInWithGitHub,  // Función de login con GitHub
      signOut            // Función de logout
    }),
    [user, status] // Solo recalcula si cambian user o status
  );

  // Provee el contexto a todos los componentes hijos
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK PERSONALIZADO PARA USAR EL CONTEXTO
// ============================================================================

// Hook que permite a los componentes acceder al contexto de autenticación
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext); // Obtiene el valor del contexto
  
  // Validación: si no hay contexto, significa que el hook se está usando
  // fuera de un AuthProvider, lo cual es un error de programación
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider />');
  
  return ctx; // Retorna el valor del contexto
}