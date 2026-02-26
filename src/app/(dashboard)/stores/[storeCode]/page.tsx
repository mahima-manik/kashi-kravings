'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft } from 'lucide-react';
import { ApiResponse, Invoice, InvoiceData, STORE_MAP } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { InvoiceTable } from '@/components/Dashboard';

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
          setInvoices(result.data.invoices.filter(inv => matchesStore(inv.contactName, storeName)));
        }
      } catch {
        setError('Failed to fetch invoices');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [storeName]);

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

      {/* Invoice table — shared component */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold" />
        </div>
      ) : (
        <InvoiceTable invoices={invoices} />
      )}
    </>
  );
}

function SummaryCard({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="bg-surface-card rounded-xl border border-surface-border p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`font-semibold text-sm ${warn ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</p>
    </div>
  );
}
