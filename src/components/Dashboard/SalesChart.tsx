'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailySummary } from '@/lib/types';
import { formatCurrencyCompact, formatDateShort } from '@/lib/format';

interface SalesChartProps {
  data: DailySummary[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const chartData = data.slice(-14).map((item) => ({
    ...item,
    displayDate: formatDateShort(item.date),
  }));

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-white mb-4">Sales Trend (Last 14 Days)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              tickLine={false}
              axisLine={{ stroke: '#2a2a3a' }}
            />
            <Tooltip
              formatter={(value: number) => [
                `₹${value.toLocaleString('en-IN')}`,
                'Revenue',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend
              formatter={() => 'Revenue'}
              wrapperStyle={{ color: '#9ca3af' }}
            />
            <Line
              type="monotone"
              dataKey="totalRevenue"
              stroke="#A69A5B"
              strokeWidth={2}
              dot={{ fill: '#A69A5B', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
