'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SalesRecord } from '@/lib/types';

interface ProductUnitSalesProps {
  records: SalesRecord[];
}

const PRODUCT_FIELDS: { key: keyof SalesRecord; label: string }[] = [
  { key: 'paanL', label: 'Paan (L)' },
  { key: 'thandaiL', label: 'Thandai (L)' },
  { key: 'giloriL', label: 'Gilori (L)' },
  { key: 'paanS', label: 'Paan (S)' },
  { key: 'thandaiS', label: 'Thandai (S)' },
  { key: 'giloriS', label: 'Gilori (S)' },
  { key: 'heritageBox9', label: 'Heritage (9)' },
  { key: 'heritageBox15', label: 'Heritage (15)' },
];

export default function ProductUnitSales({ records }: ProductUnitSalesProps) {
  const chartData = PRODUCT_FIELDS.map(({ key, label }) => ({
    name: label,
    units: records.reduce((sum, r) => sum + (r[key] as number), 0),
  })).sort((a, b) => b.units - a.units);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-white mb-6">Unit Sales by Product</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString('en-IN')} units`,
                'Units Sold',
              ]}
              contentStyle={{
                backgroundColor: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
              cursor={{ fill: 'rgba(139, 125, 60, 0.1)' }}
            />
            <Bar dataKey="units" fill="#A69A5B" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
