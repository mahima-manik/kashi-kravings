'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { ApiResponse, Invoice, InvoiceData, SalesRecord, DashboardData } from '@/lib/types';
import { findStoreCode, STORES } from '@/lib/stores';
import { formatCurrency } from '@/lib/format';
import { InvoiceTable } from '@/components/Dashboard';

type Tab = 'sales' | 'invoices';

interface DailySales {
  date: string;
  saleValue: number;
  collectionReceived: number;
  totalUnits: number;
  numTSO: number;
  promotionDuration: number;
  sampleGiven: number;
  sampleConsumed: number;
  entries: number;
}

function formatDateDMY(dateStr: string): string {
  // Convert YYYY-MM-DD to DD/MM/YYYY to match invoice date format
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function aggregateDailySales(records: SalesRecord[]): DailySales[] {
  const map = new Map<string, DailySales>();

  for (const r of records) {
    if (!r.date) continue;
    const units = r.paanL + r.thandaiL + r.giloriL + r.paanS + r.thandaiS + r.giloriS + r.heritageBox9 + r.heritageBox15;
    const existing = map.get(r.date);
    if (existing) {
      existing.saleValue += r.saleValue;
      existing.collectionReceived += r.collectionReceived;
      existing.totalUnits += units;
      existing.numTSO += r.numTSO;
      existing.promotionDuration += r.promotionDuration;
      existing.sampleGiven += r.sampleGiven;
      existing.sampleConsumed += r.sampleConsumed;
      existing.entries += 1;
    } else {
      map.set(r.date, {
        date: r.date,
        saleValue: r.saleValue,
        collectionReceived: r.collectionReceived,
        totalUnits: units,
        numTSO: r.numTSO,
        promotionDuration: r.promotionDuration,
        sampleGiven: r.sampleGiven,
        sampleConsumed: r.sampleConsumed,
        entries: 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

export default function StoreDetailPage({ params }: { params: { storeCode: string } }) {
  const storeName = decodeURIComponent(params.storeCode);
  const storeCode = findStoreCode(storeName);

  const storeEntry = STORES.find(s => s.code === storeCode);
  const canonicalName = storeEntry?.name ?? storeName;

  const [activeTab, setActiveTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/invoices');
        const result: ApiResponse<InvoiceData> = await res.json();
        if (result.success && result.data) {
          setInvoices(result.data.invoices.filter(inv => inv.contactName === storeName));
        }
      } catch {
        setError('Failed to fetch invoices');
      } finally {
        setIsLoadingInvoices(false);
      }
    }

    async function fetchSales() {
      try {
        const res = await fetch('/api/sales');
        const result: ApiResponse<DashboardData> = await res.json();
        if (result.success && result.data) {
          const filtered = result.data.salesRecords.filter(r =>
            (storeCode && r.location === storeCode) ||
            r.storeName.toLowerCase() === canonicalName.toLowerCase()
          );
          setSalesRecords(filtered);
        }
      } catch {
        // Sales data is supplementary, don't block on error
      } finally {
        setIsLoadingSales(false);
      }
    }

    fetchInvoices();
    fetchSales();
  }, [storeName, storeCode, canonicalName]);

  const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalRemaining = invoices.reduce((s, inv) => s + inv.remainingAmount, 0);
  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;

  const dailySales = useMemo(() => aggregateDailySales(salesRecords), [salesRecords]);

  const totalSalesValue = salesRecords.reduce((s, r) => s + r.saleValue, 0);
  const totalTSOs = salesRecords.reduce((s, r) => s + r.numTSO, 0);

  const isLoading = isLoadingInvoices && isLoadingSales;

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
              src={`/stores/${storeCode || encodeURIComponent(storeName)}.jpg`}
              alt={storeName}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{storeName}</h2>
            {storeCode && <p className="text-sm text-gray-500 dark:text-gray-400">{storeCode}</p>}
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {(invoices.length > 0 || salesRecords.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard label="Total Sales" value={salesRecords.length > 0 ? formatCurrency(totalSalesValue) : '—'} />
          <SummaryCard label="Invoice Amount" value={invoices.length > 0 ? formatCurrency(totalAmount) : '—'} />
          <SummaryCard label="Remaining" value={invoices.length > 0 ? formatCurrency(totalRemaining) : '—'} warn={totalRemaining > 0} />
          <SummaryCard label="Status" value={invoices.length > 0 ? `${paidCount} Paid / ${unpaidCount} Unpaid` : '—'} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b border-surface-border">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'invoices'
              ? 'border-brand-gold text-brand-gold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Invoices{invoices.length > 0 && ` (${invoices.length})`}
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'sales'
              ? 'border-brand-gold text-brand-gold'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Daily Sales{dailySales.length > 0 && ` (${dailySales.length})`}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold" />
        </div>
      ) : (
        <>
          {/* Sales Tab */}
          {activeTab === 'sales' && (
            isLoadingSales ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
              </div>
            ) : dailySales.length > 0 ? (
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
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{formatCurrency(salesRecords.reduce((s, r) => s + r.collectionReceived, 0))}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{salesRecords.reduce((s, r) => s + r.paanL + r.thandaiL + r.giloriL + r.paanS + r.thandaiS + r.giloriS + r.heritageBox9 + r.heritageBox15, 0)}</td>
                        <td className="px-4 py-3 text-right text-green-700 dark:text-green-400">{totalTSOs}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">{salesRecords.reduce((s, r) => s + r.promotionDuration, 0)}</td>
                        <td className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                          {salesRecords.reduce((s, r) => s + r.sampleGiven, 0)} / {salesRecords.reduce((s, r) => s + r.sampleConsumed, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                No sales data available for this store.
              </div>
            )
          )}

          {/* Invoices Tab */}
          {activeTab === 'invoices' && (
            isLoadingInvoices ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
              </div>
            ) : invoices.length > 0 ? (
              <InvoiceTable invoices={invoices} />
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
                No invoices found for this store.
              </div>
            )
          )}
        </>
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
