// components/screens/UsersPage.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { User } from '@/components/users';
import { DataTable } from '@/components/dataTable/dataTable';
import { useAuth } from '@/context/auth-context';
import { UseDataTable } from '@/context/dataTableContext';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setTitle, setColumns, setData, setActions, setAddLabel } = UseDataTable();

  const columns = useMemo(
    () => [
      { key: 'id', label: 'ID' },
      { key: 'email', label: 'Email' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
    ],
    [],
  );

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const json = await res.json();
      const items = json.items ?? [];
      setUsers(items);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los usuarios');
    } finally {
      setDataLoaded(true);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Configuración del DataTable (estable)
  useEffect(() => {
    setColumns(columns);
    setTitle('users');
    setAddLabel(null); // o 'Create'
  }, [columns, setColumns, setTitle, setAddLabel]);

  // Sincroniza data cada vez que cambia users
  useEffect(() => {
    setData(users);
  }, [users, setData]);

  // Acciones según role
  useEffect(() => {
    setActions(!!isAdmin);
  }, [isAdmin, setActions]);

  const handleUpdateUser = async (data: { id: string; name: string; role: 'admin' | 'user' }) => {
    if (!isAdmin) throw new Error('No tienes permiso para editar usuarios');

    const res = await fetch(`/api/users/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, role: data.role }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error ?? 'Error updating user');
    }

    await loadUsers();
  };

  if (!dataLoaded) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-500">Loading users</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <DataTable fetchExecuted={handleUpdateUser} />
    </div>
  );
}
