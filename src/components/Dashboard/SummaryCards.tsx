'use client';

import { IndianRupee, Package, Store, TrendingUp } from 'lucide-react';

interface SummaryCardsProps {
  totalRevenue: number;
  totalCollection: number;
  totalOutstanding: number;
  totalUnits: number;
  storesActiveToday: number;
  collectionRate: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

interface CardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'orange';
}

function Card({ title, value, subtitle, icon, color }: CardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </div>
    </div>
  );
}

export default function SummaryCards({
  totalRevenue,
  totalCollection,
  totalOutstanding,
  totalUnits,
  storesActiveToday,
  collectionRate,
}: SummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card
        title="Total Revenue"
        value={formatCurrency(totalRevenue)}
        icon={<IndianRupee className="h-6 w-6" />}
        color="blue"
      />
      <Card
        title="Collection Received"
        value={formatCurrency(totalCollection)}
        icon={<IndianRupee className="h-6 w-6" />}
        color="green"
      />
      <Card
        title="Outstanding"
        value={formatCurrency(totalOutstanding)}
        icon={<IndianRupee className="h-6 w-6" />}
        color="red"
      />
      <Card
        title="Total Units Sold"
        value={formatNumber(totalUnits)}
        icon={<Package className="h-6 w-6" />}
        color="purple"
      />
      <Card
        title="Stores Active Today"
        value={storesActiveToday.toString()}
        subtitle="out of 6 stores"
        icon={<Store className="h-6 w-6" />}
        color="orange"
      />
      <Card
        title="Collection Rate"
        value={`${collectionRate.toFixed(1)}%`}
        icon={<TrendingUp className="h-6 w-6" />}
        color="yellow"
      />
    </div>
  );
}
