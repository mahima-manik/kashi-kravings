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
import { useChartTheme } from '@/lib/useChartTheme';

interface SalesChartProps {
  data: DailySummary[];
}

export default function SalesChart({ data }: SalesChartProps) {
  const chart = useChartTheme();
  const chartData = data.slice(-14).map((item) => ({
    ...item,
    displayDate: formatDateShort(item.date),
  }));

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Trend (Last 14 Days)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 12, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <Tooltip
              formatter={(value: number) => [
                `₹${value.toLocaleString('en-IN')}`,
                'Revenue',
              ]}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                border: `1px solid ${chart.tooltipBorder}`,
                borderRadius: '8px',
                color: chart.tooltipText,
              }}
              labelStyle={{ color: chart.tooltipLabel }}
            />
            <Legend
              formatter={() => 'Revenue'}
              wrapperStyle={{ color: chart.axisText }}
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
