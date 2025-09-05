"use client";

import { DataTable } from "@/components/dataTable";
import { createUserColumns, User } from "@/components/users/columns";
import UserEditForm from "@/components/users/userForm";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Sidebar from "@/components/ui/sidebar";

export default function UsersPage() {
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    const [users, setUsers] = useState([
        { name: "Ana Gómez", email: "ana@example.com", tel: "3017654321" },
        { name: "Juan Pérez", email: "juan@example.com", tel: "3001234567" },
    ]);

    const handleUser = (data) => {
        setIsLoading(true);

        setTimeout(() => {
            if (editingUser) {
                // Editar usuario existente
                setUsers(prev => 
                    prev.map(user => 
                        user.email === editingUser.email 
                            ? { ...user, name: data.name, role: data.role } 
                            : user
                    )
                );
            } else {
                // Crear nuevo usuario
                const userData = {
                    name: data.name,
                    email: `${data.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, // Email generado
                    tel: "0000000000", // Tel por defecto
                    role: data.role
                };
                setUsers(prev => [userData, ...prev]);
            }

            setIsLoading(false);
            setShowForm(false);
            setEditingUser(null);

            console.log(editingUser ? "Usuario editado:" : "Usuario creado:", data);
        }, 1000);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleNewUser = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    // Crear las columnas con la función de edit
    const userColumns = createUserColumns(handleEdit);

    return (
        <div className="flex h-screen">
            <div className="flex-1 overflow-auto p-6">
                <h2 className="text-3xl font-bold mb-6">Users</h2>

                <div className="max-w-7xl mx-auto">
                    <DataTable 
                        columns={userColumns} 
                        data={users}
                        headerActions={
                            <Button onClick={handleNewUser}>
                                <Plus className="mr-2 h-4 w-4" />
                                New User
                            </Button>
                        }
                    />
                </div>

                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <UserEditForm
                            onSubmit={handleUser}
                            onCancel={handleCancel}
                            isLoading={isLoading}
                            editingUser={editingUser}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}