'use client';

import { IndianRupee, Percent, AlertCircle } from 'lucide-react';

interface SummaryCardsProps {
  totalRevenue: number;
  totalCollection: number;
  totalOutstanding: number;
  collectionRate: number;
  transactionCount: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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

function Card({ title, value, subtitle, subtitleColor = 'text-gray-500', icon, iconBg, borderColor = 'border-[#2a2a3a]' }: CardProps) {
  return (
    <div className={`bg-[#1a1a24] rounded-xl border ${borderColor} p-5`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-2">{value}</p>
          <p className={`text-sm mt-1 ${subtitleColor}`}>{subtitle}</p>
        </div>
        <div className={`p-2 rounded-lg ${iconBg}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function SummaryCards({
  totalRevenue,
  totalCollection,
  totalOutstanding,
  collectionRate,
  transactionCount,
}: SummaryCardsProps) {
  const collectionSubtitle = collectionRate >= 50 ? 'Good collection' : 'Needs improvement';
  const collectionSubColor = collectionRate >= 50 ? 'text-green-400' : 'text-orange-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        title="Total Sales Value"
        value={formatCurrency(totalRevenue)}
        subtitle={`Across ${transactionCount} transactions`}
        icon={<IndianRupee className="h-5 w-5 text-green-400" />}
        iconBg="bg-green-900/40"
      />
      <Card
        title="Total Collection"
        value={formatCurrency(totalCollection)}
        subtitle="Amount received"
        icon={<IndianRupee className="h-5 w-5 text-green-400" />}
        iconBg="bg-green-900/40"
      />
      <Card
        title="Collection Rate"
        value={`${collectionRate.toFixed(1)}%`}
        subtitle={collectionSubtitle}
        subtitleColor={collectionSubColor}
        icon={<Percent className="h-5 w-5 text-gray-300" />}
        iconBg="bg-gray-700/40"
      />
      <Card
        title="Outstanding Amount"
        value={formatCurrency(totalOutstanding)}
        subtitle="Pending collection"
        subtitleColor="text-red-400"
        icon={<AlertCircle className="h-5 w-5 text-red-400" />}
        iconBg="bg-red-900/40"
        borderColor="border-red-900/30"
      />
    </div>
  );
}
