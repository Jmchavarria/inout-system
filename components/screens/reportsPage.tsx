'use client';

// npm i xlsx
import * as XLSX from 'xlsx';
import React, { useMemo, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import { useTransactions } from '@/context/transaction-context';

/* ===========================
   Types
=========================== */

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

interface ChartPoint {
  date: string;
  income: number;
  expenses: number;
  balance: number;
}

/* ===========================
   Date helpers (LOCAL SAFE)
=========================== */

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

/* ===========================
   UI Components
=========================== */

const Button = ({ onClick, className, disabled, children }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${className}`}
  >
    {children}
  </button>
);

const Card = ({ children }: any) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
    {children}
  </div>
);

const CardHeader = ({ children }: any) => (
  <div className="p-6">{children}</div>
);

const CardTitle = ({ children, className = '' }: any) => (
  <h3 className={className}>{children}</h3>
);

const CardContent = ({ children, className = '' }: any) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

/* ===========================
   Chart
=========================== */

const BalanceChart = ({ data }: { data: ChartPoint[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.date),
        datasets: [
          {
            label: 'Income',
            data: data.map((d) => d.income),
            backgroundColor: 'rgba(34,197,94,0.85)',
            borderRadius: 6,
            barThickness: 12,
          },
          {
            label: 'Expenses',
            data: data.map((d) => d.expenses),
            backgroundColor: 'rgba(239,68,68,0.85)',
            borderRadius: 6,
            barThickness: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: { usePointStyle: true },
          },
          tooltip: {
            callbacks: {
              label: (ctx) =>
                `${ctx.dataset.label}: ${new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0,
                }).format(ctx.parsed.y)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              autoSkip: true,
              maxTicksLimit: 15,
            },
          },
          y: {
            beginAtZero: true,
            ticks: {
              callback: (v) =>
                new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  notation: 'compact',
                }).format(v as number),
            },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return (
    <div className="relative h-96">
      <canvas ref={canvasRef} />
    </div>
  );
};

/* ===========================
   Page
=========================== */

export default function ReportsPage(): JSX.Element {
  const { transactions, isLoading, error } = useTransactions();

  /* ---------------------------
     Today (no future dates)
  --------------------------- */

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  /* ---------------------------
     Normalize + filter
  --------------------------- */

  const txs = useMemo<Tx[]>(() => {
    return transactions
      .map((t) => ({
        id: t.id,
        concept: t.concept,
        amount: t.amount,
        date: t.date.slice(0, 10),
        user: t.user,
      }))
      .filter((t) => parseLocalYmd(t.date) <= today);
  }, [transactions, today]);

  /* ---------------------------
     Totals
  --------------------------- */

  const totalIngresos = useMemo(
    () => txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    [txs]
  );

  const totalEgresosAbs = useMemo(
    () => txs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),
    [txs]
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value);

  /* ---------------------------
     Aggregate by day
  --------------------------- */

  const aggregatedByDay = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, { income: number; expenses: number }>();

    for (const t of txs) {
      const curr = map.get(t.date) ?? { income: 0, expenses: 0 };
      t.amount >= 0
        ? (curr.income += t.amount)
        : (curr.expenses += Math.abs(t.amount));
      map.set(t.date, curr);
    }

    let running = 0;

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, v]) => {
        running += v.income - v.expenses;
        return { date, ...v, balance: running };
      });
  }, [txs]);

  /* ---------------------------
     Dense last N days
  --------------------------- */

  const DENSE_DAYS = 90;

  const chartData = useMemo<ChartPoint[]>(() => {
    if (!aggregatedByDay.length) return [];

    const lastDataDate = parseLocalYmd(
      aggregatedByDay[aggregatedByDay.length - 1].date
    );

    const lastDate = new Date(
      Math.min(lastDataDate.getTime(), today.getTime())
    );

    const start = new Date(lastDate);
    start.setDate(start.getDate() - (DENSE_DAYS - 1));

    const byDate = new Map(aggregatedByDay.map((p) => [p.date, p]));
    let running = 0;

    return Array.from({ length: DENSE_DAYS }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = ymd(d);
      const p = byDate.get(key);
      if (p) running = p.balance;

      return {
        date: key,
        income: p?.income ?? 0,
        expenses: p?.expenses ?? 0,
        balance: running,
      };
    });
  }, [aggregatedByDay, today]);

  /* ===========================
     Render
  ============================ */

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Cargando reportes…</div>;
  }

  if (error) {
    return <div className="h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <Button className="bg-green-600 text-white">
          <Download className="h-4 w-4 mr-2" /> Download Excel
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            Income vs Expenses (Last {DENSE_DAYS} Days)
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                <TrendingUp className="h-4 w-4" />
                Total Income
              </div>
              <div className="mt-1 text-2xl font-bold text-green-700">
                {formatCurrency(totalIngresos)}
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                <TrendingDown className="h-4 w-4" />
                Total Expenses
              </div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {formatCurrency(totalEgresosAbs)}
              </div>
            </div>
          </div>

          {/* Chart */}
          <BalanceChart data={chartData} />
        </CardContent>
      </Card>
    </div>
  );
}
