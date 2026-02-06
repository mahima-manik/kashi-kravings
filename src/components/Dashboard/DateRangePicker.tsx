'use client';

import { STORES } from '@/lib/types';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  location: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onLocationChange: (location: string) => void;
  onApply: () => void;
  onReset: () => void;
}

const inputClass =
  'bg-surface-card-hover border border-surface-border-light text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-gold';

export default function DateRangePicker({
  startDate,
  endDate,
  location,
  onStartDateChange,
  onEndDateChange,
  onLocationChange,
  onApply,
  onReset,
}: DateRangePickerProps) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border px-6 py-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Location:</label>
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

        <div className="flex items-center gap-3">
          <button
            onClick={onApply}
            className="bg-brand-olive hover:bg-brand-gold text-white text-sm rounded-lg px-5 py-2 transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={onReset}
            className="bg-surface-card-hover border border-surface-border-light text-gray-300 hover:text-white text-sm rounded-lg px-5 py-2 hover:bg-surface-border transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
