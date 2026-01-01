'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { DataTable } from '../dataTable';
import { useAuth } from '@/context/auth-context';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

type IncomeApi = {
  id: string | number;
  concept?: string | null;
  amount?: number | string | null;
  date?: string | null;
  user?: {
    id?: string | number | null;
    name?: string | null;
    email?: string | null;
  } | null;
};

type Income = {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

type IncomeListResponse = { items: IncomeApi[] };
type CreateIncomeResponse = IncomeApi;

// ============================================================================
// FUNCIONES HELPER
// ============================================================================

const normalizeString = (value: string | null | undefined): string => {
  return value ?? '';
};

const normalizeNumber = (value: number | string | null | undefined): number => {
  return Number(value ?? 0);
};

const normalizeDate = (date: string | null | undefined): string => {
  return (date ?? '').slice(0, 10);
};

const normalizeUser = (user: IncomeApi['user']) => ({
  id: String(user?.id ?? ''),
  name: normalizeString(user?.name),
  email: normalizeString(user?.email),
});

function normalizeIncome(t: IncomeApi): Income {
  return {
    id: String(t.id ?? ''),
    concept: normalizeString(t.concept),
    amount: normalizeNumber(t.amount),
    date: normalizeDate(t.date),
    user: normalizeUser(t.user),
  };
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorData = (await response.json()) as { error?: string; message?: string };
      message = errorData?.error || errorData?.message || message;
    } catch {
      // Ignorar errores de parseo
    }
    throw new Error(message);
  }
  return await response.json() as T;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function IncomeAndExpenses() {
  const columns = useMemo(() => [
    { key: 'id', label: 'ID' },
    { key: 'concept', label: 'Concept' },
    { key: 'amount', label: 'Amount' },
    { key: 'date', label: 'Date' },
    { key: 'user', label: 'User' }
  ], []);

  // Obtener usuario del contexto
  const { user } = useAuth();

  // Estados de carga
  const [dataLoaded, setDataLoaded] = useState(false);

  // Estados de datos
  const [items, setItems] = useState<Income[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);

  // Verificar si es admin usando el contexto
  const isAdmin = user?.role === 'admin';

  // Cargar transacciones
  useEffect(() => {
    if (!user) return;

    let isMounted = true;

    const loadTransactions = async () => {
      try {
        const data = await fetchJSON<IncomeListResponse>('/api/income', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!isMounted) return;

        if (!data || !Array.isArray(data.items)) {
          throw new Error('Formato de respuesta inválido');
        }

        const normalizedItems = data.items.map(normalizeIncome);
        setItems(normalizedItems);
        setDataError(null);
        setDataLoaded(true);
      } catch (e) {
        if (isMounted) {
          const errorMsg = e instanceof Error ? e.message : 'No se pudieron cargar las transacciones';
          setDataError(errorMsg);
          setItems([]);
          setDataLoaded(true);
        }
      }
    };

    loadTransactions();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Función para crear transacción - esta es la que usará el DataTable
  const handleTransactionSubmit = useCallback(async (data: any) => {
    if (!isAdmin) {
      throw new Error('No tienes permiso para crear transacciones.');
    }

    try {
      const payload = {
        concept: data.concept.trim(),
        amount: Number(data.amount),
        date: data.date,
      };

      const createdTransaction = await fetchJSON<CreateIncomeResponse>(
        '/api/income/create',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        }
      );

      const normalizedTransaction = normalizeIncome(createdTransaction);
      
      // Agregar la nueva transacción al inicio de la lista
      setItems((prevItems) => [normalizedTransaction, ...prevItems]);
      
    } catch (e) {
      const errorMessage = e instanceof Error
        ? e.message
        : 'No se pudo crear la transacción';
      throw new Error(errorMessage);
    }
  }, [isAdmin]);

  const tableData = useMemo(() => {
    return items.map(item => ({
      id: item.id,
      concept: item.concept,
      amount: item.amount,
      date: new Date(item.date).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      user: item.user?.name || item.user?.email || 'Unknown'
    }));
  }, [items]);

  // Esperar a que el contexto de auth cargue
  if (!user) {
    return (
      <div className='h-full flex items-center justify-center'>
        <p className='text-gray-500'>Verificando permisos...</p>
      </div>
    );
  }

  // Esperar a que carguen las transacciones
  if (!dataLoaded) {
    return (
      <div className='h-full flex items-center justify-center'>
        <p className='text-gray-500'>Cargando transacciones...</p>
      </div>
    );
  }

  return (
    <div className='h-full flex flex-col'>
      <div className='flex-1 px-6 overflow-hidden'>
        <div className='w-full h-full'>
          {dataError ? (
            <div className='flex flex-col items-center justify-center h-full gap-4'>
              <AlertCircle className='w-12 h-12 text-red-500' />
              <div className='text-center'>
                <p className='text-lg font-medium text-gray-900'>Error al cargar datos</p>
                <p className='text-sm text-gray-600 mt-2'>{dataError}</p>
              </div>
            </div>
          ) : ( 
            <DataTable
              title='Income and Expenses'
              columns={columns}
              data={tableData}
              addLabel={isAdmin ? 'New Income/Expense' : null}
              actions={false}
              fetchExecuted={handleTransactionSubmit}
            />
          )}
        </div>
      </div>
    </div>
  );
}