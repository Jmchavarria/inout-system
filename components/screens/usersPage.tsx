// components/screens/UsersPage.tsx
// Página para gestión completa de usuarios (CRUD) - Solo accesible por administradores

'use client'; // Directiva de Next.js para componente del cliente

// ============================================================================
// IMPORTACIONES
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
// Componentes específicos para manejo de usuarios
import { User } from '@/components/users';
// Componente de tabla de datos reutilizable
import { DataTable } from '../dataTable';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

// Roles válidos en el sistema
type Role = 'admin' | 'user';

// Estructura de datos para formulario de usuario
interface UserFormData {
  name: string;        // Nombre (obligatorio)
  role?: Role;         // Rol (opcional, default 'user')
  email?: string;      // Email (opcional)
  tel?: string;        // Teléfono (opcional)
}

// Estructura de error de la API
interface ApiError {
  error?: string;      // Mensaje de error opcional
}

// ============================================================================
// FUNCIONES HELPER DE NORMALIZACIÓN
// ============================================================================

// Normaliza un valor desconocido a Role válido o undefined
const normalizeRole = (value: unknown): Role | undefined =>
  value === 'admin' || value === 'user' ? value : undefined;

// Asegura que el valor sea un Role válido, usando fallback si no lo es
const ensureRoleOrDefault = (value: unknown, fallback: Role = 'user'): Role =>
  value === 'admin' || value === 'user' ? value : fallback;

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

// Hook para manejar el estado y carga de usuarios
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);     // Lista de usuarios
  const [isLoading, setIsLoading] = useState(false);  // Estado de carga

  // Función para cargar usuarios desde la API
  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true); // Inicia estado de carga

      // Petición GET a la API de usuarios
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Extrae la lista de usuarios de la respuesta
      const { items } = (await response.json()) as { items: User[] };
      setUsers(items); // Actualiza el estado con los usuarios

    } catch (err) {
      // Manejo de errores: log y notificación al usuario
      console.error('[getUsers] error:', err);
      alert('No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false); // Termina estado de carga
    }
  }, []); // useCallback sin dependencias - función estable

  // Retorna estado y funciones para manejar usuarios
  return { users, setUsers, isLoading, setIsLoading, loadUsers };
};

// ============================================================================
// FUNCIONES HELPER PARA OPERACIONES CRUD
// ============================================================================

