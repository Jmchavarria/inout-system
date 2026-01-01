'use client'

import { useEffect, useState } from 'react'
import { User } from '@/components/users'
import { DataTable } from '../dataTable'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users')
        
        if (!isMounted) return

        if (!res.ok) {
          throw new Error('Failed to fetch users')
        }

        const { items } = await res.json()
        
        if (isMounted) {
          setUsers(items)
          setError(null)
          setDataLoaded(true)
        }
      } catch (err) {
        if (isMounted) {
          console.error(err)
          setError('No se pudieron cargar los usuarios')
          setDataLoaded(true)
        }
      }
    }

    loadUsers()

    return () => {
      isMounted = false
    }
  }, [])

  // Renderizado progresivo
  if (!dataLoaded) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando usuarios...</p>
      </div>
    )
  }

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
        add={false}
        actions={true}
      />
    </div>
  )
}