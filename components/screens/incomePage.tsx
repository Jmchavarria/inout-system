// components/screens/IncomeAndExpenses.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
// CAMBIO: Importa el nuevo DataTable personalizado
import { DataTable } from '../dataTable';
import { NewTransactionForm, type Income } from '@/components/income';
import { Button } from '@/components/ui';

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
// DEFINICIÓN DE COLUMNAS PARA EL NUEVO DATATABLE
// ============================================================================

// Define las columnas en el formato del nuevo DataTable
const columns = [
  {
    id: 'date',
    header: 'Date',
    accessorKey: 'date',
    cell: ({ value }: { value: string }) => {
      // Formatea la fecha
      return new Date(value).toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  },
  {
    id: 'concept',
    header: 'Concept',
    accessorKey: 'concept',
  },
  {
    id: 'amount',
    header: 'Amount',
    accessorKey: 'amount',
    cell: ({ value }: { value: number }) => {
      // Formatea el monto como moneda
      const formatted = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
      }).format(Math.abs(value));
      
      // Colorea según sea ingreso o gasto
      return (
        <span className={value >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {value >= 0 ? '+' : '-'}{formatted}
        </span>
      );
    }
  },
  {
    id: 'user',
    header: 'User',
    accessorKey: 'user',
    cell: ({ value }: { value: Income['user'] }) => {
      return value?.name || value?.email || 'Unknown';
    }
  }
];

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
// FUNCIÓN HELPER PARA PETICIONES HTTP
// ============================================================================

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    
    try {
      const errorData = (await response.json()) as { error?: string };
      if (errorData?.error) message = errorData.error;
    } catch {
      // Si no puede parsear el JSON de error, usa el mensaje por defecto
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

// ============================================================================
// HOOKS PERSONALIZADOS
// ============================================================================

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
        setRole('user');
      }
    };

    fetchUserRole();
    
    return () => abortController.abort();
  }, []);

  return role;
};

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
      const errorMessage = e instanceof Error 
        ? e.message 
        : 'No se pudo crear la transacción';
      setError(errorMessage);
      return false;
      
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createTransaction, isSubmitting };
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

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
    <div className='h-full flex flex-col'>
      
      <div className='flex-shrink-0 px-6 py-4 border-b bg-white'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold text-gray-900'>Income and expenses</h2>
          {headerActions}
        </div>
        
        {error && (
          <div
            role='alert'
            className='mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'
          >
            {error}
          </div>
        )}
      </div>

      <div className='flex-1 px-6 py-4 overflow-hidden'>
        <div className='w-full h-full'>
          {/* CAMBIO: Usa el nuevo DataTable con las propiedades correctas */}
          <DataTable
            columns={columns}              // Las columnas definidas arriba
            data={items}                   // Los datos normalizados
            showFinancialSummary={true}    // Muestra el resumen financiero
            totalField="amount"            // Campo para calcular totales
            isLoading={isLoading}          // Estado de carga
            pageSize={10}                  // Tamaño de página (ajusta según necesites)
            // headerActions se maneja en el header principal, no aquí
          />
        </div>
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
  );
}