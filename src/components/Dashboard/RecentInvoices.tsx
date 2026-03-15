'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { parseDate } from '@/lib/aging';

function formatDisplayDate(dateStr: string): string {
  const ts = parseDate(dateStr);
  if (ts === 0) return dateStr;
  const d = new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STATUS_CLASSES: Record<string, string> = {
  Paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function RecentInvoices({ invoices, storeCode }: { invoices: Invoice[]; storeCode: string }) {
  // Sort by invoice date descending, take 5
  const sorted = [...invoices].sort((a, b) => {
    const ta = parseDate(a.invoiceDate);
    const tb = parseDate(b.invoiceDate);
    return tb - ta;
  });
  const recent = sorted.slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
        <Link
          href={`/stores/${storeCode}`}
          className="inline-flex items-center gap-1 text-xs text-brand-gold hover:underline"
        >
          View All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="divide-y divide-surface-border">
        {recent.map((inv) => (
          <div key={inv.invoiceNo} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
            <div className="min-w-0">
              <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{inv.invoiceNo}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{formatDisplayDate(inv.invoiceDate)}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(inv.amount)}</p>
                {inv.remainingAmount > 0 && (
                  <p className="text-xs text-red-500 dark:text-red-400">Due: {formatCurrency(inv.remainingAmount)}</p>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CLASSES[inv.invoiceStatus] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                {inv.invoiceStatus}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
