import Sidebar from "@/components/ui/sidebar";
import { Edit2, Plus, Trash2 } from "lucide-react";
import { columns } from "@/components/income/columns";
import { DataTable } from "@/components/dataTable";

const IncomeAndExpenses = () => {

    const incomes = [
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
        {
            id: "inc_001",
            concept: "Venta producto A",
            amount: 850000,
            date: "2025-08-30",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_002",
            concept: "Compra insumos",
            amount: -320000,
            date: "2025-08-29",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
    ];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="flex min-h-screen"> {/* Cambio 1: h-screen → min-h-screen y removí overflow-hidden */}
            {/* Sidebar fijo */}
            <Sidebar />

            {/* Contenido */}
            <div className="flex-1 p-4"> {/* Cambio 2: p-6 → p-4 para reducir padding */}
                <div className="text-center mb-4"> {/* Cambio 3: mb-6 → mb-4 */}
                    <h1 className="text-2xl font-bold text-gray-900"> {/* Cambio 4: text-3xl → text-2xl */}
                        Sistema de gestión de ingresos y egresos
                    </h1>
                </div>

                <div className="max-w-7xl mx-auto">
                    <DataTable
                        columns={columns}
                        data={incomes}
                        showTotal={true}
                        totalField="amount"
                    />
                </div>
            </div>
        </div>
    );
}

export default IncomeAndExpenses;