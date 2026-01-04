'use client';

import { useMemo, useCallback } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { DataTable } from '../dataTable';
import { useAuth } from '@/context/auth-context';
import { useTransactions } from '@/context/transaction-context';
import { incomeService } from '../income/services/income.service';
import { normalizeIncome } from '../income/mappers/income.mapper';

export default function IncomeAndExpenses() {
  // ✅ Obtener user y role del contexto (ya optimizado)
  const { user, isLoading: userLoading } = useAuth();
  const { transactions, isLoading: transactionsLoading, error, addTransaction } = useTransactions();
  

  // ✅ El role ya viene en user desde el contexto optimizado
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
      const created = await incomeService.create({
        concept: data.concept.trim(),
        amount: Number(data.amount),
        date: data.date,
      });

      const normalized = normalizeIncome(created);
      addTransaction(normalized);
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }, [isAdmin, addTransaction]);

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

  // ✅ Loading unificado
  const isLoading = userLoading || transactionsLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-sm text-gray-500">Cargando datos...</p>
        </div>
      </div>
    );
  }

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

  if (!user) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-900">Sesión no disponible</p>
          <p className="text-sm text-gray-600 mt-2">Por favor, inicia sesión nuevamente</p>
        </div>
      </div>
    );
  }

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