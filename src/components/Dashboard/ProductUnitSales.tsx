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
import { useChartTheme } from '@/lib/useChartTheme';

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
  const chart = useChartTheme();

  const chartData = PRODUCT_FIELDS.map(({ key, label }) => ({
    name: label,
    units: records.reduce((sum, r) => sum + (r[key] as number), 0),
  })).sort((a, b) => b.units - a.units);

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Unit Sales by Product</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value: number) => [
                `${value.toLocaleString('en-IN')} units`,
                'Units Sold',
              ]}
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                border: `1px solid ${chart.tooltipBorder}`,
                borderRadius: '8px',
                color: chart.tooltipText,
              }}
              labelStyle={{ color: chart.tooltipLabel }}
              cursor={{ fill: chart.cursorFill }}
            />
            <Bar dataKey="units" fill="#A69A5B" radius={[4, 4, 0, 0]} barSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
