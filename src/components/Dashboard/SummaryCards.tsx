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

  // Best Day computation
  const byDate = records.reduce((acc, r) => {
    acc[r.date] = (acc[r.date] || 0) + r.saleValue;
    return acc;
  }, {} as Record<string, number>);

  const bestEntry = Object.entries(byDate).sort((a, b) => b[1] - a[1])[0];
  const bestDayValue = bestEntry ? bestEntry[1] : 0;
  const bestDayDate = bestEntry ? bestEntry[0] : null;
  const bestDayRecordCount = bestDayDate ? records.filter(r => r.date === bestDayDate).length : 0;
  const bestDayAvg = bestDayRecordCount > 0 ? bestDayValue / bestDayRecordCount : 0;
  const bestDayLabel = bestDayDate
    ? new Date(bestDayDate + 'T00:00:00').toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const cards = [
    { label: 'Total Sales Value', value: formatCurrency(totalRevenue) },
    { label: 'Total TSOs Deployed', value: totalTSOs.toLocaleString('en-IN') },
    { label: 'Samples Given / Consumed', value: `${totalSampleGiven.toLocaleString('en-IN')} / ${totalSampleConsumed.toLocaleString('en-IN')}` },
    { label: 'Sales per TSO', value: formatCurrency(salesPerTSO) },
    {
      label: 'Best Day',
      value: bestDayDate ? formatCurrency(bestDayValue) : '—',
      subtitle: bestDayDate ? `${bestDayLabel} · Avg ${formatCurrency(bestDayAvg)} / entry` : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <MetricCard key={card.label} label={card.label} value={card.value} subtitle={card.subtitle} />
      ))}
    </div>
  );
}
