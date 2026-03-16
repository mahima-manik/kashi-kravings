'use client';

import { useState, useMemo } from 'react';
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

type DOWFilter = 'all' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const DOW_OPTIONS: DOWFilter[] = ['all', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

export default function SalesByLocation({ records }: SalesByLocationProps) {
  const chart = useChartTheme();
  const [dowFilter, setDowFilter] = useState<DOWFilter>('all');

  // Filter records by day of week first
  const filteredRecords = useMemo(() => {
    if (dowFilter === 'all') return records;
    return records.filter(record => getDayOfWeek(record.date) === dowFilter);
  }, [records, dowFilter]);

  // Aggregate total sales per store from filtered records
  const chartData = useMemo(() => {
    const storeMap = new Map<string, number>();
    for (const record of filteredRecords) {
      if (!record.storeName || record.saleValue <= 0) continue;
      storeMap.set(record.storeName, (storeMap.get(record.storeName) || 0) + record.saleValue);
    }

    return Array.from(storeMap.entries())
      .map(([name, sales]) => ({ name, sales }))
      .sort((a, b) => b.sales - a.sales);
  }, [filteredRecords]);

  if (chartData.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sales by Outlet</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">Filter by:</span>
            <select
              value={dowFilter}
              onChange={e => setDowFilter(e.target.value as DOWFilter)}
              className="text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              {DOW_OPTIONS.map(day => (
                <option key={day} value={day}>{day === 'all' ? 'All Days' : day}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">No sales data for selected {dowFilter === 'all' ? 'period' : dowFilter}.</p>
      </div>
    );
  }

  const chartHeight = Math.max(200, chartData.length * 45);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">Sales by Outlet</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">Filter by:</span>
          <select
            value={dowFilter}
            onChange={e => setDowFilter(e.target.value as DOWFilter)}
            className="text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
          >
            {DOW_OPTIONS.map(day => (
              <option key={day} value={day}>{day === 'all' ? 'All Days' : day}</option>
            ))}
          </select>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Total sales per outlet {dowFilter === 'all' ? 'for selected period' : `on ${dowFilter}s`}
      </p>
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
