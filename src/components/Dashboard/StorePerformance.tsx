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
import { SalesRecord } from '@/lib/types';
import { formatCurrencyCompact } from '@/lib/format';

interface SalesByLocationProps {
  records: SalesRecord[];
}

const STORE_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
  '#A69A5B', '#5BA6A6', '#A65B5B', '#5B7AA6', '#8B5BA6',
  '#5BA66A', '#A6835B', '#6A5BA6', '#A65B8B', '#5BA694',
];

function getStoreColor(storeName: string): string {
  if (!STORE_COLORS[storeName]) {
    const idx = Object.keys(STORE_COLORS).length % COLOR_PALETTE.length;
    STORE_COLORS[storeName] = COLOR_PALETTE[idx];
  }
  return STORE_COLORS[storeName];
}

function formatDateLabel(dateStr: string): string {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(day)}/${parseInt(month)}`;
}

export default function SalesByLocation({ records }: SalesByLocationProps) {
  // Aggregate daily sales per store
  const dailyStoreMap = new Map<string, Map<string, number>>();
  const storeNames = new Set<string>();

  for (const record of records) {
    if (!record.date || !record.storeName) continue;
    storeNames.add(record.storeName);

    let dateMap = dailyStoreMap.get(record.date);
    if (!dateMap) {
      dateMap = new Map();
      dailyStoreMap.set(record.date, dateMap);
    }
    dateMap.set(record.storeName, (dateMap.get(record.storeName) || 0) + record.saleValue);
  }

  const sortedDates = Array.from(dailyStoreMap.keys()).sort();
  const sortedStores = Array.from(storeNames).sort();

  const chartData = sortedDates.map((date) => {
    const entry: Record<string, string | number> = {
      date,
      dateLabel: formatDateLabel(date),
    };
    const dateMap = dailyStoreMap.get(date)!;
    for (const store of sortedStores) {
      entry[store] = dateMap.get(store) || 0;
    }
    return entry;
  });

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-white mb-6">Sales by Location</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
            <XAxis
              dataKey="dateLabel"
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
              labelFormatter={(_label, payload) => {
                const dateStr = payload?.[0]?.payload?.date;
                if (dateStr) {
                  const [y, m, d] = dateStr.split('-');
                  return new Date(Number(y), Number(m) - 1, Number(d))
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                }
                return _label;
              }}
              formatter={(value: number, name: string) => [
                `₹${value.toLocaleString('en-IN')}`,
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
              wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            />
            {sortedStores.map((store) => (
              <Line
                key={store}
                type="monotone"
                dataKey={store}
                stroke={getStoreColor(store)}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
