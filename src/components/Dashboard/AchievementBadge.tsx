'use client';

/**
 * Simple circular achievement badge with label text inside.
 */

interface AchievementBadgeProps {
  label: string;
  className?: string;
}

export default function AchievementBadge({ label, className = '' }: AchievementBadgeProps) {
  return (
    <div
      className={`w-20 h-20 rounded-full bg-gradient-to-br from-brand-cream to-brand-ivory border-[3px] border-brand-gold flex items-center justify-center p-2 ${className}`}
    >
      <span className="text-[10px] font-semibold text-brand-olive text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
