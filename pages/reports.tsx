'use client';

import * as XLSX from 'xlsx';
import React, { useMemo, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Download, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
  period: string;
  income: number;
  expenses: number;
  balance: number;
}

/* ===========================
   Helpers
=========================== */

const formatMonth = (ym: string) =>
  new Intl.DateTimeFormat('es-CO', {
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${ym}-01`));

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(v);

/* ===========================
   CSV helpers (flatten)
=========================== */

const toExportRow = (t: Tx) => ({
  id: t.id ?? '',
  concept: t.concept ?? '',
  amount: t.amount ?? 0,
  date: t.date ?? '',
  user_id: t.user?.id ?? '',
  user_name: t.user?.name ?? '',
  user_email: t.user?.email ?? '',
  // opcional: guarda el objeto completo
  user_json: t.user ? JSON.stringify(t.user) : '',
});

/* ===========================
   UI helpers
=========================== */

const ChartContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="relative h-[360px] w-full">{children}</div>
);

const Button = ({
  onClick,
  disabled,
  className,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`inline-flex items-center px-4 py-2 rounded-md font-medium transition disabled:opacity-50 ${className ?? ''}`}
  >
    {children}
  </button>
);

/* ===========================
   Charts
=========================== */

const BalanceChart = ({ data }: { data: ChartPoint[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    chartRef.current?.destroy();

    const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expenses, Math.abs(d.balance))));

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: {
        labels: data.map((d) => formatMonth(d.period)),
        datasets: [
          {
            label: 'Income',
            data: data.map((d) => d.income),
            backgroundColor: 'rgba(34,197,94,0.85)',
            borderRadius: 8,
          },
          {
            label: 'Expenses',
            data: data.map((d) => d.expenses),
            backgroundColor: 'rgba(239,68,68,0.85)',
            borderRadius: 8,
          },
          {
            label: 'Balance',
            data: data.map((d) => d.balance),
            backgroundColor: 'rgba(59,130,246,0.85)',
            borderRadius: 8,
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
            labels: { usePointStyle: true, padding: 16 },
          },
          tooltip: {
            backgroundColor: '#111827',
            padding: 12,
            callbacks: {
              title: (ctx) => formatMonth(data[ctx[0].dataIndex].period),
              label: (ctx) => {
                const d = data[ctx.dataIndex];
                return [
                  `Income: ${formatCurrency(d.income)}`,
                  `Expenses: ${formatCurrency(d.expenses)}`,
                  `Balance: ${d.balance >= 0 ? '+' : '-'}${formatCurrency(Math.abs(d.balance))}`,
                ];
              },
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            suggestedMax: maxValue * 1.15,
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
    <ChartContainer>
      <canvas ref={canvasRef} />
    </ChartContainer>
  );
};

const BalanceLineChart = ({ data }: { data: ChartPoint[] }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;
    chartRef.current?.destroy();

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 360);
    gradient.addColorStop(0, 'rgba(59,130,246,0.25)');
    gradient.addColorStop(1, 'rgba(59,130,246,0)');

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map((d) => formatMonth(d.period)),
        datasets: [
          {
            label: 'Balance',
            data: data.map((d) => d.balance),
            borderColor: '#3b82f6',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
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
            backgroundColor: '#111827',
            padding: 12,
            callbacks: {
              label: (ctx) => `Balance: ${formatCurrency(ctx.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(0,0,0,0.04)' },
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
    <ChartContainer>
      <canvas ref={canvasRef} />
    </ChartContainer>
  );
};

/* ===========================
   Page
=========================== */

export default function ReportsPage(): JSX.Element {
  const { transactions } = useTransactions();

  /* ---------------------------
     Aggregate by month (last 6)
  --------------------------- */
  const chartData = useMemo<ChartPoint[]>(() => {
    const map = new Map<string, { income: number; expenses: number }>();

    transactions.forEach((t: Tx) => {
      const ym = t.date.slice(0, 7);
      const curr = map.get(ym) ?? { income: 0, expenses: 0 };
      t.amount >= 0 ? (curr.income += t.amount) : (curr.expenses += Math.abs(t.amount));
      map.set(ym, curr);
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([period, v]) => ({
        period,
        ...v,
        balance: v.income - v.expenses,
      }));
  }, [transactions]);

  /* ---------------------------
     Totals for cards (same period)
  --------------------------- */
  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, m) => {
        acc.income += m.income;
        acc.expenses += m.expenses;
        acc.balance += m.balance;
        return acc;
      },
      { income: 0, expenses: 0, balance: 0 },
    );
  }, [chartData]);

  const last = chartData.at(-1);

  const insight =
    last &&
    (last.balance >= 0
      ? `En ${formatMonth(last.period)} tus ingresos superaron tus gastos en ${formatCurrency(last.balance)}`
      : `En ${formatMonth(last.period)} gastaste ${formatCurrency(Math.abs(last.balance))} más de lo que ingresaste`);

  /* ---------------------------
     Export (Excel + CSV)
  --------------------------- */

  const handleDownloadExcel = () => {
    if (!transactions.length) return;

    const rows = transactions.map((t: Tx) => toExportRow(t));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    XLSX.writeFile(wb, 'financial_report.xlsx');
  };

  const escapeCsv = (value: any) => {
    const s = String(value ?? '');
    // Si contiene separador, comillas o saltos de línea, se envuelve en comillas y se escapan comillas
    if (/[;"\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const handleDownloadCSV = () => {
    if (!transactions.length) return;

    // Aplanamos user (NO user_json para evitar caos)
    const rows = transactions.map((t: Tx) => ({
      id: t.id ?? '',
      concept: t.concept ?? '',
      amount: t.amount ?? 0,
      date: t.date ?? '',
      user_id: t.user?.id ?? '',
      user_name: t.user?.name ?? '',
      user_email: t.user?.email ?? '',
    }));

    const headers = Object.keys(rows[0]);

    // Excel (es-CO) suele separar por ; => usamos ;
    const SEP = ';';

    const csv =
      '\ufeff' + // ✅ BOM UTF-8 para Excel
      headers.join(SEP) +
      '\r\n' +
      rows
        .map((row) => headers.map((h) => escapeCsv((row as any)[h])).join(SEP))
        .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'financial_report.csv';
    a.click();

    URL.revokeObjectURL(url);
  };


  /* ===========================
     Render
  ============================ */

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-3xl font-bold">Financial Reports</h1>

        <div className="flex gap-2">
          <Button
            onClick={handleDownloadExcel}
            disabled={!transactions.length}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>

          <Button
            onClick={handleDownloadCSV}
            disabled={!transactions.length}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-green-50 p-6">
          <TrendingUp className="text-green-600 mb-2" />
          <p className="text-sm text-green-700">Income</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totals.income)}</p>
        </div>

        <div className="rounded-xl border bg-red-50 p-6">
          <TrendingDown className="text-red-600 mb-2" />
          <p className="text-sm text-red-700">Expenses</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totals.expenses)}</p>
        </div>

        <div className="rounded-xl border bg-blue-50 p-6">
          <Wallet className="text-blue-600 mb-2" />
          <p className="text-sm text-blue-700">Balance</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totals.balance)}</p>
        </div>
      </div>

      {last && <p className="text-sm text-gray-600">{insight}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
          <BalanceChart data={chartData} />
        </div>

        <div className="bg-white rounded-xl border shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Balance Evolution</h3>
          <BalanceLineChart data={chartData} />
        </div>
      </div>
    </div>
  );
}
