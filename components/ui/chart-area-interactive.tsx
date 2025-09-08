'use client';

import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Brush,
} from 'recharts';

export type ChartPoint = {
  date: string;
  income: number;
  expenses: number;
  balance: number;
};

// Helpers fecha (LOCAL, sin UTC shift)
const parseLocalYmd = (ymd: string) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const formatMMMdd = (ymd: string) =>
  parseLocalYmd(ymd).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
  });

export function ChartAreaInteractive({
  data,
  isLoading = false,
  maxXTicks = 12,
  syncId,
}: {
  data: ChartPoint[];
  isLoading?: boolean;
  maxXTicks?: number;
  syncId?: string;
}) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.date.localeCompare(b.date)),
    [data]
  );

  const ticks = useMemo(() => {
    const n = sorted.length;
    if (n <= maxXTicks) return sorted.map((d) => d.date);
    const step = Math.ceil(n / maxXTicks);
    const out: string[] = [];
    for (let i = 0; i < n; i += step) out.push(sorted[i].date);
    if (out[out.length - 1] !== sorted[n - 1].date)
      out.push(sorted[n - 1].date);
    return out;
  }, [sorted, maxXTicks]);

  const formatCOP = (n: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(n);

  if (!isLoading && sorted.length === 0) {
    return (
      <div className='relative rounded-xl border bg-white p-6'>
        <div className='h-[320px] w-full flex items-center justify-center text-sm text-gray-500'>
          No data to show
        </div>
      </div>
    );
  }

  return (
    <div className='relative rounded-xl border bg-white p-3 md:p-4'>
      {isLoading && (
        <div className='absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-[2px]'>
          <div className='h-4 w-4 animate-spin rounded-full border-b-2 border-gray-600' />
        </div>
      )}

      <div className='h-[320px] w-full'>
        <ResponsiveContainer width='100%' height='100%'>
          <ComposedChart
            data={sorted}
            syncId={syncId}
            margin={{ top: 10, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray='3 3' />
            <XAxis
              dataKey='date'
              ticks={ticks}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={16}
              tickFormatter={(v) => formatMMMdd(String(v))}
            />
            <YAxis width={90} tickFormatter={(v) => formatCOP(Number(v))} />
            <Tooltip
              formatter={(val: number, name: string) => [formatCOP(val), name]}
              labelFormatter={(label) => `Fecha: ${formatMMMdd(String(label))}`}
            />
            <Legend />

            {/* Barras: claridad inmediata */}
            <Bar
              dataKey='expenses'
              name='Egresos'
              fill='#dc2626'
              radius={[4, 4, 0, 0]}
              barSize={16}
            />
            <Bar
              dataKey='income'
              name='Ingresos'
              fill='#16a34a'
              radius={[4, 4, 0, 0]}
              barSize={16}
            />

            {/* Línea de balance acumulado */}
            <Line
              type='monotoneX'
              dataKey='balance'
              name='Balance acumulado'
              stroke='#2563eb'
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />

            <Brush
              dataKey='date'
              height={18}
              stroke='#e5e7eb'
              travellerWidth={8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
