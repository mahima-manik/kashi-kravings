'use client';

import { useState } from 'react';
import { format, subDays, subWeeks, subMonths } from 'date-fns';
import { Calendar, ChevronDown } from 'lucide-react';
import { STORES } from '@/lib/types';

export type PresetKey = '3d' | '1w' | '1m' | 'custom';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  location: string;
  activePreset: PresetKey;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onLocationChange: (location: string) => void;
  onApply: () => void;
  onReset: () => void;
  onQuickSelect: (startDate: string, endDate: string, preset: PresetKey) => void;
}

const PRESETS: { key: PresetKey; label: string; getRange: () => { start: string; end: string } }[] = [
  {
    key: '3d',
    label: 'Last 3 days',
    getRange: () => ({
      start: format(subDays(new Date(), 2), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    key: '1w',
    label: 'Last 1 week',
    getRange: () => ({
      start: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
  {
    key: '1m',
    label: 'Last 1 month',
    getRange: () => ({
      start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
      end: format(new Date(), 'yyyy-MM-dd'),
    }),
  },
];

const inputClass =
  'bg-surface-card-hover border border-surface-border-light text-gray-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-gold';

export default function DateRangePicker({
  startDate,
  endDate,
  location,
  activePreset,
  onStartDateChange,
  onEndDateChange,
  onLocationChange,
  onApply,
  onReset,
  onQuickSelect,
}: DateRangePickerProps) {
  const [showCustom, setShowCustom] = useState(activePreset === 'custom');

  const handlePresetClick = (preset: typeof PRESETS[number]) => {
    const { start, end } = preset.getRange();
    setShowCustom(false);
    onQuickSelect(start, end, preset.key);
  };

  const handleCustomClick = () => {
    setShowCustom(true);
  };

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border px-6 py-4 space-y-4">
      {/* Row 1: Presets + Location */}
      <div className="flex flex-wrap items-center gap-3">
        <Calendar className="h-4 w-4 text-gray-400 dark:text-gray-400 hidden sm:block" />
        {/* Preset buttons */}
        {PRESETS.map((preset) => (
          <button
            key={preset.key}
            onClick={() => handlePresetClick(preset)}
            className={`text-sm rounded-lg px-4 py-2 transition-colors border ${
              activePreset === preset.key && !showCustom
                ? 'bg-brand-olive border-brand-gold text-white'
                : 'bg-surface-card-hover border-surface-border-light text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-brand-gold/50'
            }`}
          >
            {preset.label}
          </button>
        ))}

        {/* Custom button */}
        <button
          onClick={handleCustomClick}
          className={`text-sm rounded-lg px-4 py-2 transition-colors border flex items-center gap-1.5 ${
            showCustom
              ? 'bg-brand-olive border-brand-gold text-white'
              : 'bg-surface-card-hover border-surface-border-light text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:border-brand-gold/50'
          }`}
        >
          Custom
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showCustom ? 'rotate-180' : ''}`} />
        </button>

        {/* Separator */}
        <div className="hidden sm:block w-px h-6 bg-surface-border-light mx-1" />

        {/* Location filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Location:</label>
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className={`${inputClass} min-w-[160px]`}
          >
            <option value="all">All Locations</option>
            {STORES.map((store) => (
              <option key={store.code} value={store.code}>
                {store.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors ml-auto"
        >
          Reset
        </button>
      </div>

      {/* Row 2: Custom date inputs (collapsible) */}
      {showCustom && (
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className={inputClass}
            />
          </div>

          <button
            onClick={onApply}
            className="bg-brand-olive hover:bg-brand-gold text-white text-sm rounded-lg px-5 py-2 transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
