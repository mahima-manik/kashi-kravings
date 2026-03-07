'use client';

import { Users } from 'lucide-react';
import { formatCurrency } from '@/lib/format';
import type { DailySales } from '@/lib/types';

interface StoreDailySalesTableProps {
  dailySales: DailySales[];
  totalSalesValue: number;
  totalCollection: number;
  totalUnits: number;
  totalTSOs: number;
  totalPromotionHours: number;
  totalSamplesGiven: number;
  totalSamplesConsumed: number;
}

function formatDateDMY(dateStr: string): string {
  // Convert YYYY-MM-DD to DD/MM/YYYY to match invoice date format.
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export default function StoreDailySalesTable({
  dailySales,
  totalSalesValue,
  totalCollection,
  totalUnits,
  totalTSOs,
  totalPromotionHours,
  totalSamplesGiven,
  totalSamplesConsumed,
}: StoreDailySalesTableProps) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-border bg-gray-50 dark:bg-white/5">
              <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sale Value</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Collection</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Units</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">TSOs</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Promo Hrs</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Samples</th>
            </tr>
          </thead>
          <tbody>
            {dailySales.map((day) => (
              <tr key={day.date} className="border-b border-surface-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{formatDateDMY(day.date)}</td>
                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(day.saleValue)}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(day.collectionReceived)}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{day.totalUnits}</td>
                <td className="px-4 py-3 text-right">
                  {day.numTSO > 0 ? (
                    <span className="inline-flex items-center gap-1 text-green-700 dark:text-green-400 font-medium">
                      <Users className="h-3.5 w-3.5" />
                      {day.numTSO}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{day.promotionDuration > 0 ? day.promotionDuration : '—'}</td>
                <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{day.sampleGiven > 0 ? `${day.sampleGiven} / ${day.sampleConsumed}` : '—'}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-white/5 font-semibold">
              <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
              <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{formatCurrency(totalSalesValue)}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(totalCollection)}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{totalUnits}</td>
              <td className="px-4 py-3 text-right text-green-700 dark:text-green-400">{totalTSOs}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{totalPromotionHours}</td>
              <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                {totalSamplesGiven} / {totalSamplesConsumed}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
