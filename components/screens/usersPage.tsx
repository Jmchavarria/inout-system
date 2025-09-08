'use client';

import { useCallback, useEffect, useState } from 'react';
import { createUserColumns, User, UserEditForm } from '@/components/users';
import { DataTable } from '@/components/dataTable';

interface UserFormData {
  name: string;
  role?: string;
  email?: string;
  tel?: string;
}

interface ApiError {
  error?: string;
}

// Hook personalizado para manejar usuarios
const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const { items } = (await response.json()) as { items: User[] };
      setUsers(items);
    } catch (err) {
      console.error('[getUsers] error:', err);
      alert('No se pudieron cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { users, setUsers, isLoading, setIsLoading, loadUsers };
};

// Función helper para crear usuario
const createUser = async (data: UserFormData): Promise<User> => {
  const payload = {
    name: data.name.trim(),
    role: (data.role ?? 'user').trim(),
    email: `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
    tel: '0000000000',
  };

  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}) as ApiError);
    throw new Error(errorData?.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as User;
};

// Función helper para actualizar usuario
const updateUser = async (
  userId: string,
  data: UserFormData
): Promise<User> => {
  const payload = {
    name: data.name.trim(),
    role: (data.role ?? '').trim(),
  };

  const response = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}) as ApiError);
    throw new Error(errorData?.error || `HTTP ${response.status}`);
  }

  return (await response.json()) as User;
};

// Hook para manejar operaciones CRUD de usuarios
const useUserOperations = (
  setUsers: React.Dispatch<React.SetStateAction<User[]>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const handleUserOperation = async (
    data: UserFormData,
    editingUser: User | null
  ): Promise<boolean> => {
    setIsLoading(true);

    try {
      let result: User;

      if (editingUser?.id) {
        result = await updateUser(editingUser.id, data);
        setUsers((prev) =>
          prev.map((u) => (u.id === result.id ? { ...u, ...result } : u))
        );
      } else {
        result = await createUser(data);
        setUsers((prev) => [result, ...prev]);
      }

      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'No se pudo guardar';

      console.error('[handleUser] error:', error);
      alert(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { handleUserOperation };
};

export default function UsersPage(): JSX.Element {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { users, setUsers, isLoading, setIsLoading, loadUsers } = useUsers();
  const { handleUserOperation } = useUserOperations(setUsers, setIsLoading);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]); // ✅ Ahora loadUsers está en las dependencias

  const handleUser = async (data: UserFormData): Promise<void> => {
    const success = await handleUserOperation(data, editingUser);

    if (success) {
      setShowForm(false);
      setEditingUser(null);
    }
  };

  const handleEdit = (user: User): void => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleCancel = (): void => {
    setShowForm(false);
    setEditingUser(null);
  };

  // Crear las columnas con la función de edit
  const userColumns = createUserColumns(handleEdit);

  return (
    <div className='flex h-screen'>
      <div className='flex-1 overflow-auto p-6'>
        <h2 className='text-3xl font-bold mb-6'>Users</h2>

        <div className='max-w-7xl mx-auto'>
          <DataTable
            columns={userColumns}
            data={users}
            isLoading={isLoading}
            showTotal={true}
          />
        </div>

        {showForm && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <UserEditForm
              key={editingUser?.email ?? 'new'}
              onSubmit={handleUser}
              onCancel={handleCancel}
              isLoading={isLoading}
              editingUser={
                editingUser
                  ? {
                      name: editingUser.name ?? '',
                      role: editingUser.role ?? '',
                    }
                  : null
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
