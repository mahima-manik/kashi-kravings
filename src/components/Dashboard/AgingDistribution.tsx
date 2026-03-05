'use client';

import { formatCurrency } from '@/lib/format';
import { BUCKET_KEYS, BUCKET_LABELS, BUCKET_COLORS, type BucketTotals } from '@/lib/aging';

export default function AgingDistribution({ buckets }: { buckets: BucketTotals }) {
  if (buckets.total === 0) return null;

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Outstanding Distribution</p>
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
    </div>
  );
}
