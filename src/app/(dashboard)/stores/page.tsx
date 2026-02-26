'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, IndianRupee, FileText, ArrowUpDown, Filter } from 'lucide-react';
import { Invoice, InvoiceData, ApiResponse } from '@/lib/types';
import { findStoreCode } from '@/lib/stores';

type SortOption = 'amount-desc' | 'amount-asc' | 'due-desc' | 'name-asc' | 'collected-asc';
type FilterOption = 'all' | 'has-dues' | 'fully-paid';

interface StoreCard {
  name: string;
  storeCode: string | null;
  invoiceCount: number;
  totalAmount: number;
  totalRemaining: number;
  paidCount: number;
  unpaidCount: number;
}

function groupByStore(invoices: Invoice[]): StoreCard[] {
  const map = new Map<string, StoreCard>();

  for (const inv of invoices) {
    const name = inv.contactName;
    if (!name) continue;

    const existing = map.get(name);
    if (existing) {
      existing.invoiceCount++;
      existing.totalAmount += inv.amount;
      existing.totalRemaining += inv.remainingAmount;
      if (inv.invoiceStatus === 'Paid') existing.paidCount++;
      else existing.unpaidCount++;
    } else {
      map.set(name, {
        name,
        storeCode: findStoreCode(name),
        invoiceCount: 1,
        totalAmount: inv.amount,
        totalRemaining: inv.remainingAmount,
        paidCount: inv.invoiceStatus === 'Paid' ? 1 : 0,
        unpaidCount: inv.invoiceStatus === 'Paid' ? 0 : 1,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export default function StoresPage() {
  const [stores, setStores] = useState<StoreCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('amount-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredStores = useMemo(() => {
    let result = stores;

    if (filterBy === 'has-dues') {
      result = result.filter(s => s.totalRemaining > 0);
    } else if (filterBy === 'fully-paid') {
      result = result.filter(s => s.totalRemaining === 0);
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'amount-desc': return b.totalAmount - a.totalAmount;
        case 'amount-asc': return a.totalAmount - b.totalAmount;
        case 'due-desc': return b.totalRemaining - a.totalRemaining;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'collected-asc': {
          const pctA = a.totalAmount > 0 ? (a.totalAmount - a.totalRemaining) / a.totalAmount : 0;
          const pctB = b.totalAmount > 0 ? (b.totalAmount - b.totalRemaining) / b.totalAmount : 0;
          return pctA - pctB;
        }
        default: return 0;
      }
    });
  }, [stores, sortBy, filterBy]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/invoices');
        const result: ApiResponse<InvoiceData> = await res.json();
        if (result.success && result.data) {
          setStores(groupByStore(result.data.invoices));
        }
      } catch {
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading stores...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stores</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredStores.length}{filterBy !== 'all' ? ` of ${stores.length}` : ''} stores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="text-sm bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="all">All stores</option>
              <option value="has-dues">Has dues</option>
              <option value="fully-paid">Fully paid</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="amount-desc">Amount: High to Low</option>
              <option value="amount-asc">Amount: Low to High</option>
              <option value="due-desc">Most Due</option>
              <option value="collected-asc">Least Collected</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredStores.map((store) => (
          <Link
            key={store.name}
            href={`/stores/${encodeURIComponent(store.name)}`}
            className="group bg-surface-card border border-surface-border rounded-xl p-4 hover:border-brand-gold/50 hover:shadow-md transition-all"
          >
            {/* Store image with initials fallback */}
            <div className="relative w-full h-32 rounded-lg bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center mb-3 overflow-hidden">
              <span className="text-3xl font-bold text-brand-olive/60 dark:text-brand-gold/60">
                {store.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
              </span>
              <img
                src={`/stores/${store.storeCode || encodeURIComponent(store.name)}.jpg`}
                alt={store.name}
                className="absolute inset-0 w-full h-full object-cover rounded-lg"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            {/* Store name & code */}
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors truncate">
              {store.name}
            </h3>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2 text-sm mt-3">
              <div className="flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-gray-700 dark:text-gray-300">{store.totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-gray-700 dark:text-gray-300">{store.invoiceCount} invoices</span>
              </div>
            </div>

            {/* Collection circular indicator */}
            {(() => {
              const pct = store.totalAmount > 0 ? Math.round(((store.totalAmount - store.totalRemaining) / store.totalAmount) * 100) : 0;
              const r = 10;
              const circ = 2 * Math.PI * r;
              const offset = circ - (pct / 100) * circ;
              return (
                <div className="mt-3 pt-3 border-t border-surface-border-light flex items-center gap-2">
                  <svg width="28" height="28" viewBox="0 0 28 28">
                    <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-200 dark:text-gray-700" />
                    <circle cx="14" cy="14" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-green-500" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset} transform="rotate(-90 14 14)" />
                  </svg>
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{pct}% collected</span>
                </div>
              );
            })()}
          </Link>
        ))}
      </div>
    </>
  );
}
