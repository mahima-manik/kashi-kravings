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

  // Best Day of Week computation
  const byWeekday = records.reduce((acc, r) => {
    const dow = new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
    if (!acc[dow]) acc[dow] = { total: 0, count: 0 };
    acc[dow].total += r.saleValue;
    acc[dow].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const bestWeekdayEntry = Object.entries(byWeekday).sort((a, b) => b[1].total - a[1].total)[0];
  const bestDayName = bestWeekdayEntry ? bestWeekdayEntry[0] : null;
  const bestDayValue = bestWeekdayEntry ? bestWeekdayEntry[1].total : 0;
  const bestDayAvg = bestWeekdayEntry && bestWeekdayEntry[1].count > 0
    ? bestWeekdayEntry[1].total / bestWeekdayEntry[1].count
    : 0;

  const cards = [
    { label: 'Total Sales Value', value: formatCurrency(totalRevenue) },
    { label: 'Total TSOs Deployed', value: totalTSOs.toLocaleString('en-IN') },
    { label: 'Samples Given / Consumed', value: `${totalSampleGiven.toLocaleString('en-IN')} / ${totalSampleConsumed.toLocaleString('en-IN')}` },
    { label: 'Sales per TSO', value: formatCurrency(salesPerTSO) },
    {
      label: 'Best Day',
      value: bestDayName ?? '—',
      subtitle: bestDayName ? `Avg ${formatCurrency(bestDayAvg)} net` : undefined,
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
