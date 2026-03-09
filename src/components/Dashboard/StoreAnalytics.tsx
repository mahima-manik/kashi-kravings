'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import type { DailySales } from '@/lib/types';
import {
  computeDailyMetrics,
  computeWeeklyMetrics,
  getDOWName,
  DEFAULT_COSTS,
  type CostParams,
} from '@/lib/analytics';
import { formatCurrency, formatCurrencyCompact } from '@/lib/format';
import { useChartTheme } from '@/lib/useChartTheme';
import MetricCard from '@/components/Dashboard/MetricCard';

interface StoreAnalyticsProps {
  dailySales: DailySales[];
}

const LS_KEY = 'kk-analytics-costs';

type TimeRange = '7d' | '14d' | '30d' | 'all';
type DOWFilter = 'all' | 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
const DOW_OPTIONS: DOWFilter[] = ['all', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TIME_RANGES: { value: TimeRange; label: string }[] = [
  { value: '7d', label: '7d' },
  { value: '14d', label: '14d' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All' },
];

function loadCosts(): CostParams {
  if (typeof window === 'undefined') return DEFAULT_COSTS;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const tsoCostPerDay = Number(parsed.tsoCostPerDay);
      const sampleCostPerUnit = Number(parsed.sampleCostPerUnit);
      return {
        tsoCostPerDay: tsoCostPerDay > 0 ? tsoCostPerDay : DEFAULT_COSTS.tsoCostPerDay,
        sampleCostPerUnit: sampleCostPerUnit > 0 ? sampleCostPerUnit : DEFAULT_COSTS.sampleCostPerUnit,
      };
    }
  } catch { /* ignore */ }
  return DEFAULT_COSTS;
}

