"use client";

import { useState } from "react";
import {
    ChartAreaInteractive,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Button
} from "@/components/ui";
import { Download, TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function ReportsPage() {
    // Datos de ejemplo - en una app real vendrían del backend
    const [transactions] = useState([
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
            id: "inc_003",
            concept: "Servicios profesionales",
            amount: 500000,
            date: "2025-08-28",
            user: { id: "u1", name: "Juan Pérez", email: "juan@example.com" },
        },
        {
            id: "inc_004",
            concept: "Gastos de oficina",
            amount: -150000,
            date: "2025-08-27",
            user: { id: "u2", name: "Ana Gómez", email: "ana@example.com" },
        },
    ]);

    // Calcular saldo actual
    const saldoActual = transactions.reduce((total, transaction) => {
        return total + transaction.amount;
    }, 0);

    // Calcular totales de ingresos y egresos
    const totalIngresos = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);

    const totalEgresos = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Formatear moneda
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    // Función para descargar CSV
    const downloadCSV = () => {
        const headers = ['Fecha', 'Concepto', 'Monto', 'Usuario'];
        const csvContent = [
            headers.join(','),
            ...transactions.map(t => [
                t.date,
                `"${t.concept}"`,
                t.amount,
                `"${t.user.name}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'reporte_financiero.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-screen">
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Financial Reports
                        </h1>
                        <Button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700">
                            <Download className="mr-2 h-4 w-4" />
                            Download CSV
                        </Button>
                    </div>

                    {/* Cards de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Saldo Actual */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Current Balance
                                </CardTitle>
                                <DollarSign className={`h-4 w-4 ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {saldoActual >= 0 ? '+' : ''}{formatCurrency(saldoActual)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {saldoActual >= 0 ? 'Profit' : 'Loss'} from all transactions
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Ingresos */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Income
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    +{formatCurrency(totalIngresos)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    From {transactions.filter(t => t.amount > 0).length} income transactions
                                </p>
                            </CardContent>
                        </Card>

                        {/* Total Egresos */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Expenses
                                </CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-600">
                                    -{formatCurrency(totalEgresos)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    From {transactions.filter(t => t.amount < 0).length} expense transactions
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico */}
                    <div className="w-full">
                        <ChartAreaInteractive />
                    </div>

                </div>
            </div>
        </div>
    );
}