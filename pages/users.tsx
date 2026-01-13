// app/users/page.tsx (o donde renderizas UsersPage)
import { DataTableProvider } from '@/context/dataTableContext';
import UsersPage from '@/components/screens/usersPage.server';

export default function Page() {
  return (
    <DataTableProvider>
      <UsersPage />
    </DataTableProvider>
  );
}
