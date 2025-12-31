'use client'

import { useEffect, useState, useCallback } from 'react'
import { User } from '@/components/users'
import { DataTable } from '../dataTable'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true)

      const res = await fetch('/api/users') // ✅ RELATIVO
      if (!res.ok) throw new Error('Failed to fetch users')

      const { items } = await res.json()
      setUsers(items)
    } catch (err) {
      console.error(err)
      alert('No se pudieron cargar los usuarios')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return (
    <div className="p-6">
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
=======
      <h1 className="text-3xl font-bold mb-4">Users</h1>
>>>>>>> 67d3771 (New changes in dev)
=======
>>>>>>> 0ed0a5a (Cambios en users en home y en reports)
=======
      <h1 className="text-3xl font-bold mb-4">Users</h1>
>>>>>>> 41a978b (New changes in dev)

      <DataTable
        title="Users"
        data={users}
        columns={[
          { key: 'id', label: 'ID' },
          { key: 'email', label: 'Email' },
          { key: 'name', label: 'Name' },
          { key: 'role', label: 'Role' },
        ]}
        // loading={isLoading}
      />
    </div>
  )
}
