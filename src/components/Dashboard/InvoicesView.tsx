'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, FileText, ExternalLink, CheckCircle, AlertCircle, Search, ChevronUp, ChevronDown } from 'lucide-react';
import type { Invoice, InvoiceData, ApiResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

export default function InvoicesView() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch('/api/invoices');
      const result: ApiResponse<InvoiceData> = await res.json();
      if (result.success && result.data) {
        setData(result.data);
      }
    } catch {
      // silently fail on fetch
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/invoices', { method: 'POST', body: formData });
      const result: ApiResponse<{ added: number; updated: number }> = await res.json();

      if (result.success && result.data) {
        const { added, updated } = result.data;
        setFeedback({
          type: 'success',
          message: `${added} invoice${added !== 1 ? 's' : ''} added, ${updated} updated.`,
        });
        await fetchInvoices();
      } else {
        setFeedback({ type: 'error', message: result.error || 'Upload failed' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Failed to upload file' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleSort = (field: 'date' | 'amount') => {
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

  const filteredInvoices = (data?.invoices ?? [])
    .filter((inv) => {
      if (!searchQuery) return true;
      return inv.contactName.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a: Invoice, b: Invoice) => {
      if (!sortField) return 0;
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'date') return (parseDate(a.invoiceDate) - parseDate(b.invoiceDate)) * dir;
      return (a.amount - b.amount) * dir;
    });

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-surface-card rounded-xl border border-surface-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Invoices</h2>
        </div>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-surface-border-light rounded-lg p-8 text-center cursor-pointer hover:border-brand-gold/50 hover:bg-surface-card-hover transition-colors"
        >
          <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
            {isUploading ? 'Uploading...' : 'Click to upload CSV file'}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs">MyBillBook invoice report (.csv)</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={onFileChange}
            className="hidden"
          />
        </div>

        {feedback && (
          <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
            {feedback.message}
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {data && data.invoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Invoices" value={String(data.invoices.length)} />
          <SummaryCard label="Total Amount" value={formatCurrency(data.totalAmount)} />
          <SummaryCard label="Remaining" value={formatCurrency(data.totalRemaining)} />
          <SummaryCard
            label="Status"
            value={`${data.paidCount} Paid / ${data.unpaidCount} Unpaid`}
          />
        </div>
      )}

      {/* Invoice Table */}
      <div className="bg-surface-card rounded-xl border border-surface-border overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-gold" />
            All Invoices
          </h2>
          {data && data.invoices.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 bg-surface-card-hover border border-surface-border-light rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-brand-gold/50 w-64"
              />
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading invoices...</div>
        ) : !data || data.invoices.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-gray-500">
            No invoices yet. Upload a CSV to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-card-hover text-gray-500 dark:text-gray-400 text-left text-xs uppercase tracking-wider">
                  <th className="px-4 py-3">Invoice #</th>
                  <SortableHeader field="date" label="Date" currentField={sortField} direction={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3">Contact</th>
                  <SortableHeader field="amount" label="Amount" currentField={sortField} direction={sortDir} onSort={handleSort} align="right" />
                  <th className="px-4 py-3 text-right">Remaining</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.invoiceNo} className="hover:bg-surface-card-hover transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{inv.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{inv.invoiceDate}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{inv.contactName}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-right">{formatCurrency(inv.amount)}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-right">{formatCurrency(inv.remainingAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        inv.invoiceStatus === 'Paid'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'
                      }`}>
                        {inv.invoiceStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{inv.dueDate || '—'}</td>
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
                {filteredInvoices.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                      No invoices match &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function SortableHeader({
  field, label, currentField, direction, onSort, align,
}: {
  field: 'date' | 'amount';
  label: string;
  currentField: 'date' | 'amount' | null;
  direction: 'asc' | 'desc';
  onSort: (field: 'date' | 'amount') => void;
  align?: 'right';
}) {
  const active = currentField === field;
  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 transition-colors ${align === 'right' ? 'text-right' : ''}`}
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

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-gray-900 dark:text-white font-semibold text-sm">{value}</p>
    </div>
  );
}
