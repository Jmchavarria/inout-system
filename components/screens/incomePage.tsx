// components/screens/IncomeAndExpenses.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { DataTable } from '@/components/dataTable';
import { NewTransactionForm, columns, type Income } from '@/components/income';
import { Button } from '@/components/ui';

type FormData = { concept: string; amount: string; date: string };
type Role = 'admin' | 'user';

type MeResponse = { role: Role };

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

type IncomeListResponse = { items: IncomeApi[] };
type CreateIncomeResponse = IncomeApi;

// Función helper para normalizar strings
const normalizeString = (value: string | null | undefined): string => {
  return value ?? '';
};

// Función helper para normalizar números
const normalizeNumber = (value: number | string | null | undefined): number => {
  return Number(value ?? 0);
};

// Función helper para normalizar fechas
const normalizeDate = (date: string | null | undefined): string => {
  return (date ?? '').slice(0, 10);
};

// Función helper para normalizar usuario
const normalizeUser = (user: IncomeApi['user']) => ({
  id: String(user?.id ?? ''),
  name: normalizeString(user?.name),
  email: normalizeString(user?.email),
});

// Función principal de normalización simplificada
function normalizeIncome(t: IncomeApi): Income {
  return {
    id: String(t.id ?? ''),
    concept: normalizeString(t.concept),
    amount: normalizeNumber(t.amount),
    date: normalizeDate(t.date),
    user: normalizeUser(t.user),
  };
}

// Función helper para hacer peticiones HTTP
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errorData = (await response.json()) as { error?: string };
      if (errorData?.error) message = errorData.error;
    } catch {
      // Ignorar errores de parsing del JSON de error
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

// Hook personalizado para manejar el rol del usuario
const useUserRole = () => {
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchUserRole = async () => {
      try {
        const data = await fetchJSON<MeResponse>('/api/me', {
          signal: abortController.signal,
        });
        setRole(data.role);
      } catch {
        // Por defecto asignar rol de usuario si no se puede determinar
        setRole('user');
      }
    };

    fetchUserRole();
    return () => abortController.abort();
  }, []);

  return role;
};

// Hook personalizado para manejar las transacciones
const useTransactions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Income[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchJSON<IncomeListResponse>('/api/income', {
        signal,
      });
      const normalizedItems = data.items.map(normalizeIncome);
      setItems(normalizedItems);
    } catch (e: unknown) {
      // Ignorar si es aborto explícito
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError('No se pudieron cargar las transacciones');
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    loadTransactions(abortController.signal);
    return () => abortController.abort();
  }, []);

  return { items, setItems, isLoading, error, setError };
};

// Hook personalizado para crear transacciones
const useCreateTransaction = (
  isAdmin: boolean,
  setItems: React.Dispatch<React.SetStateAction<Income[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTransaction = async (data: FormData) => {
    if (!isAdmin) {
      setError('No tienes permiso para crear transacciones.');
      return false;
    }

    setIsSubmitting(true);
    setError(null);

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
          body: JSON.stringify(payload),
        }
      );

      const normalizedTransaction = normalizeIncome(createdTransaction);
      setItems((prevItems) => [normalizedTransaction, ...prevItems]);
      return true;
    } catch (e: unknown) {
      const errorMessage =
        e instanceof Error ? e.message : 'No se pudo crear la transacción';
      setError(errorMessage);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTransaction, isSubmitting };
};

export default function IncomeAndExpenses() {
  const [showForm, setShowForm] = useState(false);
  const role = useUserRole();
  const { items, setItems, isLoading, error, setError } = useTransactions();
  const isAdmin = role === 'admin';

  const { createTransaction, isSubmitting } = useCreateTransaction(
    isAdmin,
    setItems,
    setError
  );

  const handleNewTransaction = async (data: FormData) => {
    const success = await createTransaction(data);
    if (success) {
      setShowForm(false);
    }
  };

  // Memorizar las acciones del header para evitar re-renders innecesarios
  const headerActions = useMemo(
    () =>
      isAdmin ? (
        <Button onClick={() => setShowForm(true)} disabled={isLoading}>
          <Plus className='mr-2 h-4 w-4' />
          New
        </Button>
      ) : null,
    [isAdmin, isLoading]
  );

  return (
    <div className='flex h-screen'>
      <div className='flex-1 overflow-auto p-6'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-3xl font-bold'>Income and expenses</h2>
        </div>

        {error && (
          <div
            role='alert'
            className='mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
          >
            {error}
          </div>
        )}

        <div className='max-w-7xl mx-auto'>
          <DataTable
            columns={columns}
            data={items}
            showFinancialSummary
            isLoading={isLoading}
            headerActions={headerActions}
          />
        </div>

        {showForm && isAdmin && (
          <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
            <NewTransactionForm
              onSubmit={handleNewTransaction}
              onCancel={() => setShowForm(false)}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