// Función para crear un nuevo usuario
const createUser = async (data: UserFormData): Promise<User> => {
  // Asegura que el rol sea válido, default a 'user'
  const role = ensureRoleOrDefault(data.role, 'user');

  // Construye el payload con datos normalizados
  const payload = {
    name: data.name.trim(),                                           // Nombre limpio
    role,                                                            // Rol validado
    email: `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Email auto-generado
    tel: '0000000000',                                               // Teléfono placeholder
  };

  // Petición POST para crear usuario
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Manejo de errores de la API
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData?.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as User; // Retorna el usuario creado
};

// Función para actualizar un usuario existente
const updateUser = async (
  userId: string,
  data: UserFormData
): Promise<User> => {
  // Valida el rol con fallback a 'user'
  const role = ensureRoleOrDefault(data.role, 'user');

  // Payload solo con campos actualizables
  const payload = {
    name: data.name.trim(), // Nombre limpio
    role,                   // Rol validado
  };

  // Petición PATCH para actualizar usuario específico
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  // Manejo de errores
  if (!response.ok) {
    const errorData = (await response.json().catch(() => ({}))) as ApiError;
    throw new Error(errorData?.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as User; // Retorna usuario actualizado
};

// Hook para manejar operaciones CRUD de usuarios
const useUserOperations = (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,  // Función para actualizar lista
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>> // Función para loading state
) => {
  // Función unificada para crear o actualizar usuarios
  const handleUserOperation = async (
    data: UserFormData,      // Datos del formulario
    editingUser: User | null // Usuario siendo editado (null = crear nuevo)
  ): Promise<boolean> => {
    setIsLoading(true); // Activa loading

    try {
      let result: User;

      if (editingUser?.id) {
        // MODO EDICIÓN: actualiza usuario existente
        result = await updateUser(editingUser.id, data);

        // Actualiza el usuario en la lista local
        setUsers((prev) =>
          prev.map((u) => (u.id === result.id ? { ...u, ...result } : u))
        );
      } else {
        // MODO CREACIÓN: crea nuevo usuario
        result = await createUser(data);

        // Agrega el nuevo usuario al inicio de la lista
        setUsers((prev) => [result, ...prev]);
      }

      return true; // Indica éxito

    } catch (error) {
      // Manejo de errores con mensaje apropiado
      const errorMessage =
        error instanceof Error ? error.message : 'No se pudo guardar';

      console.error('[handleUser] error:', error);
      alert(errorMessage); // Notifica al usuario
      return false; // Indica fallo

    } finally {
      setIsLoading(false); // Desactiva loading
    }
  };

  return { handleUserOperation }; // Retorna la función de operación
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function UsersPage(): JSX.Element {
  // ========================================================================
  // ESTADO LOCAL
  // ========================================================================

  const [showForm, setShowForm] = useState(false);        // Controla visibilidad del formulario
  const [editingUser, setEditingUser] = useState<User | null>(null); // Usuario siendo editado

  // ========================================================================
  // HOOKS PERSONALIZADOS
  // ========================================================================

  // Hook para manejar lista de usuarios
  const { users, setUsers, isLoading, setIsLoading, loadUsers } = useUsers();

  // Hook para operaciones CRUD
  const { handleUserOperation } = useUserOperations(setUsers, setIsLoading);

  // ========================================================================
  // EFFECTS
  // ========================================================================

  // Carga inicial de usuarios al montar el componente
  useEffect(() => {
    void loadUsers(); // void para ignorar la Promise en useEffect
  }, [loadUsers]);

  // ========================================================================
  // HANDLERS DE EVENTOS
  // ========================================================================

  // Maneja el envío del formulario (crear o actualizar)
  const handleUser = async (data: UserFormData): Promise<void> => {
    const success = await handleUserOperation(data, editingUser);

    if (success) {
      // Si fue exitoso, cierra el formulario y limpia estado
      setShowForm(false);
      setEditingUser(null);
    }
    // Si falló, el formulario permanece abierto para mostrar error
  };

  // Adaptador para coincidir con la firma que espera UserEditForm
  // El componente UserEditForm espera { name: string; role: string }
  const handleUserSubmit = (data: { name: string; role: string }): void => {
    void handleUser({
      name: data.name,
      role: normalizeRole(data.role), // Normaliza string a Role | undefined
    });
  };

  // Maneja el clic en botón "Editar" de la tabla
  const handleEdit = (user: User): void => {
    setEditingUser(user);  // Establece usuario a editar
    setShowForm(true);     // Muestra el formulario
  };

  // Maneja la cancelación del formulario
  const handleCancel = (): void => {
    setShowForm(false);    // Oculta formulario
    setEditingUser(null);  // Limpia usuario editando
  };

  // ========================================================================
  // CONFIGURACIÓN DE COMPONENTES
  // ========================================================================

  // Crea las columnas de la tabla pasando la función de edición


  // ========================================================================
  // RENDERIZADO
  // ========================================================================

  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ], []);


  return (
    <div className='flex h-screen'>
      <div className='flex-1 overflow-auto p-6'>
        {/* Título de la página */}
        <h2 className='text-3xl font-bold mb-6'>Users</h2>

        {/* Contenedor de la tabla */}
        <div className='max-w-7xl mx-auto'>
          <DataTable
            columns={columns}
            data={users}
            title='Users'
          />
        </div>

        {/* Modal con formulario de usuario */}
        {showForm && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
           {/* 
           
           aca debe ir el formulario para editar el usuario. */}
          </div>
        )}
      </div>
    </div>
  );
}