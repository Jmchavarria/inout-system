// components/screens/UsersClient.tsx
'use client';

import { useMemo, useState } from 'react';
import { User } from '@/components/users';
import { DataTable } from '../dataTable';

interface Props {
  initialUsers: User[];
}

export default function UsersClient({ initialUsers }: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers);

  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'email', label: 'Email' },
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
  ], []);

  return (
    <div className="flex">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <DataTable
            title="Users"
            columns={columns}
            data={users}
          />
        </div>
      </div>
    </div>
  );
}
