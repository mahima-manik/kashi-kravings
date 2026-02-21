'use client';

import { IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface SummaryCardsProps {
  totalRevenue: number;
  transactionCount: number;
}

interface CardProps {
  title: string;
  value: string;
  subtitle: string;
  subtitleColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  borderColor?: string;
}

function Card({
  title,
  value,
  subtitle,
  subtitleColor = 'text-gray-500',
  icon,
  iconBg,
  borderColor = 'border-surface-border',
}: CardProps) {
  return (
    <div className={`bg-surface-card rounded-xl border ${borderColor} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          <p className={`text-sm mt-1 ${subtitleColor}`}>{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function SummaryCards({
  totalRevenue,
  transactionCount,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card
        title="Total Sales Value"
        value={formatCurrency(totalRevenue)}
        subtitle={`Across ${transactionCount} transactions`}
        icon={<IndianRupee className="h-5 w-5 text-green-400" />}
        iconBg="bg-green-900/40"
      />
      <Card
        title="Transactions"
        value={transactionCount.toLocaleString('en-IN')}
        subtitle="Total records"
        icon={<IndianRupee className="h-5 w-5 text-green-400" />}
        iconBg="bg-green-900/40"
      />
    </div>
  );
}
