'use client';

import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import { BUCKET_KEYS, BUCKET_LABELS, BUCKET_COLORS, type BucketTotals } from '@/lib/aging';

interface AgingDistributionProps {
  buckets: BucketTotals;
  oldestDaysOverdue?: number;
  unpaidCount?: number;
}

export default function AgingDistribution({
  buckets,
  oldestDaysOverdue,
  unpaidCount,
}: AgingDistributionProps) {
  if (buckets.total === 0) return null;

  const hasOverdue = buckets['1-30'] + buckets['31-60'] + buckets['61-90'] + buckets['90+'] > 0;
  const overdueAmount = buckets.total - buckets.current;

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasOverdue && <AlertTriangle className="h-4 w-4 text-amber-500" />}
          <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding Distribution</p>
        </div>
        {unpaidCount !== undefined && (
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span>{unpaidCount} unpaid invoice{unpaidCount !== 1 ? 's' : ''}</span>
            {oldestDaysOverdue !== undefined && oldestDaysOverdue > 0 && (
              <span className={oldestDaysOverdue > 60 ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
                Oldest: {oldestDaysOverdue}d overdue
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stacked bar */}
      <div className="flex rounded-lg overflow-hidden h-8">
        {BUCKET_KEYS.map((key) => {
          const pct = (buckets[key] / buckets.total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              className={`${BUCKET_COLORS[key].bar} flex items-center justify-center text-white text-xs font-medium transition-all`}
              style={{ width: `${pct}%` }}
              title={`${BUCKET_LABELS[key]}: ${formatCurrency(buckets[key])}`}
            >
              {pct >= 8 ? `${pct.toFixed(0)}%` : ''}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {BUCKET_KEYS.map((key) => {
          const pct = (buckets[key] / buckets.total) * 100;
          if (pct === 0) return null;
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <span className={`inline-block w-2.5 h-2.5 rounded-sm ${BUCKET_COLORS[key].bar}`} />
              {BUCKET_LABELS[key]} ({pct.toFixed(1)}%)
            </div>
          );
        })}
      </div>

      {/* Overdue callout */}
      {hasOverdue && (
        <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between text-xs">
          <span className="text-gray-500 dark:text-gray-400">Overdue amount</span>
          <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(overdueAmount)}</span>
        </div>
      )}
    </div>
  );
}
