// components/screens/IncomeAndExpenses.tsx
'use client';

import { useEffect, useMemo, useState, useCallback, useTransition } from 'react';
import { AlertCircle } from 'lucide-react';
import { DataTable } from '../dataTable';
import { NewTransactionForm, type Income } from '@/components/income';

// ============================================================================
// DEFINICIÓN DE TIPOS
// ============================================================================

type FormData = {
  concept: string;
  amount: string;
  date: string;
};

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

// ============================================================================
// FUNCIONES HELPER PARA NORMALIZACIÓN DE DATOS
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

// ============================================================================
// FUNCIÓN HELPER PARA PETICIONES HTTP CON MEJOR MANEJO DE ERRORES
// ============================================================================

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  console.log(`🔄 Fetching: ${url}`);

  try {
    const response = await fetch(url, init);

    console.log(`📡 Response status for ${url}:`, response.status);

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      let errorDetails = '';

      try {
        const errorData = (await response.json()) as { error?: string; message?: string };
        errorDetails = errorData?.error || errorData?.message || '';
        if (errorDetails) message = errorDetails;
      } catch {
        // Si no puede parsear el JSON de error
        const text = await response.text();
        console.error(`❌ Error response text:`, text);
      }

      console.error(`❌ Request failed for ${url}:`, message);
      throw new Error(message);
    }

    const data = await response.json();
    console.log(`✅ Success for ${url}:`, data);
    return data as T;

  } catch (error) {
    console.error(`❌ Fetch error for ${url}:`, error);
    throw error;
  }
}

// ============================================================================
// HOOKS PERSONALIZADOS CON MEJOR MANEJO DE ERRORES
// ============================================================================

const useUserRole = () => {
  const [role, setRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchUserRole = async () => {
      try {
        const data = await fetchJSON<MeResponse>('/api/me', {
          signal: abortController.signal,
          credentials: 'include', // Importante para cookies de sesión
        });
        setRole(data.role);
        setError(null);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;

        const errorMsg = e instanceof Error ? e.message : 'Error al obtener rol';
        console.error('❌ Error fetching user role:', errorMsg);
        setError(errorMsg);
        setRole('user'); // Fallback a user
      }
    };

    fetchUserRole();

    return () => abortController.abort();
  }, []);

  return { role, error };
};

const useTransactions = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState<Income[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadTransactions = useCallback(async (signal?: AbortSignal) => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await fetchJSON<IncomeListResponse>('/api/income', {
        signal,
        credentials: 'include', // Importante para cookies de sesión
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Validar que items exista y sea un array
      if (!data || !Array.isArray(data.items)) {
        throw new Error('Formato de respuesta inválido');
      }

      const normalizedItems = data.items.map(normalizeIncome);
      setItems(normalizedItems);
      setError(null);

    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;

      const errorMsg = e instanceof Error ? e.message : 'No se pudieron cargar las transacciones';
      console.error('❌ Error loading transactions:', errorMsg);
      setError(errorMsg);
      setItems([]); // Array vacío en caso de error
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadTransactions(abortController.signal);

    return () => abortController.abort();
  }, [loadTransactions]);

  return { items, setItems, isLoading, error, setError, reload: loadTransactions };
};

const useCreateTransaction = (
  isAdmin: boolean,
  setItems: React.Dispatch<React.SetStateAction<Income[]>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createTransaction = useCallback(async (data: FormData) => {
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

      // Optimistic update
      const tempId = `temp-${Date.now()}`;
      const tempTransaction: Income = {
        id: tempId,
        concept: payload.concept,
        amount: payload.amount,
        date: payload.date,
        user: { id: '', name: 'You', email: '' }
      };

      setItems((prevItems) => [tempTransaction, ...prevItems]);

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

      // Reemplazar el temporal con el real
      setItems((prevItems) =>
        prevItems.map(item =>
          item.id === tempId ? normalizedTransaction : item
        )
      );

      return true;

    } catch (e: unknown) {
      // Revertir el optimistic update
      setItems((prevItems) =>
        prevItems.filter(item => !item.id.toString().startsWith('temp-'))
      );

      const errorMessage = e instanceof Error
        ? e.message
        : 'No se pudo crear la transacción';
      console.error('❌ Error creating transaction:', errorMessage);
      setError(errorMessage);
      return false;

    } finally {
      setIsSubmitting(false);
    }
  }, [isAdmin, setItems, setError]);

  return { createTransaction, isSubmitting };
};

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

  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { role, error: roleError } = useUserRole();
  const { items, setItems, isLoading, error, setError, reload } = useTransactions();
  const isAdmin = role === 'admin';

  const { createTransaction, isSubmitting } = useCreateTransaction(
    isAdmin,
    setItems,
    setError
  );

  const handleNewTransaction = useCallback(async (data: FormData) => {
    const success = await createTransaction(data);
    if (success) {
      setShowForm(false);
    }
  }, [createTransaction]);

  const handleOpenForm = useCallback(() => {
    startTransition(() => {
      setShowForm(true);
    });
  }, []);

  const handleCloseForm = useCallback(() => {
    startTransition(() => {
      setShowForm(false);
    });
  }, []);

  const handleRetry = useCallback(() => {
    reload();
  }, [reload]);

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

  return (
    <div className='h-full flex flex-col'>
      {/* Mostrar errores de rol */}
      {roleError && (
        <div className='mx-6 mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3'>
          <AlertCircle className='w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5' />
          <div className='flex-1'>
            <p className='text-sm font-medium text-yellow-800'>Advertencia al obtener permisos</p>
            <p className='text-sm text-yellow-700 mt-1'>{roleError}</p>
          </div>
        </div>
      )}

      {/* Tabla de datos */}
      <div className='flex-1 px-6 overflow-hidden'>
        <div className='w-full h-full'>
          {isLoading ? (
            <div className='flex items-center justify-center h-full'>
              <div className="animate-pulse">
                <p className='text-gray-500'>Cargando...</p>
              </div>
            </div>
          ) : error ? (
            <div className='flex flex-col items-center justify-center h-full gap-4'>
              <AlertCircle className='w-12 h-12 text-red-500' />
              <div className='text-center'>
                <p className='text-lg font-medium text-gray-900'>Error al cargar datos</p>
                <p className='text-sm text-gray-600 mt-2'>{error}</p>
              </div>
              <button onClick={handleRetry}>
                Reintentar
              </button>
            </div>
          ) : (
            <DataTable
              title='Income and Expenses'
              columns={columns}
              data={tableData}
            />
          )}
        </div>
      </div>

      {/* Modal de formulario */}
      {showForm && isAdmin && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <NewTransactionForm
            onSubmit={handleNewTransaction}
            onCancel={handleCloseForm}
            isLoading={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}