'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProductSummary } from '@/lib/types';

interface ProductBreakdownProps {
  data: ProductSummary[];
}

const COLORS = [
  '#A69A5B', // brand gold
  '#8B7D3C', // brand olive
  '#d6ae97', // chocolate-300
  '#b86d4f', // chocolate-500
  '#8e4838', // chocolate-700
  '#F5E6C8', // brand cream
  '#c4886c', // chocolate-400
  '#5f332b', // chocolate-900
];

export default function ProductBreakdown({ data }: ProductBreakdownProps) {
  const chartData = data.map((product) => ({
    name: product.productName,
    value: product.totalUnits,
  }));

  const totalUnits = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-white mb-4">Product Mix</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
              }
              labelLine={false}
            >
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value.toLocaleString('en-IN')} units (${((value / totalUnits) * 100).toFixed(1)}%)`,
                name,
              ]}
              contentStyle={{
                backgroundColor: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: '#fff',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
