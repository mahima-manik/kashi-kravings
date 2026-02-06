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
import { StoreSummary } from '@/lib/types';
import { formatCurrencyCompact } from '@/lib/format';

interface SalesByLocationProps {
  data: StoreSummary[];
}

export default function SalesByLocation({ data }: SalesByLocationProps) {
  const chartData = data
    .map((store) => ({
      name: store.storeName,
      sales: store.totalRevenue,
    }))
    .sort((a, b) => b.sales - a.sales);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-white mb-6">Sales by Location</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
              width={110}
            />
            <Tooltip
              formatter={(value: number) => [
                `₹${value.toLocaleString('en-IN')}`,
                'Sales',
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
            <Bar dataKey="sales" fill="#A69A5B" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
