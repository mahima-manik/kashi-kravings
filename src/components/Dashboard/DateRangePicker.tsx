'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
}

type PresetRange = 'today' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const [activePreset, setActivePreset] = useState<PresetRange>('30days');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (preset: PresetRange) => {
    setActivePreset(preset);
    const today = new Date();

    switch (preset) {
      case 'today':
        onChange(format(today, 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
        setShowCustom(false);
        break;
      case '7days':
        onChange(format(subDays(today, 6), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
        setShowCustom(false);
        break;
      case '30days':
        onChange(format(subDays(today, 29), 'yyyy-MM-dd'), format(today, 'yyyy-MM-dd'));
        setShowCustom(false);
        break;
      case 'thisMonth':
        onChange(
          format(startOfMonth(today), 'yyyy-MM-dd'),
          format(endOfMonth(today), 'yyyy-MM-dd')
        );
        setShowCustom(false);
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        onChange(
          format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          format(endOfMonth(lastMonth), 'yyyy-MM-dd')
        );
        setShowCustom(false);
        break;
      case 'custom':
        setShowCustom(true);
        break;
    }
  };

  const presetButtons: { label: string; value: PresetRange }[] = [
    { label: 'Today', value: 'today' },
    { label: '7 Days', value: '7days' },
    { label: '30 Days', value: '30days' },
    { label: 'This Month', value: 'thisMonth' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="h-5 w-5 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">Date Range</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {presetButtons.map((preset) => (
          <button
            key={preset.value}
            onClick={() => handlePresetChange(preset.value)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              activePreset === preset.value
                ? 'bg-chocolate-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {showCustom && (
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onChange(e.target.value, endDate)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-chocolate-500 focus:border-transparent"
            />
          </div>
          <div className="text-gray-400 mt-5">to</div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onChange(startDate, e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-chocolate-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-500">
        Showing data from {format(new Date(startDate), 'MMM d, yyyy')} to{' '}
        {format(new Date(endDate), 'MMM d, yyyy')}
      </div>
    </div>
  );
}
