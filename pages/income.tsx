import { useState } from "react";
import Sidebar from "@/components/ui/sidebar";
import { Plus } from "lucide-react";
import { columns } from "@/components/income/columns";
import { DataTable } from "@/components/dataTable";
import { Button } from "@/components/ui/button";
import NewTransactionForm from "@/components/income/newTransactionForm";

const IncomeAndExpenses = () => {
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const [incomes, setIncomes] = useState([
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
        // ... resto de datos
    ]);

    const handleNewTransaction = (data) => {
        setIsLoading(true);
        
        // Simular llamada a API
        setTimeout(() => {
            const newTransaction = {
                id: `inc_${Date.now()}`,
                concept: data.concept,
                amount: parseFloat(data.amount),
                date: data.date,
                user: { id: "u1", name: "Usuario Actual", email: "user@example.com" }, // Usuario actual
            };
            
            setIncomes(prev => [newTransaction, ...prev]);
            setIsLoading(false);
            setShowForm(false);
            
            console.log("Nueva transacción creada:", newTransaction);
        }, 1000);
    };

    const handleShowForm = () => {
        setShowForm(true);
    };

    const handleCancel = () => {
        setShowForm(false);
    };

    return (
        <div className="flex h-screen">
            <div className="flex-1 overflow-auto p-6">
                <h2 className="text-3xl font-bold mb-6">Income and expenses</h2>

                <div className="max-w-7xl mx-auto">
                    <DataTable
                        columns={columns}
                        data={incomes}
                        showTotal={true}
                        totalField='amount'
                        headerActions={
                            <Button onClick={handleShowForm}>
                                <Plus className="mr-2 h-4 w-4" />
                                New
                            </Button>
                        }
                    />
                </div>

                {/* Modal con formulario */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-1 max-w-xl w-full mx-4">
                            <NewTransactionForm
                                onSubmit={handleNewTransaction}
                                onCancel={handleCancel}
                                isLoading={isLoading}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default IncomeAndExpenses;