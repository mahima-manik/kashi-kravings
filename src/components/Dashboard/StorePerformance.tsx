'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StoreSummary } from '@/lib/types';

interface StorePerformanceProps {
  data: StoreSummary[];
}

function formatCurrency(amount: number): string {
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (amount >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return `₹${amount}`;
}

function shortenStoreName(name: string): string {
  if (name.length > 12) {
    return name.substring(0, 10) + '...';
  }
  return name;
}

export default function StorePerformance({ data }: StorePerformanceProps) {
  const chartData = data.map((store) => ({
    ...store,
    displayName: shortenStoreName(store.storeName),
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Performance</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              type="number"
              tickFormatter={formatCurrency}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e0e0e0' }}
            />
            <YAxis
              type="category"
              dataKey="displayName"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e0e0e0' }}
              width={80}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN')}`,
                name === 'totalRevenue' ? 'Revenue' : 'Collection',
              ]}
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              }}
            />
            <Legend
              formatter={(value) =>
                value === 'totalRevenue' ? 'Revenue' : 'Collection'
              }
            />
            <Bar dataKey="totalRevenue" fill="#8e4838" radius={[0, 4, 4, 0]} />
            <Bar dataKey="totalCollection" fill="#16a34a" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
