// context/transactions-context.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ============================================================================
// TIPOS
// ============================================================================

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

type TransactionsContextType = {
  transactions: Income[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  addTransaction: (transaction: Income) => void;
};

// ============================================================================
// CONTEXTO
// ============================================================================

const TransactionsContext = createContext<TransactionsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

export function TransactionsProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Función para cargar transacciones
  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/income', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const { items } = await response.json();
      setTransactions(items);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Error al cargar transacciones';
      console.error('[TransactionsContext] Error:', errorMsg);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Función para agregar transacción (optimistic update)
  const addTransaction = useCallback((transaction: Income) => {
    setTransactions((prev) => [transaction, ...prev]);
  }, []);

  const value = {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
    addTransaction,
  };

  return (
    <TransactionsContext.Provider value={value}>
      {children}
    </TransactionsContext.Provider>
  );
}

// ============================================================================
// HOOK PERSONALIZADO
// ============================================================================

export function useTransactions() {
  const context = useContext(TransactionsContext);
  if (context === undefined) {
    throw new Error('useTransactions debe usarse dentro de TransactionsProvider');
  }
  return context;
}

// ============================================================================
// EJEMPLO DE USO
// ============================================================================

/*
// 1. En tu layout o _app.tsx:
import { TransactionsProvider } from '@/context/transactions-context';

<TransactionsProvider>
  <YourApp />
</TransactionsProvider>

// 2. En Income page:
import { useTransactions } from '@/context/transactions-context';

export default function IncomePage() {
  const { transactions, isLoading, addTransaction } = useTransactions();
  
  return (
    <DataTable data={transactions} isLoading={isLoading} />
  );
}

// 3. En Reports page:
import { useTransactions } from '@/context/transactions-context';

export default function ReportsPage() {
  const { transactions, isLoading } = useTransactions();
  
  // ✅ Mismos datos que Income, sin petición extra
  return (
    <Chart data={transactions} />
  );
}
*/