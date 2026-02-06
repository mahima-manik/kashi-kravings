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
    <div className="bg-[#1a1a24] rounded-xl border border-[#2a2a3a] px-6 py-4">
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-[#2a2a3a] border border-[#3a3a4a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-[#2a2a3a] border border-[#3a3a4a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 whitespace-nowrap">Location:</label>
          <select
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="bg-[#2a2a3a] border border-[#3a3a4a] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 min-w-[160px]"
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
            className="bg-[#2a2a3a] border border-[#3a3a4a] text-white text-sm rounded-lg px-5 py-2 hover:bg-[#3a3a4a] transition-colors"
          >
            Apply Filters
          </button>
          <button
            onClick={onReset}
            className="bg-[#2a2a3a] border border-[#3a3a4a] text-white text-sm rounded-lg px-5 py-2 hover:bg-[#3a3a4a] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
