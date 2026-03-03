'use client';

import { useState } from 'react';
import { FileText, ExternalLink, ChevronUp, ChevronDown } from 'lucide-react';
import type { Invoice } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

type Firm = 'kashi_kravings' | 'prime_traders';
type FirmFilter = 'all' | Firm;
type SortField = 'date' | 'amount' | 'remaining';

interface InvoiceTableProps {
  invoices: Invoice[];
  showSearch?: boolean;
}

const FIRM_LABELS: Record<Firm, string> = {
  kashi_kravings: 'Kashi Kravings',
  prime_traders: 'Prime Traders',
};

function parseDate(d: string) {
  const parts = d.split('/');
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
  return 0;
}

export default function InvoiceTable({
  invoices,
  showSearch = false,
}: InvoiceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [firmFilter, setFirmFilter] = useState<FirmFilter>('all');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const filtered = invoices
    .filter((inv) => {
      if (showSearch && searchQuery && !inv.contactName.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (statusFilter === 'paid' && inv.invoiceStatus !== 'Paid') return false;
      if (statusFilter === 'unpaid' && inv.invoiceStatus === 'Paid') return false;
      if (firmFilter !== 'all' && inv.firm !== firmFilter) return false;
      return true;
    })
    .sort((a: Invoice, b: Invoice) => {
      if (!sortField) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return (parseDate(a.invoiceDate) - parseDate(b.invoiceDate)) * dir;
      if (sortField === 'remaining') return (a.remainingAmount - b.remainingAmount) * dir;
      return (a.amount - b.amount) * dir;
    });

  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;

  return (
    <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-surface-border space-y-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-brand-gold" />
          Invoices
          {invoices.length > 0 && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              {filtered.length} of {invoices.length}
            </span>
          )}
        </h2>
        {invoices.length > 0 && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {showSearch && (
              <div className="relative flex-1 sm:flex-none">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 pl-9 pr-3 py-2 bg-surface-card-hover border border-surface-border-light rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-gold/50"
                />
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-lg border border-surface-border-light overflow-hidden text-sm">
                {([
                  { key: 'all' as const, label: 'All' },
                  { key: 'paid' as const, label: `Paid (${paidCount})` },
                  { key: 'unpaid' as const, label: `Unpaid (${unpaidCount})` },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key)}
                    className={`flex-1 sm:flex-none px-3 py-2 transition-colors ${
                      statusFilter === key
                        ? 'bg-brand-gold/20 text-brand-gold font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-surface-card-hover'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center rounded-lg border border-surface-border-light overflow-hidden text-sm">
                {(['all', 'kashi_kravings', 'prime_traders'] as FirmFilter[]).map((key) => (
                  <button
                    key={key}
                    onClick={() => setFirmFilter(key)}
                    className={`px-3 py-2 transition-colors ${
                      firmFilter === key
                        ? 'bg-brand-gold/20 text-brand-gold font-medium'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-surface-card-hover'
                    }`}
                  >
                    {key === 'all' ? 'All' : FIRM_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="p-8 text-center text-gray-400 dark:text-gray-500">
          No invoices found.
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
                <th className="hidden lg:table-cell px-4 py-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {filtered.map((inv) => (
                <tr key={`${inv.firm}-${inv.invoiceNo}`} className="hover:bg-surface-card-hover transition-colors">
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
                  <td className="hidden lg:table-cell px-4 py-3">
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
              {filtered.length === 0 && (
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
        {align === 'right' && (
          <span className="inline-flex flex-col leading-none">
            <ChevronUp className={`h-3 w-3 ${active && direction === 'asc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
            <ChevronDown className={`h-3 w-3 -mt-1 ${active && direction === 'desc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
          </span>
        )}
        {label}
        {align !== 'right' && (
          <span className="inline-flex flex-col leading-none">
            <ChevronUp className={`h-3 w-3 ${active && direction === 'asc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
            <ChevronDown className={`h-3 w-3 -mt-1 ${active && direction === 'desc' ? 'text-brand-gold' : 'text-gray-300 dark:text-gray-600'}`} />
          </span>
        )}
      </span>
    </th>
  );
}
