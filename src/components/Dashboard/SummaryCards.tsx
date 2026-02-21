'use client';

import { IndianRupee } from 'lucide-react';
import { formatCurrency } from '@/lib/format';

interface SummaryCardsProps {
  totalRevenue: number;
}

export default function SummaryCards({
  totalRevenue,
}: SummaryCardsProps) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-brand-olive/20 border border-brand-gold/20">
          <IndianRupee className="h-6 w-6 text-brand-gold" />
        </div>
        <div>
          <p className="text-sm text-gray-400">Total Sales Value</p>
          <p className="text-3xl font-bold text-white tracking-tight">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>
    </div>
  );
}
