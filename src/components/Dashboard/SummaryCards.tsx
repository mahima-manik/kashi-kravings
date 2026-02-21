'use client';

import { IndianRupee, Users, Beaker, TrendingUp } from 'lucide-react';
import { SalesRecord } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

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
    {
      label: 'Total Sales Value',
      value: formatCurrency(totalRevenue),
      icon: IndianRupee,
      iconBg: 'bg-brand-olive/20 border-brand-gold/20',
      iconColor: 'text-brand-gold',
    },
    {
      label: 'Total TSOs Deployed',
      value: totalTSOs.toLocaleString('en-IN'),
      icon: Users,
      iconBg: 'bg-blue-500/10 border-blue-500/20',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Samples Given / Consumed',
      value: `${totalSampleGiven.toLocaleString('en-IN')} / ${totalSampleConsumed.toLocaleString('en-IN')}`,
      icon: Beaker,
      iconBg: 'bg-green-500/10 border-green-500/20',
      iconColor: 'text-green-500',
    },
    {
      label: 'Sales per TSO',
      value: formatCurrency(salesPerTSO),
      icon: TrendingUp,
      iconBg: 'bg-purple-500/10 border-purple-500/20',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface-card rounded-xl border border-surface-border p-6"
        >
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${card.iconBg} border`}>
              <card.icon className={`h-6 w-6 ${card.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                {card.value}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
