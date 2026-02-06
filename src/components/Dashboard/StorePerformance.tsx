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

interface SalesByLocationProps {
  data: StoreSummary[];
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(0)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(0)}K`;
  }
  return `₹${amount}`;
}

export default function SalesByLocation({ data }: SalesByLocationProps) {
  const chartData = data
    .map((store) => ({
      name: store.storeName,
      sales: store.totalRevenue,
    }))
    .sort((a, b) => b.sales - a.sales);

  return (
    <div className="bg-[#1a1a24] rounded-xl border border-[#2a2a3a] p-6">
      <h3 className="text-base font-semibold text-white mb-6">Sales by Location</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2a2a3a"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
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
              cursor={{ fill: 'rgba(124, 92, 252, 0.1)' }}
            />
            <Bar
              dataKey="sales"
              fill="#7c5cfc"
              radius={[0, 4, 4, 0]}
              barSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
