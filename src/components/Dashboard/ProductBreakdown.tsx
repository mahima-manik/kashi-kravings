'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ProductSummary } from '@/lib/types';

interface ProductBreakdownProps {
  data: ProductSummary[];
}

const COLORS = [
  '#8e4838', // chocolate-700
  '#b86d4f', // chocolate-500
  '#d6ae97', // chocolate-300
  '#e15f4e', // primary-500
  '#f5b3aa', // primary-300
  '#cd4331', // primary-600
  '#fad3cd', // primary-200
  '#ac3526', // primary-700
];

export default function ProductBreakdown({ data }: ProductBreakdownProps) {
  const chartData = data.map((product) => ({
    name: product.productName,
    value: product.totalUnits,
  }));

  const totalUnits = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Mix</h3>
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
              label={({ name, percent }) =>
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
                backgroundColor: '#fff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
              }}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              formatter={(value) => (
                <span className="text-sm text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
