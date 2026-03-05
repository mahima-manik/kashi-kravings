'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronUp, ChevronDown, Info, X } from 'lucide-react';
import { FIRMS, FIRM_KEYS } from '@/lib/types';
import type { Invoice, Firm } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import {
  BUCKET_KEYS,
  BUCKET_LABELS,
  BUCKET_COLORS,
  getUnpaidInvoices,
  computeAgingBuckets,
  computeStoreAgingRows,
  type BucketTotals,
} from '@/lib/aging';
import AgingDistribution from '@/components/Dashboard/AgingDistribution';

type FirmFilter = 'all' | Firm;
type SortField = 'total' | 'current' | '1-30' | '31-60' | '61-90' | '90+';

interface AgingReportProps {
  invoices: Invoice[];
}

export default function AgingReport({ invoices }: AgingReportProps) {
  const [firmFilter, setFirmFilter] = useState<FirmFilter>('all');
  const [showInfo, setShowInfo] = useState(false);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const unpaidInvoices = useMemo(() => getUnpaidInvoices(invoices), [invoices]);

  const filtered = useMemo(
    () => (firmFilter === 'all' ? unpaidInvoices : unpaidInvoices.filter((inv) => inv.firm === firmFilter)),
    [unpaidInvoices, firmFilter],
  );

  const { buckets: summaryTotals } = useMemo(() => computeAgingBuckets(filtered), [filtered]);

  const storeRows = useMemo(() => {
    const rows = computeStoreAgingRows(filtered);
    const field = sortField === 'current' ? 'current' : sortField;
    const dir = sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => ((a[field as keyof BucketTotals] ?? 0) - (b[field as keyof BucketTotals] ?? 0)) * dir);
    return rows;
  }, [filtered, sortField, sortDir]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (unpaidInvoices.length === 0) {
    return (
      <div className="bg-surface-card rounded-xl border border-surface-border p-8 text-center text-gray-500 dark:text-gray-400">
        No unpaid invoices to display.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Popup */}
      {showInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowInfo(false)}>
          <div className="bg-surface-card rounded-xl border border-surface-border p-6 w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">How to Read the Aging Report</h2>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <p>The aging report groups all <strong className="text-gray-900 dark:text-white">unpaid invoices</strong> by how long they have been overdue, based on their due date.</p>
              <div className="space-y-1.5">
                <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500 mr-2 align-middle" /><strong className="text-gray-900 dark:text-white">Current</strong> — Not yet due. Payment deadline is today or in the future.</p>
                <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-yellow-500 mr-2 align-middle" /><strong className="text-gray-900 dark:text-white">1-30 Days</strong> — Overdue by 1 to 30 days. Follow up soon.</p>
                <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-orange-500 mr-2 align-middle" /><strong className="text-gray-900 dark:text-white">31-60 Days</strong> — Overdue by 31 to 60 days. Needs attention.</p>
                <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-500 mr-2 align-middle" /><strong className="text-gray-900 dark:text-white">61-90 Days</strong> — Overdue by 61 to 90 days. Escalate collection efforts.</p>
                <p><span className="inline-block w-2.5 h-2.5 rounded-sm bg-red-700 mr-2 align-middle" /><strong className="text-gray-900 dark:text-white">90+ Days</strong> — Overdue by more than 90 days. Highest priority for recovery.</p>
              </div>
              <p className="pt-1 text-gray-500 dark:text-gray-400">Each row in the table shows the outstanding amount for a store across these buckets. Higher amounts in the red columns indicate stores that need urgent follow-up.</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {BUCKET_KEYS.map((key) => (
          <div key={key} className={`rounded-xl border border-surface-border p-4 ${BUCKET_COLORS[key].bg}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{BUCKET_LABELS[key]}</p>
            <p className={`font-semibold text-sm ${BUCKET_COLORS[key].text}`}>
              {formatCurrency(summaryTotals[key])}
            </p>
          </div>
        ))}
      </div>

      {/* Stacked Bar */}
      <AgingDistribution buckets={summaryTotals} />

      {/* Store-wise Aging Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-surface-border space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Store-wise Aging</h2>
            <button
              onClick={() => setShowInfo(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center rounded-lg border border-surface-border-light overflow-hidden text-sm w-fit">
            {(['all' as const, ...FIRM_KEYS] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFirmFilter(key)}
                className={`px-3 py-2 transition-colors ${
                  firmFilter === key
                    ? 'bg-brand-gold/20 text-brand-gold font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-surface-card-hover'
                }`}
              >
                {key === 'all' ? 'All' : FIRMS[key]}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-card-hover text-gray-500 dark:text-gray-400 text-left text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Store</th>
                {BUCKET_KEYS.map((key) => (
                  <AgingHeader
                    key={key}
                    field={key}
                    label={BUCKET_LABELS[key]}
                    currentField={sortField}
                    direction={sortDir}
                    onSort={handleSort}
                  />
                ))}
                <AgingHeader field="total" label="Total" currentField={sortField} direction={sortDir} onSort={handleSort} />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {storeRows.map((row) => (
                <tr key={row.contactName} className="hover:bg-surface-card-hover transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Link
                      href={`/stores/${encodeURIComponent(row.contactName)}`}
                      className="text-gray-900 dark:text-white font-medium hover:text-brand-gold transition-colors"
                    >
                      {row.contactName}
                    </Link>
                  </td>
                  {BUCKET_KEYS.map((key) => (
                    <td key={key} className={`px-4 py-3 text-right tabular-nums ${row[key] > 0 ? BUCKET_COLORS[key].text : 'text-gray-300 dark:text-gray-600'}`}>
                      {row[key] > 0 ? formatCurrency(row[key]) : '—'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white tabular-nums">
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
              {storeRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No unpaid invoices match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
            {storeRows.length > 0 && (
              <tfoot>
                <tr className="bg-surface-card-hover font-semibold text-gray-900 dark:text-white border-t-2 border-surface-border">
                  <td className="px-4 py-3">Total</td>
                  {BUCKET_KEYS.map((key) => (
                    <td key={key} className={`px-4 py-3 text-right tabular-nums ${BUCKET_COLORS[key].text}`}>
                      {formatCurrency(summaryTotals[key])}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(summaryTotals.total)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}

function AgingHeader({
  field,
  label,
  currentField,
  direction,
  onSort,
}: {
  field: SortField;
  label: string;
  currentField: SortField;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
}) {
  const active = currentField === field;
  return (
    <th
      className="px-4 py-3 text-right cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        <span className="inline-flex flex-col leading-none">
          <ChevronUp className={`h-3 w-3 ${active && direction === 'asc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
          <ChevronDown className={`h-3 w-3 -mt-1 ${active && direction === 'desc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
        </span>
        {label}
      </span>
    </th>
  );
}
