'use client';

// npm i xlsx
import * as XLSX from 'xlsx';
import { useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  ChartAreaInteractive,
  ChartPoint,
} from '@/components/ui';
import { Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface TxUser {
  id: string;
  name: string;
  email: string;
}

interface Tx {
  id: string;
  concept: string;
  amount: number;
  date: string;
  user: TxUser;
}

// Helpers fecha (LOCAL)
const parseLocalYmd = (ymd: string): Date => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
};

export default function ReportsPage(): JSX.Element {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar transacciones del backend
  useEffect(() => {
    const ac = new AbortController();

    const loadTransactions = async (): Promise<void> => {
      try {
        setIsLoading(true);
        setError(null);
        const r = await fetch('/api/income', { signal: ac.signal });

        if (!r.ok) {
          throw new Error(`HTTP ${r.status}`);
        }

        const { items } = (await r.json()) as { items: unknown[] };

        const normalized: Tx[] = items.map((t: unknown) => {
          const transaction = t as Record<string, unknown>;
          return {
            id: String(transaction.id),
            concept: String(transaction.concept ?? ''),
            amount: Number(transaction.amount ?? 0),
            date: String(transaction.date ?? '').slice(0, 10), // YYYY-MM-DD (string)
            user: {
              id: String(
                (transaction.user as Record<string, unknown>)?.id ?? ''
              ),
              name: String(
                (transaction.user as Record<string, unknown>)?.name ?? ''
              ),
              email: String(
                (transaction.user as Record<string, unknown>)?.email ?? ''
              ),
            },
          };
        });

        setTxs(normalized);
      } catch (e: unknown) {
        const error = e as { name?: string };
        if (error?.name !== 'AbortError') {
          console.error('[reports] load error:', e);
          setError('No se pudieron cargar las transacciones');
        }
      } finally {
        if (!ac.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadTransactions();
    return () => {
      ac.abort();
    };
  }, []);

  // Totales
  const saldoActual = useMemo(
    () => txs.reduce((acc, t) => acc + t.amount, 0),
    [txs]
  );

  const totalIngresos = useMemo(
    () => txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    [txs]
  );

  const totalEgresosAbs = useMemo(
    () =>
      txs
        .filter((t) => t.amount < 0)
        .reduce((s, t) => s + Math.abs(t.amount), 0),
    [txs]
  );

  // Agregar por día
  const aggregatedByDay = useMemo<ChartPoint[]>(() => {
    const perDay = new Map<string, { income: number; expenses: number }>();

    for (const t of txs) {
      const d = t.date.slice(0, 10);
      const curr = perDay.get(d) ?? { income: 0, expenses: 0 };
      if (t.amount >= 0) {
        curr.income += t.amount;
      } else {
        curr.expenses += Math.abs(t.amount);
      }
      perDay.set(d, curr);
    }

    const days = Array.from(perDay.entries()).sort((a, b) =>
      a[0].localeCompare(b[0])
    );

    let running = 0;
    const out: ChartPoint[] = [];

    for (const [d, { income, expenses }] of days) {
      running += income - expenses;
      out.push({ date: d, income, expenses, balance: running });
    }

    return out;
  }, [txs]);

  // Densificar últimos N días para que siempre se lea bien
  const DENSE_DAYS = 90;
  const chartData = useMemo<ChartPoint[]>(() => {
    if (aggregatedByDay.length === 0) {
      return [];
    }

    const sorted = [...aggregatedByDay].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    const lastDate = parseLocalYmd(sorted[sorted.length - 1].date);
    const start = new Date(lastDate);
    start.setDate(start.getDate() - (DENSE_DAYS - 1));

    const byDate = new Map(sorted.map((p) => [p.date, p]));
    const prevBeforeStart = sorted
      .filter((p) => parseLocalYmd(p.date) < start)
      .pop();
    let running = prevBeforeStart?.balance ?? 0;

    const dense: ChartPoint[] = [];

    for (const d = new Date(start); d <= lastDate; d.setDate(d.getDate() + 1)) {
      const key = ymd(d);
      const p = byDate.get(key);

      if (p) {
        running = p.balance;
        dense.push({
          date: key,
          income: p.income,
          expenses: p.expenses,
          balance: running,
        });
      } else {
        dense.push({ date: key, income: 0, expenses: 0, balance: running });
      }
    }

    return dense;
  }, [aggregatedByDay]);

  // ---------- Descargar Excel (3 hojas) ----------
  const downloadExcel = (): void => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: KPIs
    const kpiData = [
      ['Metric', 'Value'],
      ['Current Balance', saldoActual],
      ['Total Income', totalIngresos],
      ['Total Expenses', totalEgresosAbs],
      ['Transactions', txs.length],
      ['Income tx', txs.filter((t) => t.amount > 0).length],
      ['Expense tx', txs.filter((t) => t.amount < 0).length],
    ];

    const wsKpi = XLSX.utils.aoa_to_sheet(kpiData);
    wsKpi['!cols'] = [{ wch: 22 }, { wch: 18 }];

    // formato moneda
    ['B2', 'B3', 'B4'].forEach((addr) => {
      if (wsKpi[addr]) {
        wsKpi[addr].z = '"$"#,##0';
      }
    });

    XLSX.utils.book_append_sheet(wb, wsKpi, 'KPIs');

    // Hoja 2: Resumen diario (gráfica)
    const dailyAoA = [
      ['Date', 'Income', 'Expenses', 'Balance'],
      ...chartData.map((r) => [
        parseLocalYmd(r.date),
        r.income,
        r.expenses,
        r.balance,
      ]),
    ];

    const wsDaily = XLSX.utils.aoa_to_sheet(dailyAoA);
    wsDaily['!cols'] = [{ wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
    wsDaily['!autofilter'] = { ref: `A1:D${dailyAoA.length}` };

    for (let r = 2; r <= dailyAoA.length; r++) {
      const A = `A${r}`;
      const B = `B${r}`;
      const C = `C${r}`;
      const D = `D${r}`;

      if (wsDaily[A]) {
        wsDaily[A].z = 'dd/mm/yyyy';
      }
      if (wsDaily[B]) {
        wsDaily[B].z = '"$"#,##0';
      }
      if (wsDaily[C]) {
        wsDaily[C].z = '"$"#,##0';
      }
      if (wsDaily[D]) {
        wsDaily[D].z = '"$"#,##0';
      }
    }

    XLSX.utils.book_append_sheet(wb, wsDaily, 'Resumen diario');

    // Hoja 3: Transacciones
    const txAoA = [
      ['Date', 'Concept', 'Amount', 'Type', 'User', 'Email'],
      ...txs.map((t) => [
        parseLocalYmd(t.date),
        t.concept,
        t.amount,
        t.amount >= 0 ? 'Income' : 'Expense',
        t.user.name,
        t.user.email,
      ]),
    ];

    const wsTx = XLSX.utils.aoa_to_sheet(txAoA);
    wsTx['!cols'] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 14 },
      { wch: 12 },
      { wch: 24 },
      { wch: 28 },
    ];
    wsTx['!autofilter'] = { ref: `A1:F${txAoA.length}` };

    for (let r = 2; r <= txAoA.length; r++) {
      const A = `A${r}`;
      const C = `C${r}`;

      if (wsTx[A]) {
        wsTx[A].z = 'dd/mm/yyyy';
      }
      if (wsTx[C]) {
        wsTx[C].z = '"$"#,##0';
      }
    }

    XLSX.utils.book_append_sheet(wb, wsTx, 'Transacciones');

    const fileName = `financial_report_${ymd(new Date())}.xlsx`;
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const incomeTransactions = txs.filter((t) => t.amount > 0);
  const expenseTransactions = txs.filter((t) => t.amount < 0);

  return (
    <div className='h-screen'>
      <div className='flex-1 overflow-auto p-6'>
        <div className='max-w-7xl mx-auto space-y-6'>
          {/* Header */}
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <h1 className='text-3xl font-bold text-gray-900'>
              Financial Reports
            </h1>
            <Button
              onClick={downloadExcel}
              className='bg-green-600 hover:bg-green-700'
              disabled={isLoading || Boolean(error)}
            >
              <Download className='mr-2 h-4 w-4' />
              Download Excel
            </Button>
          </div>

          {error && (
            <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
              {error}
            </div>
          )}

          {/* Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Current Balance
                </CardTitle>
                <DollarSign
                  className={`h-4 w-4 ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${saldoActual >= 0 ? 'text-green-600' : 'text-red-600'}`}
                >
                  {saldoActual >= 0 ? '+' : ''}
                  {formatCurrency(saldoActual)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {isLoading
                    ? 'Loading...'
                    : saldoActual >= 0
                      ? 'Profit'
                      : 'Loss'}{' '}
                  from all transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Income
                </CardTitle>
                <TrendingUp className='h-4 w-4 text-green-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-green-600'>
                  +{formatCurrency(totalIngresos)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {isLoading
                    ? 'Loading...'
                    : `From ${incomeTransactions.length} income transactions`}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Total Expenses
                </CardTitle>
                <TrendingDown className='h-4 w-4 text-red-600' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-red-600'>
                  -{formatCurrency(totalEgresosAbs)}
                </div>
                <p className='text-xs text-muted-foreground'>
                  {isLoading
                    ? 'Loading...'
                    : `From ${expenseTransactions.length} expense transactions`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <div className='w-full'>
            <ChartAreaInteractive data={chartData} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
