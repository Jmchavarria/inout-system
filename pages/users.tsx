// app/users/page.tsx
import { DataTable } from "@/components/dataTable";
import { userColumns, User } from "@/components/users/columns";
import Sidebar from "@/components/ui/sidebar";

const users: User[] = [
    { name: "Juan Pérez", email: "juan@example.com", tel: "3001234567" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
    { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
];

export default function UsersPage() {
    return (
        <div className="flex h-screen ">
            <Sidebar />

            <div className="flex-1 overflow-auto p-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Sistema de gestión de ingresos y egresos
                    </h1>
                </div>

                <h2 className="text-3xl font-bold mb-2">Users</h2>

                <div className="max-w-7xl mx-auto">
                          <DataTable columns={userColumns} data={users} />
                </div>
            </div>
        </div>
    );
}
