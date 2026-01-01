'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';

import { DataTable } from '../dataTable';
import { useAuth } from '@/context/auth-context';

import { incomeService } from '../income/services/income.service';
import { normalizeIncome } from '../income/mappers/income.mapper';
import type { Income } from '../income';

export default function IncomeAndExpenses() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [items, setItems] = useState<Income[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'concept', label: 'Concept' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'user', label: 'User' },
  ], []);

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    incomeService.list()
      .then(res => {
        if (!mounted) return;
        setItems(res.items.map(normalizeIncome));
        setDataError(null);
      })
      .catch(e => {
        if (!mounted) return;
        setItems([]);
        setDataError(e instanceof Error ? e.message : 'Error inesperado');
      })
      .finally(() => mounted && setDataLoaded(true));

    return () => { mounted = false; };
  }, [user]);

  const handleTransactionSubmit = useCallback(async (data: any) => {
    if (!isAdmin) {
      throw new Error('No tienes permiso para crear transacciones');
    }

    const created = await incomeService.create({
      concept: data.concept.trim(),
      amount: Number(data.amount),
      date: data.date,
    });

    setItems(prev => [normalizeIncome(created), ...prev]);
  }, [isAdmin]);

  const tableData = useMemo(() => (
    items.map(i => ({
      id: i.id,
      concept: i.concept,
      amount: i.amount,
      date: new Date(i.date).toLocaleDateString('es-CO'),
      user: i.user.name || i.user.email || 'Unknown',
    }))
  ), [items]);

  if (!user) {  
    return <div className="p-6 flex items-center justify-center h-full">
      <p className="text-gray-500">Verificando permisos...</p>
    </div>
  }

  if (!dataLoaded) {
    return <div className="p-6 flex items-center justify-center h-full">
      <p className="text-gray-500">Cargando Transacciones...</p>
    </div>
  }

  return (
    <div className="h-full px-6">
      {dataError ? (
        <div className="flex flex-col items-center justify-center h-full">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p>{dataError}</p>
        </div>
      ) : (
        <DataTable
          title="Income and Expenses"
          columns={columns}
          data={tableData}
          addLabel={isAdmin ? 'New Income/Expense' : null}
          actions={false}
          fetchExecuted={handleTransactionSubmit}
        />
      )}
    </div>
  );
}