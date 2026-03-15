'use client';

import type { MilestoneResult, Milestone } from '@/lib/milestones';
import AchievementBadge from './AchievementBadge';

const CATEGORY_COLORS: Record<Milestone['category'], { bg: string; text: string; bar: string }> = {
  revenue: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-400', bar: 'bg-green-500' },
  orders: { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-400', bar: 'bg-purple-500' },
  outstanding: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  consistency: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', bar: 'bg-amber-500' },
};

export default function MilestoneSection({ milestones }: { milestones: MilestoneResult }) {
  const { achieved, nextUp } = milestones;

  if (!nextUp && achieved.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Milestones</h3>

      {/* Next milestone */}
      {nextUp && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Next Milestone</p>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[nextUp.category].bg} ${CATEGORY_COLORS[nextUp.category].text}`}>
              {nextUp.category}
            </span>
          </div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{nextUp.label}</p>
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${CATEGORY_COLORS[nextUp.category].bar}`}
              style={{ width: `${Math.min(100, nextUp.progress)}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{Math.round(nextUp.progress)}% complete</p>
        </div>
      )}

      {/* Achieved milestones */}
      {achieved.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {achieved.map((m) => (
            <AchievementBadge key={m.id} label={m.label} />
          ))}
        </div>
      )}
    </div>
  );
}
