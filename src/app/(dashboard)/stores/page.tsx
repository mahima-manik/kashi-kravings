'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, IndianRupee, FileText, ArrowUpDown, Filter } from 'lucide-react';
import { Invoice, InvoiceData, ApiResponse } from '@/lib/types';
import type { Store, StoreTier } from '@/lib/stores';
import { STORE_TIERS } from '@/lib/stores';

type SortOption = 'amount-desc' | 'amount-asc' | 'due-desc' | 'name-asc' | 'collected-asc';
type FilterOption = 'all' | 'has-dues' | 'fully-paid' | 'company_promoter' | 'store_promoter' | 'no_promoter';

interface StoreCard {
  name: string;
  storeCode: string | null;
  tier: StoreTier | null;
  invoiceCount: number;
  totalAmount: number;
  totalRemaining: number;
  paidCount: number;
  unpaidCount: number;
}

const TIER_BADGE_CLASSES: Record<StoreTier, string> = {
  company_promoter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  store_promoter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  no_promoter: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

function TierBadge({ tier }: { tier: StoreTier }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE_CLASSES[tier]}`}>
      {STORE_TIERS[tier]}
    </span>
  );
}

function findStoreCodeLocal(contactName: string, stores: Store[]): { code: string; tier: StoreTier } | null {
  const lower = contactName.toLowerCase();
  for (const store of stores) {
    if (lower.startsWith(store.name.toLowerCase())) return { code: store.code, tier: store.tier };
    for (const alias of store.aliases ?? []) {
      if (lower.startsWith(alias.toLowerCase())) return { code: store.code, tier: store.tier };
    }
  }
  return null;
}

function groupByStore(invoices: Invoice[], stores: Store[]): StoreCard[] {
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
      const match = findStoreCodeLocal(name, stores);
      map.set(name, {
        name,
        storeCode: match?.code ?? null,
        tier: match?.tier ?? null,
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
  const [storeCards, setStoreCards] = useState<StoreCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('amount-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  const filteredStores = useMemo(() => {
    let result = storeCards;

    if (filterBy === 'has-dues') {
      result = result.filter(s => s.totalRemaining > 0);
    } else if (filterBy === 'fully-paid') {
      result = result.filter(s => s.totalRemaining === 0);
    } else if (filterBy === 'company_promoter' || filterBy === 'store_promoter' || filterBy === 'no_promoter') {
      result = result.filter(s => s.tier === filterBy);
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
  }, [storeCards, sortBy, filterBy]);

  // Group by tier for display
  const groupedByTier = useMemo(() => {
    const tiers: StoreTier[] = ['company_promoter', 'store_promoter', 'no_promoter'];
    return tiers.map(tier => ({
      tier,
      label: STORE_TIERS[tier],
      stores: filteredStores.filter(s => s.tier === tier),
    })).filter(g => g.stores.length > 0);
  }, [filteredStores]);

  // Stores without a tier match (shouldn't happen after discovery, but just in case)
  const untiedStores = useMemo(() =>
    filteredStores.filter(s => s.tier === null),
  [filteredStores]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invoicesRes, storesRes] = await Promise.all([
          fetch('/api/invoices'),
          fetch('/api/stores'),
        ]);
        const invoicesResult: ApiResponse<InvoiceData> = await invoicesRes.json();
        const storesResult: ApiResponse<Store[]> = await storesRes.json();

        const stores = storesResult.success && storesResult.data ? storesResult.data : [];

        if (invoicesResult.success && invoicesResult.data) {
          setStoreCards(groupByStore(invoicesResult.data.invoices, stores));
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

  function renderStoreCard(store: StoreCard) {
    return (
      <div key={store.name} className="group relative bg-surface-card border border-surface-border rounded-xl p-4 hover:border-brand-gold/50 hover:shadow-md transition-all">
        <Link href={`/stores/${encodeURIComponent(store.name)}`} className="block">
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

          {/* Store name & tier badge */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors truncate">
              {store.name}
            </h3>
          </div>
          {store.tier && <div className="mb-2"><TierBadge tier={store.tier} /></div>}

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm mt-2">
            <div className="flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              <span className="text-gray-700 dark:text-gray-300">{store.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-700 dark:text-gray-300">{store.invoiceCount} invoices</span>
            </div>
          </div>
        </Link>
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
            {filteredStores.length}{filterBy !== 'all' ? ` of ${storeCards.length}` : ''} stores
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
              <option value="company_promoter">Company Promoter</option>
              <option value="store_promoter">Store Promoter</option>
              <option value="no_promoter">No Promoter</option>
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

      {/* Grouped by tier */}
      {groupedByTier.map(group => (
        <div key={group.tier} className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {group.label}
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">({group.stores.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.stores.map(renderStoreCard)}
          </div>
        </div>
      ))}

      {/* Unmatched stores (no tier) */}
      {untiedStores.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              Unclassified
            </h3>
            <span className="text-xs text-gray-400 dark:text-gray-500">({untiedStores.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {untiedStores.map(renderStoreCard)}
          </div>
        </div>
      )}
    </>
  );
}
