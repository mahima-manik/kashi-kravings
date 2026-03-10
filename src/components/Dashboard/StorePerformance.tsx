'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { SalesRecord } from '@/lib/types';
import { formatCurrencyCompact, formatCurrency } from '@/lib/format';
import { useChartTheme } from '@/lib/useChartTheme';

interface SalesByLocationProps {
  records: SalesRecord[];
}

export default function SalesByLocation({ records }: SalesByLocationProps) {
  const chart = useChartTheme();

  // Aggregate total sales per store
  const storeMap = new Map<string, number>();
  for (const record of records) {
    if (!record.storeName || record.saleValue <= 0) continue;
    storeMap.set(record.storeName, (storeMap.get(record.storeName) || 0) + record.saleValue);
  }

  const chartData = Array.from(storeMap.entries())
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales);

  if (chartData.length === 0) {
    return (
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">Sales by Outlet</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No sales data for selected period.</p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 45);

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Sales by Outlet</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Total sales per outlet for selected period</p>
      <div style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 80, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} horizontal={false} />
            <XAxis
              type="number"
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 12, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={120}
              tick={{ fontSize: 12, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), 'Sales']}
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                border: `1px solid ${chart.tooltipBorder}`,
                borderRadius: '8px',
                color: chart.tooltipText,
              }}
              labelStyle={{ color: chart.tooltipLabel }}
              cursor={{ fill: chart.cursorFill }}
            />
            <Bar dataKey="sales" fill="#A69A5B" radius={[0, 4, 4, 0]} barSize={24}>
              <LabelList
                dataKey="sales"
                position="right"
                formatter={(value: number) => formatCurrencyCompact(value)}
                style={{ fontSize: 11, fill: chart.axisText }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
