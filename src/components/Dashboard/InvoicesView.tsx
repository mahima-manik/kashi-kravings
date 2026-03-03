'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import type { InvoiceData, ApiResponse } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import InvoiceTable from './InvoiceTable';

type Firm = 'kashi_kravings' | 'prime_traders';

export default function InvoicesView() {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFirm, setUploadFirm] = useState<Firm | null>(null);
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
    if (!uploadFirm) return;
    setIsUploading(true);
    setFeedback(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('firm', uploadFirm);

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
        setTimeout(() => setShowUpload(false), 1500);
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

  const allInvoices = data?.invoices ?? [];
  return (
    <div className="space-y-6">
      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUpload(false)}>
          <div className="bg-surface-card rounded-xl border border-surface-border p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Invoices</h2>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              onClick={() => uploadFirm && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                uploadFirm
                  ? 'border-surface-border-light cursor-pointer hover:border-brand-gold/50 hover:bg-surface-card-hover'
                  : 'border-surface-border-light/50 cursor-not-allowed opacity-50'
              }`}
            >
              <Upload className="h-10 w-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-1">
                {!uploadFirm ? 'Select a firm first' : isUploading ? 'Uploading...' : 'Click to upload CSV file'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">MyBillBook invoice report (.csv)</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={onFileChange}
                disabled={!uploadFirm}
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
        </div>
      )}

      {/* Summary Cards */}
      {allInvoices.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Invoices" value={String(allInvoices.length)} />
          <SummaryCard label="Total Amount" value={formatCurrency(allInvoices.reduce((sum, inv) => sum + inv.amount, 0))} />
          <SummaryCard label="Remaining" value={formatCurrency(allInvoices.reduce((sum, inv) => sum + inv.remainingAmount, 0))} />
          <SummaryCard
            label="Status"
            value={`${allInvoices.filter(inv => inv.invoiceStatus === 'Paid').length} Paid / ${allInvoices.filter(inv => inv.invoiceStatus !== 'Paid').length} Unpaid`}
          />
        </div>
      )}

      {/* Upload button + Invoice Table */}
      {isLoading ? (
        <div className="bg-surface-card rounded-xl border border-surface-border p-8 text-center text-gray-500 dark:text-gray-400">Loading invoices...</div>
      ) : (
        <div className="relative">
          <div className="absolute right-4 sm:right-6 top-4 z-10">
            <button
              onClick={() => { setShowUpload(true); setUploadFirm(null); setFeedback(null); }}
              className="inline-flex items-center gap-2 px-3 py-2 bg-brand-gold/10 border border-brand-gold/30 text-brand-gold text-sm font-medium rounded-lg hover:bg-brand-gold/20 transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload CSV</span>
            </button>
          </div>
          <InvoiceTable
            invoices={allInvoices}
            showSearch
          />
        </div>
      )}
    </div>
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
