'use client'

import { useEffect, useState } from 'react'
import { DataTable } from '../dataTable'
import { useAuth } from '@/context/auth-context'
import type { User } from '@/components/users'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  // =============================
  // 🔁 Cargar usuarios
  // =============================
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users')

      if (!res.ok) {
        throw new Error('Failed to fetch users')
      }

      const { items } = await res.json()
      setUsers(items)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('No se pudieron cargar los usuarios')
    } finally {
      setDataLoaded(true)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // =============================
  // ✏️ UPDATE USER (PATCH)
  // =============================
  const handleUpdateUser = async (data: {
    id: string
    name: string
    role: 'admin' | 'user'
  }) => {
    if (!isAdmin) {
      throw new Error('No tienes permiso para editar usuarios')
    }

    try {
      const res = await fetch(`/api/users/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          role: data.role,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error updating user')
      }

      await loadUsers()
    } catch (err) {
      console.error(err)
      setError('No se pudo actualizar el usuario')
      throw err
    }
  }

  // =============================
  // ⏳ Loading
  // =============================
  if (!dataLoaded) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando usuarios...</p>
      </div>
    )
  }

  // =============================
  // 🧱 UI
  // =============================
  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <DataTable
        title="Users"
        data={users}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'email', label: 'Email' },
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
        ]}
        addLabel={null}
        actions={isAdmin}
        fetchExecuted={handleUpdateUser}
      />
    </div>
  )
}
