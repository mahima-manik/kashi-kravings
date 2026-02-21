'use client';

import { ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { SalesRecord, STORE_MAP } from '@/lib/types';
import { useChartTheme } from '@/lib/useChartTheme';

interface PromotionImpactProps {
  records: SalesRecord[];
}

function getTotalUnits(r: SalesRecord): number {
  return (
    r.paanL +
    r.thandaiL +
    r.giloriL +
    r.paanS +
    r.thandaiS +
    r.giloriS +
    r.heritageBox9 +
    r.heritageBox15
  );
}

export default function PromotionImpact({ records }: PromotionImpactProps) {
  const chart = useChartTheme();

  const tooltipStyle = {
    backgroundColor: chart.tooltipBg,
    border: `1px solid ${chart.tooltipBorder}`,
    borderRadius: '8px',
    color: chart.tooltipText,
  };

  const labelStyle = { color: chart.tooltipLabel };

  // --- KPI calculations ---
  const tsoRecords = records.filter((r) => r.numTSO > 0);
  const totalTSOs = tsoRecords.reduce((s, r) => s + r.numTSO, 0);
  const tsoSaleValue = tsoRecords.reduce((s, r) => s + r.saleValue, 0);
  const salesPerTSO = totalTSOs > 0 ? tsoSaleValue / totalTSOs : 0;

  const promoRecords = records.filter((r) => r.promotionDuration > 0);
  const totalPromoHours = promoRecords.reduce((s, r) => s + r.promotionDuration, 0);
  const promoSaleValue = promoRecords.reduce((s, r) => s + r.saleValue, 0);
  const salesPerPromoHour = totalPromoHours > 0 ? promoSaleValue / totalPromoHours : 0;

  const sampleRecords = records.filter((r) => r.sampleConsumed > 0);
  const totalSamples = sampleRecords.reduce((s, r) => s + r.sampleConsumed, 0);
  const totalUnitsFromSamples = sampleRecords.reduce((s, r) => s + getTotalUnits(r), 0);
  const sampleConversionRate = totalSamples > 0 ? totalUnitsFromSamples / totalSamples : 0;

  // --- Scatter data ---
  const promoScatterData = records
    .filter((r) => r.promotionDuration > 0)
    .map((r) => ({ x: r.promotionDuration, y: r.saleValue, store: STORE_MAP[r.location] || r.location, date: r.date }));

  const sampleScatterData = records
    .filter((r) => r.sampleConsumed > 0)
    .map((r) => ({ x: r.sampleConsumed, y: getTotalUnits(r), store: STORE_MAP[r.location] || r.location, date: r.date }));

  // --- TSO bucket data ---
  const tsoBuckets: Record<string, { totalSale: number; totalUnits: number; count: number }> = {
    '1': { totalSale: 0, totalUnits: 0, count: 0 },
    '2': { totalSale: 0, totalUnits: 0, count: 0 },
    '3+': { totalSale: 0, totalUnits: 0, count: 0 },
  };

  for (const r of records) {
    if (r.numTSO <= 0) continue;
    const bucket = r.numTSO >= 3 ? '3+' : String(r.numTSO);
    tsoBuckets[bucket].totalSale += r.saleValue;
    tsoBuckets[bucket].totalUnits += getTotalUnits(r);
    tsoBuckets[bucket].count += 1;
  }

  const tsoBarData = ['1', '2', '3+'].map((bucket) => {
    const b = tsoBuckets[bucket];
    return {
      bucket: `${bucket} TSO${bucket !== '1' ? 's' : ''}`,
      avgSaleValue: b.count > 0 ? Math.round(b.totalSale / b.count) : 0,
      avgUnitsSold: b.count > 0 ? Math.round(b.totalUnits / b.count) : 0,
    };
  });

  const kpis = [
    {
      label: 'Sales per TSO',
      value: `₹${salesPerTSO.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    },
    {
      label: 'Sales per Promo Hour',
      value: `₹${salesPerPromoHour.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
    },
    {
      label: 'Sample Conversion Rate',
      value: `${sampleConversionRate.toFixed(2)}x`,
    },
  ];

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-6">Promotion Impact Analysis</h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-primary rounded-lg border border-surface-border p-4 text-center"
          >
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Scatter Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Promotion Duration vs Sale Value */}
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">Promotion Duration vs Sale Value</p>
          <details className="mb-3 group">
            <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              How is this calculated?
            </summary>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-4">
              Each dot represents a sale where a promotion was active. X-axis shows how long the promotion ran (in hours), Y-axis shows the sale value (in ₹).
            </p>
          </details>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis
                  dataKey="x"
                  name="Promo Hours"
                  type="number"
                  tick={{ fontSize: 11, fill: chart.axisText }}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                  label={{ value: 'Promo Hours', position: 'insideBottom', offset: -2, fontSize: 11, fill: chart.axisText }}
                />
                <YAxis
                  dataKey="y"
                  name="Sale Value"
                  type="number"
                  tick={{ fontSize: 11, fill: chart.axisText }}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                  tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle} className="px-3 py-2 text-xs">
                        <p className="text-gray-900 dark:text-white font-medium mb-1">{d.store}</p>
                        <p className="text-gray-500 dark:text-gray-400">Date: <span className="text-gray-900 dark:text-white">{d.date}</span></p>
                        <p className="text-gray-500 dark:text-gray-400">Sale Value: <span className="text-gray-900 dark:text-white">₹{d.y.toLocaleString('en-IN')}</span></p>
                      </div>
                    );
                  }}
                />
                <Scatter data={promoScatterData} fill="#A69A5B" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Samples Consumed vs Units Sold */}
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">Samples Consumed vs Units Sold</p>
          <details className="mb-3 group">
            <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
              <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
              How is this calculated?
            </summary>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-4">
              Each dot represents a sale where samples were given. X-axis shows samples consumed, Y-axis shows total units sold in that transaction.
            </p>
          </details>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                <XAxis
                  dataKey="x"
                  name="Samples"
                  type="number"
                  tick={{ fontSize: 11, fill: chart.axisText }}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                  label={{ value: 'Samples', position: 'insideBottom', offset: -2, fontSize: 11, fill: chart.axisText }}
                />
                <YAxis
                  dataKey="y"
                  name="Units Sold"
                  type="number"
                  tick={{ fontSize: 11, fill: chart.axisText }}
                  tickLine={false}
                  axisLine={{ stroke: chart.grid }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div style={tooltipStyle} className="px-3 py-2 text-xs">
                        <p className="text-gray-900 dark:text-white font-medium mb-1">{d.store}</p>
                        <p className="text-gray-500 dark:text-gray-400">Date: <span className="text-gray-900 dark:text-white">{d.date}</span></p>
                        <p className="text-gray-500 dark:text-gray-400">Samples: <span className="text-gray-900 dark:text-white">{d.x.toLocaleString('en-IN')}</span></p>
                        <p className="text-gray-500 dark:text-gray-400">Units Sold: <span className="text-gray-900 dark:text-white">{d.y.toLocaleString('en-IN')}</span></p>
                      </div>
                    );
                  }}
                />
                <Scatter data={sampleScatterData} fill="#16a34a" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TSO Impact Bar Chart */}
      <div>
        <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">TSO Impact on Performance</p>
        <details className="mb-3 group">
          <summary className="text-xs text-gray-400 dark:text-gray-500 cursor-pointer inline-flex items-center gap-1 hover:text-gray-600 dark:hover:text-gray-400 transition-colors">
            <ChevronRight className="h-3 w-3 transition-transform group-open:rotate-90" />
            How is this calculated?
          </summary>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 pl-4">
            Records are grouped by TSO count (1, 2, or 3+). Each bar shows the average sale value and average units sold per transaction within that group.
          </p>
        </details>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tsoBarData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 12, fill: chart.axisText }}
                tickLine={false}
                axisLine={{ stroke: chart.grid }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: chart.axisText }}
                tickLine={false}
                axisLine={{ stroke: chart.grid }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'Avg Sale Value') return [`₹${value.toLocaleString('en-IN')}`, name];
                  return [value.toLocaleString('en-IN'), name];
                }}
                cursor={{ fill: chart.cursorFill }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: chart.axisText }}
              />
              <Bar dataKey="avgSaleValue" name="Avg Sale Value" fill="#A69A5B" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="avgUnitsSold" name="Avg Units Sold" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
