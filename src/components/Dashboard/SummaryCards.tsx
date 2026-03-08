'use client';

import { SalesRecord } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import MetricCard from '@/components/Dashboard/MetricCard';

interface SummaryCardsProps {
  records: SalesRecord[];
}

export default function SummaryCards({ records }: SummaryCardsProps) {
  const totalRevenue = records.reduce((sum, r) => sum + r.saleValue, 0);
  const totalTSOs = records.reduce((sum, r) => sum + r.numTSO, 0);
  const totalSampleGiven = records.reduce((sum, r) => sum + r.sampleGiven, 0);
  const totalSampleConsumed = records.reduce((sum, r) => sum + r.sampleConsumed, 0);
  const salesPerTSO = totalTSOs > 0 ? totalRevenue / totalTSOs : 0;

  const cards = [
    { label: 'Total Sales Value', value: formatCurrency(totalRevenue) },
    { label: 'Total TSOs Deployed', value: totalTSOs.toLocaleString('en-IN') },
    { label: 'Samples Given / Consumed', value: `${totalSampleGiven.toLocaleString('en-IN')} / ${totalSampleConsumed.toLocaleString('en-IN')}` },
    { label: 'Sales per TSO', value: formatCurrency(salesPerTSO) },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} />
      ))}
    </div>
  );
}
