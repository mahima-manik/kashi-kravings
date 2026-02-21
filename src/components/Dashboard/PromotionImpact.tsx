'use client';

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

export default function PromotionImpact({ records }: PromotionImpactProps) {
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
    </div>
  );
}
