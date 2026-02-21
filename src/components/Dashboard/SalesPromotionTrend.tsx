'use client';

import {
  ComposedChart,
  Line,
  Bar,
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

interface SalesPromotionTrendProps {
  data: DailySummary[];
}

export default function SalesPromotionTrend({ data }: SalesPromotionTrendProps) {
  const chart = useChartTheme();

  const chartData = data.map((item) => ({
    ...item,
    displayDate: formatDateShort(item.date),
  }));

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
        Sales & Promotion Trend
      </h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        Correlating daily sales value with TSO deployment and sampling activity
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 11, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <YAxis
              yAxisId="sales"
              tickFormatter={formatCurrencyCompact}
              tick={{ fontSize: 11, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
            />
            <YAxis
              yAxisId="promo"
              orientation="right"
              tick={{ fontSize: 11, fill: chart.axisText }}
              tickLine={false}
              axisLine={{ stroke: chart.grid }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: chart.tooltipBg,
                border: `1px solid ${chart.tooltipBorder}`,
                borderRadius: '8px',
                color: chart.tooltipText,
              }}
              labelStyle={{ color: chart.tooltipLabel }}
              formatter={(value: number, name: string) => {
                if (name === 'Sales Value') return [`₹${value.toLocaleString('en-IN')}`, name];
                return [value.toLocaleString('en-IN'), name];
              }}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: chart.axisText }}
            />
            <Line
              yAxisId="sales"
              type="monotone"
              dataKey="totalRevenue"
              name="Sales Value"
              stroke="#A69A5B"
              strokeWidth={2}
              dot={{ fill: '#A69A5B', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 6 }}
            />
            <Bar
              yAxisId="promo"
              dataKey="totalTSOs"
              name="TSOs"
              fill="#3b82f6"
              opacity={0.6}
              radius={[2, 2, 0, 0]}
              barSize={12}
            />
            <Line
              yAxisId="promo"
              type="monotone"
              dataKey="totalSampleConsumed"
              name="Samples Consumed"
              stroke="#16a34a"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#16a34a', strokeWidth: 2, r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
