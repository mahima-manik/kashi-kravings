'use client';

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
import { SalesRecord } from '@/lib/types';

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

const tooltipStyle = {
  backgroundColor: '#1a1a24',
  border: '1px solid #2a2a3a',
  borderRadius: '8px',
  color: '#fff',
};

const labelStyle = { color: '#9ca3af' };

export default function PromotionImpact({ records }: PromotionImpactProps) {
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
    .map((r) => ({ x: r.promotionDuration, y: r.saleValue }));

  const sampleScatterData = records
    .filter((r) => r.sampleConsumed > 0)
    .map((r) => ({ x: r.sampleConsumed, y: getTotalUnits(r) }));

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
      <h3 className="text-base font-semibold text-white mb-6">Promotion Impact Analysis</h3>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="bg-surface-primary rounded-lg border border-surface-border p-4 text-center"
          >
            <p className="text-xs text-gray-400 mb-1">{kpi.label}</p>
            <p className="text-xl font-bold text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Scatter Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Promotion Duration vs Sale Value */}
        <div>
          <p className="text-sm text-gray-400 mb-3">Promotion Duration vs Sale Value</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis
                  dataKey="x"
                  name="Promo Hours"
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  label={{ value: 'Promo Hours', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                  dataKey="y"
                  name="Sale Value"
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  tickFormatter={(v: number) => `₹${v.toLocaleString('en-IN')}`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Sale Value') return [`₹${value.toLocaleString('en-IN')}`, name];
                    return [value, name];
                  }}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter data={promoScatterData} fill="#A69A5B" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Samples Consumed vs Units Sold */}
        <div>
          <p className="text-sm text-gray-400 mb-3">Samples Consumed vs Units Sold</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" />
                <XAxis
                  dataKey="x"
                  name="Samples"
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  label={{ value: 'Samples', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#9ca3af' }}
                />
                <YAxis
                  dataKey="y"
                  name="Units Sold"
                  type="number"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2a2a3a' }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number, name: string) => [value.toLocaleString('en-IN'), name]}
                  cursor={{ strokeDasharray: '3 3' }}
                />
                <Scatter data={sampleScatterData} fill="#16a34a" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* TSO Impact Bar Chart */}
      <div>
        <p className="text-sm text-gray-400 mb-3">TSO Impact on Performance</p>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tsoBarData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3a" vertical={false} />
              <XAxis
                dataKey="bucket"
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a3a' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#2a2a3a' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={labelStyle}
                formatter={(value: number, name: string) => {
                  if (name === 'Avg Sale Value') return [`₹${value.toLocaleString('en-IN')}`, name];
                  return [value.toLocaleString('en-IN'), name];
                }}
                cursor={{ fill: 'rgba(139, 125, 60, 0.1)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
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