function formatDateShortLocal(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${months[m - 1]}`;
}

export default function StoreAnalytics({ dailySales }: StoreAnalyticsProps) {
  const chart = useChartTheme();
  const [costs, setCosts] = useState<CostParams>(DEFAULT_COSTS);
  const [timeRange, setTimeRange] = useState<TimeRange>('14d');
  const [dowFilter, setDowFilter] = useState<DOWFilter>('all');

  // Load from localStorage on mount
  useEffect(() => {
    setCosts(loadCosts());
  }, []);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(costs));
    } catch { /* ignore */ }
  }, [costs]);

  // All days with TSOs (for DOW baseline across full history)
  const allTSODays = useMemo(() => dailySales.filter(d => d.numTSO > 0), [dailySales]);

  // Filter by time range
  const filteredSales = useMemo(() => {
    if (timeRange === 'all') return allTSODays;
    const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
    const sorted = [...allTSODays].sort((a, b) => b.date.localeCompare(a.date));
    return sorted.slice(0, days);
  }, [allTSODays, timeRange]);

  const dailyMetrics = useMemo(() => computeDailyMetrics(filteredSales, costs, allTSODays), [filteredSales, costs, allTSODays]);
  const weeklyMetrics = useMemo(() => computeWeeklyMetrics(filteredSales, costs), [filteredSales, costs]);

  // Chart data: ascending order
  const chartDaily = useMemo(() => {
    const tsoMap = new Map(filteredSales.map(d => [d.date, d.numTSO]));
    const sorted = [...dailyMetrics].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.map(d => ({
      ...d,
      dayName: getDOWName(d.date),
      dateLabel: formatDateShortLocal(d.date),
      numTSO: tsoMap.get(d.date) ?? 0,
    }));
  }, [dailyMetrics, filteredSales]);

  const chartFiltered = useMemo(() => {
    if (dowFilter === 'all') return chartDaily;
    return chartDaily.filter(d => d.dayName === dowFilter);
  }, [chartDaily, dowFilter]);

  // Averages for summary cards (respects DOW filter)
  const avgNetReturn = chartFiltered.length > 0
    ? chartFiltered.reduce((s, d) => s + d.netReturn, 0) / chartFiltered.length
    : 0;
  const salesPerTSOValues = chartFiltered.filter(d => d.salesPerTSO !== null);
  const avgSalesPerTSO = salesPerTSOValues.length > 0
    ? salesPerTSOValues.reduce((s, d) => s + d.salesPerTSO!, 0) / salesPerTSOValues.length
    : null;
  const dowValues = chartFiltered.filter(d => d.dowBaseline !== null);
  const sampleConvValues = chartFiltered.filter(d => d.sampleConversion !== null);
  const avgSampleConv = sampleConvValues.length > 0
    ? sampleConvValues.reduce((s, d) => s + d.sampleConversion!, 0) / sampleConvValues.length
    : null;

  // Best performing weekday — based on ALL data (not DOW-filtered)
  const bestPerformingDay = useMemo(() => {
    const dowSums = new Map<string, { total: number; count: number }>();
    for (const d of chartDaily) {
      const existing = dowSums.get(d.dayName);
      if (existing) {
        existing.total += d.netReturn;
        existing.count += 1;
      } else {
        dowSums.set(d.dayName, { total: d.netReturn, count: 1 });
      }
    }
    let bestDay = '';
    let bestAvg = -Infinity;
    dowSums.forEach(({ total, count }, day) => {
      const avg = total / count;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestDay = day;
      }
    });
    return bestDay ? { day: bestDay, avg: bestAvg } : null;
  }, [chartDaily]);

  if (dailySales.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
        No sales data available for analytics.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls: Time Range + Cost Parameters */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-4">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Period</label>
            <div className="flex rounded-lg border border-surface-border overflow-hidden">
              {TIME_RANGES.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTimeRange(value)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    timeRange === value
                      ? 'bg-brand-gold text-white'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              TSO Cost/Day
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
              <input
                type="number"
                min={0.01}
                step={50}
                value={costs.tsoCostPerDay}
                onChange={e => {
                  const value = Number(e.target.value);
                  setCosts(c => ({ ...c, tsoCostPerDay: value > 0 ? value : DEFAULT_COSTS.tsoCostPerDay }));
                }}
                className="w-24 text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              Sample Cost/Unit
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">₹</span>
              <input
                type="number"
                min={0.01}
                step={0.1}
                value={costs.sampleCostPerUnit}
                onChange={e => {
                  const value = Number(e.target.value);
                  setCosts(c => ({ ...c, sampleCostPerUnit: value > 0 ? value : DEFAULT_COSTS.sampleCostPerUnit }));
                }}
                className="w-24 text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Daily Metrics Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Net Return"
          value={formatCurrency(Math.round(avgNetReturn))}
          warn={avgNetReturn < 0}
        />
        <MetricCard
          label="Avg Sales/TSO"
          value={avgSalesPerTSO !== null ? formatCurrency(Math.round(avgSalesPerTSO)) : 'N/A'}
        />
        <MetricCard
          label="Avg Sample Conversion"
          value={avgSampleConv !== null ? `₹${Math.round(avgSampleConv)}/sample` : 'N/A'}
        />
        <MetricCard
          label="Best Day"
          value={bestPerformingDay ? bestPerformingDay.day : 'N/A'}
          subtitle={bestPerformingDay ? `Avg ${formatCurrency(Math.round(bestPerformingDay.avg))} net` : undefined}
        />
      </div>

      {/* Daily Net Return Chart */}
      {chartDaily.length > 0 && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                Daily Net Return{timeRange !== 'all' ? ` (Last ${timeRange === '7d' ? '7' : timeRange === '14d' ? '14' : '30'} Days)` : ''}
              </h3>
              <InfoTooltip text={`Sales − (TSOs × ₹${costs.tsoCostPerDay}/day) − (Samples × ₹${costs.sampleCostPerUnit}/unit)`} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Group by:</span>
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartFiltered} margin={{ top: 20, right: 20, left: 20, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
                <XAxis
                  dataKey="dateLabel"
                  tick={<DayTick axisTextColor={chart.axisText} data={chartFiltered} />}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                  interval={0}
                  height={45}
                />
                <YAxis
                  tickFormatter={formatCurrencyCompact}
                  tick={{ fontSize: 12, fill: chart.axisText }}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const item = payload[0]?.payload;
                    if (!item) return null;
                    return (
                      <div style={{
                        backgroundColor: chart.tooltipBg,
                        border: `1px solid ${chart.tooltipBorder}`,
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: 12,
                        color: chart.tooltipText,
                      }}>
                        <p style={{ color: chart.tooltipLabel, marginBottom: 4 }}>{item.dayName}, {item.dateLabel}</p>
                        <p>Net Return: <strong>{formatCurrency(item.netReturn)}</strong></p>
                        <p>TSOs: <strong>{item.numTSO}</strong></p>
                        {item.dowBaseline !== null && (
                          <p style={{ color: item.dowBaseline >= 1 ? '#16a34a' : '#dc2626' }}>
                            vs {item.dayName} avg: {item.dowBaseline >= 1 ? '+' : ''}{((item.dowBaseline - 1) * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="netReturn" radius={[4, 4, 0, 0]} barSize={20}>
                  {chartFiltered.map((entry, i) => (
                    <Cell key={i} fill={entry.netReturn >= 0 ? '#94a3b8' : '#fca5a5'} />
                  ))}
                  <LabelList
                    dataKey="netReturn"
                    position="top"
                    content={({ x, y, width, index }) => {
                      const entry = chartFiltered[index ?? 0];
                      if (!entry || entry.dowBaseline === null) return null;
                      const aboveAvg = entry.dowBaseline >= 1;
                      return (
                        <text
                          x={(x as number) + (width as number) / 2}
                          y={(y as number) - 6}
                          textAnchor="middle"
                          fontSize={12}
                          fill={aboveAvg ? '#16a34a' : '#dc2626'}
                          fontWeight={700}
                        >
                          {aboveAvg ? '\u2191' : '\u2193'}
                        </text>
                      );
                    }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Weekly Metrics Table */}
      {weeklyMetrics.length > 0 && (
        <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Weekly Metrics</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-gray-50 dark:bg-white/5">
                  <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Week</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Best Day</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sales</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">TSO Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sample Cost</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Net Return</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">WoW Growth</th>
                </tr>
              </thead>
              <tbody>
                {weeklyMetrics.map((w) => (
                  <tr key={w.weekStart} className="border-b border-surface-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">{w.weekLabel}</td>
                    <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{w.bestDay}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(w.totalSales)}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(w.totalTSOCost)}</td>
                    <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(w.totalSampleCost)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${w.netReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {formatCurrency(w.netReturn)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {w.wowGrowth !== null ? (
                        <span className={w.wowGrowth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {w.wowGrowth >= 0 ? '+' : ''}{(w.wowGrowth * 100).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DayTick({ x, y, index, axisTextColor, data }: { x?: number; y?: number; index?: number; axisTextColor: string; data: { dayName: string; dateLabel: string }[] }) {
  const item = data[index ?? 0];
  if (!item) return null;
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={12} textAnchor="middle" fontSize={11} fontWeight={600} fill={axisTextColor}>
        {item.dayName}
      </text>
      <text x={0} y={0} dy={25} textAnchor="middle" fontSize={10} fill={axisTextColor} opacity={0.7}>
        {item.dateLabel}
      </text>
    </g>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        aria-label="Info"
      >
        <Info className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-10 w-64 bg-surface-card border border-surface-border rounded-lg shadow-lg p-3 text-xs text-gray-600 dark:text-gray-300">
          {text}
        </div>
      )}
    </div>
  );
}

