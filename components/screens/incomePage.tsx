'use client';

import { useMemo, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { DataTable } from '../dataTable';
import { useAuth } from '@/context/auth-context';
import { useTransactions } from '@/context/transaction-context';
import { incomeService } from '../income/services/income.service';
import { normalizeIncome } from '../income/mappers/income.mapper';

export default function IncomeAndExpenses() {
  const { user } = useAuth();
  const { transactions, isLoading, error, addTransaction } = useTransactions();
  
  const isAdmin = user?.role === 'admin';

  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'concept', label: 'Concept' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'user', label: 'User' },
  ], []);

  const handleTransactionSubmit = useCallback(async (data: any): Promise<void> => {
    if (!isAdmin) {
      throw new Error('No tienes permiso para crear transacciones');
    }

    try {
      // Crear en el backend
      const created = await incomeService.create({
        concept: data.concept.trim(),
        amount: Number(data.amount),
        date: data.date,
      });

      // Normalizar y agregar al contexto global
      const normalized = normalizeIncome(created);
      addTransaction(normalized);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }, [isAdmin, addTransaction]);

  // Formatear datos para la tabla
  const tableData = useMemo(() => (
    transactions.map(i => ({
      id: i.id,
      concept: i.concept,
      amount: i.amount,
      date: new Date(i.date).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      user: i.user.name || i.user.email || 'Unknown',
    }))
  ), [transactions]);

  // Estado de carga: esperando usuario
  if (!user) {  
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-500">Verificando permisos...</p>
      </div>
    );
  }

  // Estado de carga: esperando transacciones
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <p className="text-gray-500">Cargando transacciones...</p>
      </div>
    );
  }

  // Estado de error
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Error al cargar datos</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Contenido principal
  return (
    <div className="h-full px-6">
      <DataTable
        title="Income and Expenses"
        columns={columns}
        data={tableData}
        addLabel={isAdmin ? 'New Income/Expense' : null}
        actions={false}
        fetchExecuted={handleTransactionSubmit}
      />
    </div>
  );
}