'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, ExternalLink, CheckCircle, AlertCircle,
  ChevronUp, ChevronDown, FileText,
} from 'lucide-react';
import { ApiResponse, Invoice, InvoiceData, STORE_MAP } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

// ─── Store-to-invoice matching ────────────────────────────────
// Maps store names to possible invoice contactName patterns.
// Uses case-insensitive "starts with" matching so e.g.
// "Deena Chaat" matches "Deena Chaat Bhandar".

const STORE_INVOICE_MAP: Record<string, string[]> = {
  'The Ram Bhandar': ['The Ram Bhandar'],
  'Lakshmi Chai': ['Lakshmi Chai'],
  'Deena Chaat': ['Deena Chaat'],
  'Shree Ji': ['Shreeji', 'Shree Ji'],
  'Blue Lassi': ['Blue Lassi'],
  'Siwon Lassi': ['Siwon Lassi'],
  'Popular Baati Chokha': ['Popular Baati'],
  'GreenBerry': ['GreenBerry', 'Greenberry', 'Green Berry'],
};

function matchesStore(contactName: string, storeName: string): boolean {
  const patterns = STORE_INVOICE_MAP[storeName];
  if (!patterns) return false;
  const lower = contactName.toLowerCase();
  return patterns.some(p => lower.startsWith(p.toLowerCase()));
}

// ─── Page ─────────────────────────────────────────────────────

export default function StoreDetailPage({ params }: { params: { storeCode: string } }) {
  const decodedCode = decodeURIComponent(params.storeCode);
  const storeName = STORE_MAP[decodedCode] || decodedCode;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/invoices');
        const result: ApiResponse<InvoiceData> = await res.json();
        if (result.success && result.data) {
          const storeInvoices = result.data.invoices.filter(inv => matchesStore(inv.contactName, storeName));
          setInvoices(storeInvoices);
        }
      } catch {
        setError('Failed to fetch invoices');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [storeName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-brand-gold" />
      </div>
    );
  }

  // Summary
  const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalRemaining = invoices.reduce((s, inv) => s + inv.remainingAmount, 0);
  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;

  return (
    <>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/stores" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> All Stores
        </Link>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0 relative">
            <span className="text-xl font-bold text-brand-olive/60 dark:text-brand-gold/60">
              {storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
            </span>
            <img
              src={`/stores/${decodedCode}.jpg`}
              alt={storeName}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{storeName}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{decodedCode}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Invoices" value={String(invoices.length)} />
          <SummaryCard label="Total Amount" value={formatCurrency(totalAmount)} />
          <SummaryCard label="Remaining" value={formatCurrency(totalRemaining)} warn={totalRemaining > 0} />
          <SummaryCard label="Status" value={`${paidCount} Paid / ${unpaidCount} Unpaid`} />
        </div>
      )}

      {/* Invoice table */}
      <InvoiceTable invoices={invoices} />
    </>
  );
}

// ─── Summary Card ─────────────────────────────────────────────

function SummaryCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`font-semibold text-sm ${warn ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}

// ─── Sortable Header ──────────────────────────────────────────

type SortField = 'date' | 'amount' | 'remaining';

function SortableHeader({
  field, label, currentField, direction, onSort, align, className,
}: {
  field: SortField;
  label: string;
  currentField: SortField | null;
  direction: 'asc' | 'desc';
  onSort: (field: SortField) => void;
  align?: 'right';
  className?: string;
}) {
  const active = currentField === field;
  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${align === 'right' ? 'text-right' : ''} ${className || ''}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col leading-none">
          <ChevronUp className={`h-3 w-3 ${active && direction === 'asc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
          <ChevronDown className={`h-3 w-3 -mt-1 ${active && direction === 'desc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
        </span>
      </span>
    </th>
  );
}

// ─── Invoice Table ────────────────────────────────────────────

function InvoiceTable({ invoices }: { invoices: Invoice[] }) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const parseDate = (d: string) => {
    const parts = d.split('/');
    if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
    return 0;
  };

  const filtered = invoices.filter((inv) => {
    if (statusFilter === 'paid' && inv.invoiceStatus !== 'Paid') return false;
    if (statusFilter === 'unpaid' && inv.invoiceStatus === 'Paid') return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!sortField) return 0;
    const dir = sortDir === 'asc' ? 1 : -1;
    if (sortField === 'date') return (parseDate(a.invoiceDate) - parseDate(b.invoiceDate)) * dir;
    if (sortField === 'amount') return (a.amount - b.amount) * dir;
    if (sortField === 'remaining') return (a.remainingAmount - b.remainingAmount) * dir;
    return 0;
  });

  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden mb-6">
      <div className="px-4 sm:px-6 py-4 border-b border-surface-border space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-gold" />
          Invoices
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            {filtered.length} of {invoices.length}
          </span>
        </h2>
        {invoices.length > 0 && (
          <div className="flex items-center rounded-lg border border-surface-border-light overflow-hidden text-sm w-fit">
            {([
              { key: 'all', label: 'All' },
              { key: 'paid', label: `Paid (${paidCount})` },
              { key: 'unpaid', label: `Unpaid (${unpaidCount})` },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-3 py-2 transition-colors ${
                  statusFilter === key
                    ? 'bg-brand-gold/20 text-brand-gold font-medium'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-surface-card-hover'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
          No invoices found for this store.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-surface-card-hover text-gray-500 dark:text-gray-400 text-left text-xs uppercase tracking-wider">
                <th className="hidden sm:table-cell px-4 py-3">Invoice #</th>
                <SortableHeader field="date" label="Date" currentField={sortField} direction={sortDir} onSort={handleSort} />
                <th className="px-4 py-3">Contact</th>
                <SortableHeader field="amount" label="Amount" currentField={sortField} direction={sortDir} onSort={handleSort} align="right" />
                <SortableHeader className="hidden md:table-cell" field="remaining" label="Remaining" currentField={sortField} direction={sortDir} onSort={handleSort} align="right" />
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {sorted.map((inv) => (
                <tr key={inv.invoiceNo} className="hover:bg-surface-card-hover transition-colors">
                  <td className="hidden sm:table-cell px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{inv.invoiceDate}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-600 dark:text-gray-300">{inv.contactName}</span>
                    <span className="sm:hidden block text-xs text-gray-400 dark:text-gray-500">#{inv.invoiceNo}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-gray-900 dark:text-white font-medium">{formatCurrency(inv.amount)}</span>
                    <span className="md:hidden block text-xs text-gray-500 dark:text-gray-400">Rem: {formatCurrency(inv.remainingAmount)}</span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-900 dark:text-white text-right">{formatCurrency(inv.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      inv.invoiceStatus === 'Paid'
                        ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                    }`}>
                      {inv.invoiceStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {inv.invoiceLink && (
                      <a
                        href={inv.invoiceLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-gold hover:text-brand-cream transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                    No invoices match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
