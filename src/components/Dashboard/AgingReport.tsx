'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Info, X } from 'lucide-react';
import { FIRMS, FIRM_KEYS } from '@/lib/types';
import type { Invoice, Firm } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

type FirmFilter = 'all' | Firm;
type SortField = 'total' | 'current' | '1-30' | '31-60' | '61-90' | '90+';

interface AgingReportProps {
  invoices: Invoice[];
}

interface BucketTotals {
  current: number;
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
  total: number;
}

interface StoreBuckets extends BucketTotals {
  contactName: string;
}

const BUCKET_KEYS = ['current', '1-30', '31-60', '61-90', '90+'] as const;

const BUCKET_LABELS: Record<(typeof BUCKET_KEYS)[number], string> = {
  current: 'Current',
  '1-30': '1-30 Days',
  '31-60': '31-60 Days',
  '61-90': '61-90 Days',
  '90+': '90+ Days',
};

const BUCKET_COLORS: Record<(typeof BUCKET_KEYS)[number], { bg: string; text: string; bar: string }> = {
  current: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  '1-30': { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' },
  '31-60': { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
  '61-90': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' },
  '90+': { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', bar: 'bg-red-700' },
};

function parseDate(d: string): number {
  const parts = d.split('/');
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
  return 0;
}

function getBucket(dueDate: string): (typeof BUCKET_KEYS)[number] {
  const due = parseDate(dueDate);
  if (due === 0) return '90+';
  const now = Date.now();
  const daysOverdue = Math.floor((now - due) / (1000 * 60 * 60 * 24));
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

function emptyBuckets(): BucketTotals {
  return { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 };
}

export default function AgingReport({ invoices }: AgingReportProps) {
  const [firmFilter, setFirmFilter] = useState<FirmFilter>('all');
  const [showInfo, setShowInfo] = useState(false);
  const [sortField, setSortField] = useState<SortField>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const unpaidInvoices = useMemo(
    () => invoices.filter((inv) => inv.invoiceStatus !== 'Paid' && inv.remainingAmount > 0),
    [invoices],
  );

  const filtered = useMemo(
    () => (firmFilter === 'all' ? unpaidInvoices : unpaidInvoices.filter((inv) => inv.firm === firmFilter)),
    [unpaidInvoices, firmFilter],
  );

  // Summary totals
  const summaryTotals = useMemo(() => {
    const totals = emptyBuckets();
    for (const inv of filtered) {
      const bucket = getBucket(inv.dueDate);
      totals[bucket] += inv.remainingAmount;
      totals.total += inv.remainingAmount;
    }
    return totals;
  }, [filtered]);

  // Store-wise breakdown
  const storeRows = useMemo(() => {
    const map = new Map<string, StoreBuckets>();
    for (const inv of filtered) {
      const bucket = getBucket(inv.dueDate);
      let row = map.get(inv.contactName);
      if (!row) {
        row = { contactName: inv.contactName, ...emptyBuckets() };
        map.set(inv.contactName, row);
      }
      row[bucket] += inv.remainingAmount;
      row.total += inv.remainingAmount;
    }
    const rows = Array.from(map.values());

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
      {summaryTotals.total > 0 && (
        <div className="bg-surface-card rounded-xl border border-surface-border p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Outstanding Distribution</p>
          <div className="flex rounded-lg overflow-hidden h-8">
            {BUCKET_KEYS.map((key) => {
              const pct = (summaryTotals[key] / summaryTotals.total) * 100;
              if (pct === 0) return null;
              return (
                <div
                  key={key}
                  className={`${BUCKET_COLORS[key].bar} flex items-center justify-center text-white text-xs font-medium transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${BUCKET_LABELS[key]}: ${formatCurrency(summaryTotals[key])}`}
                >
                  {pct >= 8 ? `${pct.toFixed(0)}%` : ''}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
            {BUCKET_KEYS.map((key) => {
              const pct = (summaryTotals[key] / summaryTotals.total) * 100;
              if (pct === 0) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <span className={`inline-block w-2.5 h-2.5 rounded-sm ${BUCKET_COLORS[key].bar}`} />
                  {BUCKET_LABELS[key]} ({pct.toFixed(1)}%)
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  <td className="px-4 py-3 text-gray-900 dark:text-white font-medium whitespace-nowrap">{row.contactName}</td>
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
