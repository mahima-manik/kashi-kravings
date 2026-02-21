'use client';

import { useTheme } from 'next-themes';

export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return {
    grid: isDark ? '#2a2a3a' : '#e5e7eb',
    axisText: isDark ? '#9ca3af' : '#6b7280',
    tooltipBg: isDark ? '#1a1a24' : '#ffffff',
    tooltipBorder: isDark ? '#2a2a3a' : '#e5e7eb',
    tooltipText: isDark ? '#fff' : '#111827',
    tooltipLabel: isDark ? '#9ca3af' : '#6b7280',
    cursorFill: isDark ? 'rgba(139, 125, 60, 0.1)' : 'rgba(139, 125, 60, 0.15)',
  };
}
