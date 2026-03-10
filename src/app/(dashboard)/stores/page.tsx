'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Loader2, IndianRupee, FileText, ArrowUpDown, Filter, LayoutGrid, Table2, TrendingUp, TrendingDown, Minus, AlertTriangle, ChevronUp, ChevronDown, Info, X } from 'lucide-react';
import { Invoice, InvoiceData, ApiResponse } from '@/lib/types';
import type { Store, StoreTier } from '@/lib/stores';
import { STORE_TIERS } from '@/lib/stores';
import { formatCurrency } from '@/lib/format';
import { computeStoreIntelligence, type StoreIntelligence } from '@/lib/store-intelligence';

type SortOption = 'amount-desc' | 'amount-asc' | 'due-desc' | 'name-asc' | 'collected-asc' | 'health-desc' | 'last-order-asc' | 'aov-desc';
type FilterOption = 'all' | 'has-dues' | 'fully-paid' | 'company_promoter' | 'store_promoter' | 'no_promoter' | 'needs-attention';
type ViewMode = 'table' | 'grid';
type TableSortKey = 'name' | 'tier' | 'health' | 'lastOrder' | 'frequency' | 'aov' | 'trend' | 'totalAmount' | 'outstanding';

interface StoreCard {
  name: string;
  storeCode: string | null;
  tier: StoreTier | null;
  invoiceCount: number;
  totalAmount: number;
  totalRemaining: number;
  paidCount: number;
  unpaidCount: number;
  intelligence: StoreIntelligence | null;
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

function HealthBadge({ score }: { score: number }) {
  let color = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (score >= 70) color = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
  else if (score >= 40) color = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {score}
    </span>
  );
}

function HealthDot({ score }: { score: number }) {
  let color = 'bg-red-500';
  if (score >= 70) color = 'bg-green-500';
  else if (score >= 40) color = 'bg-yellow-500';
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} title={`Health: ${score}`} />;
}

function TrendIcon({ trend }: { trend: 'up' | 'flat' | 'down' | null }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
  if (trend === 'flat') return <Minus className="h-4 w-4 text-gray-400" />;
  return <span className="text-xs text-gray-400">—</span>;
}

function LastOrderText({ days, avgFreq }: { days: number | null; avgFreq: number | null }) {
  if (days === null) return <span className="text-gray-400">—</span>;
  let color = 'text-green-600 dark:text-green-400';
  if (avgFreq !== null) {
    if (days > avgFreq * 2) color = 'text-red-600 dark:text-red-400';
    else if (days > avgFreq) color = 'text-yellow-600 dark:text-yellow-400';
  }
  return <span className={`font-medium ${color}`}>{days}d ago</span>;
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

function groupByStore(invoices: Invoice[], stores: Store[], intel: Map<string, StoreIntelligence>): StoreCard[] {
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
        intelligence: intel.get(name) ?? null,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

export default function StoresPage() {
  const [storeCards, setStoreCards] = useState<StoreCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('health-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [tableSortKey, setTableSortKey] = useState<TableSortKey>('health');
  const [tableSortAsc, setTableSortAsc] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const filteredStores = useMemo(() => {
    let result = storeCards;

    if (filterBy === 'has-dues') {
      result = result.filter(s => s.totalRemaining > 0);
    } else if (filterBy === 'fully-paid') {
      result = result.filter(s => s.totalRemaining === 0);
    } else if (filterBy === 'company_promoter' || filterBy === 'store_promoter' || filterBy === 'no_promoter') {
      result = result.filter(s => s.tier === filterBy);
    } else if (filterBy === 'needs-attention') {
      result = result.filter(s => {
        const intel = s.intelligence;
        if (!intel) return false;
        return intel.isOverdueForOrder || intel.healthScore < 40;
      });
    }

    if (viewMode === 'table') {
      return [...result].sort((a, b) => {
        let cmp = 0;
        switch (tableSortKey) {
          case 'name': cmp = a.name.localeCompare(b.name); break;
          case 'tier': cmp = (a.tier ?? '').localeCompare(b.tier ?? ''); break;
          case 'health': cmp = (a.intelligence?.healthScore ?? 0) - (b.intelligence?.healthScore ?? 0); break;
          case 'lastOrder': cmp = (a.intelligence?.lastOrderDaysAgo ?? 9999) - (b.intelligence?.lastOrderDaysAgo ?? 9999); break;
          case 'frequency': cmp = (a.intelligence?.avgFrequencyDays ?? 9999) - (b.intelligence?.avgFrequencyDays ?? 9999); break;
          case 'aov': cmp = (a.intelligence?.aov ?? 0) - (b.intelligence?.aov ?? 0); break;
          case 'trend': {
            const order = { up: 3, flat: 2, down: 1 };
            cmp = (order[a.intelligence?.trend ?? 'flat'] ?? 0) - (order[b.intelligence?.trend ?? 'flat'] ?? 0);
            break;
          }
          case 'totalAmount': cmp = a.totalAmount - b.totalAmount; break;
          case 'outstanding': cmp = (a.intelligence?.outstandingRatio ?? 0) - (b.intelligence?.outstandingRatio ?? 0); break;
        }
        return tableSortAsc ? cmp : -cmp;
      });
    }

    return [...result].sort((a, b) => {
      switch (sortBy) {
        case 'amount-desc': return b.totalAmount - a.totalAmount;
        case 'amount-asc': return a.totalAmount - b.totalAmount;
        case 'due-desc': return b.totalRemaining - a.totalRemaining;
        case 'name-asc': return a.name.localeCompare(b.name);
        case 'health-desc': return (b.intelligence?.healthScore ?? 0) - (a.intelligence?.healthScore ?? 0);
        case 'last-order-asc': return (a.intelligence?.lastOrderDaysAgo ?? 9999) - (b.intelligence?.lastOrderDaysAgo ?? 9999);
        case 'aov-desc': return (b.intelligence?.aov ?? 0) - (a.intelligence?.aov ?? 0);
        case 'collected-asc': {
          const pctA = a.totalAmount > 0 ? (a.totalAmount - a.totalRemaining) / a.totalAmount : 0;
          const pctB = b.totalAmount > 0 ? (b.totalAmount - b.totalRemaining) / b.totalAmount : 0;
          return pctA - pctB;
        }
        default: return 0;
      }
    });
  }, [storeCards, sortBy, filterBy, viewMode, tableSortKey, tableSortAsc]);

  // Group by tier for grid display
  const groupedByTier = useMemo(() => {
    const tiers: StoreTier[] = ['company_promoter', 'store_promoter', 'no_promoter'];
    return tiers.map(tier => ({
      tier,
      label: STORE_TIERS[tier],
      stores: filteredStores.filter(s => s.tier === tier),
    })).filter(g => g.stores.length > 0);
  }, [filteredStores]);

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
          const intel = computeStoreIntelligence(invoicesResult.data.invoices);
          setStoreCards(groupByStore(invoicesResult.data.invoices, stores, intel));
        }
      } catch {
        setError('Failed to fetch data');
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  function handleTableSort(key: TableSortKey) {
    if (tableSortKey === key) {
      setTableSortAsc(!tableSortAsc);
    } else {
      setTableSortKey(key);
      setTableSortAsc(key === 'name' || key === 'lastOrder' || key === 'frequency');
    }
  }

  function SortHeader({ label, sortKey }: { label: string; sortKey: TableSortKey }) {
    const active = tableSortKey === sortKey;
    return (
      <th
        className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-brand-gold select-none whitespace-nowrap"
        onClick={() => handleTableSort(sortKey)}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {active && (tableSortAsc ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        </span>
      </th>
    );
  }

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
    const intel = store.intelligence;
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
            {intel && <HealthDot score={intel.healthScore} />}
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

          {/* Intelligence extras */}
          {intel && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <LastOrderText days={intel.lastOrderDaysAgo} avgFreq={intel.avgFrequencyDays} />
              {intel.isOverdueForOrder && (
                <span className="inline-flex items-center gap-0.5 text-red-600 dark:text-red-400 font-medium">
                  <AlertTriangle className="h-3 w-3" /> Overdue
                </span>
              )}
            </div>
          )}
        </Link>
      </div>
    );
  }

  function renderTableView() {
    return (
      <div className="overflow-x-auto bg-surface-card border border-surface-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="border-b border-surface-border">
            <tr>
              <SortHeader label="Store" sortKey="name" />
              <SortHeader label="Tier" sortKey="tier" />
              <SortHeader label="Health" sortKey="health" />
              <SortHeader label="Last Order" sortKey="lastOrder" />
              <SortHeader label="Frequency" sortKey="frequency" />
              <SortHeader label="AOV" sortKey="aov" />
              <SortHeader label="Trend" sortKey="trend" />
              <SortHeader label="Total" sortKey="totalAmount" />
              <SortHeader label="Outstanding" sortKey="outstanding" />
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filteredStores.map(store => {
              const intel = store.intelligence;
              return (
                <tr
                  key={store.name}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  onClick={() => { window.location.href = `/stores/${encodeURIComponent(store.name)}`; }}
                >
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {intel?.isOverdueForOrder && <AlertTriangle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />}
                      <span className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{store.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {store.tier ? <TierBadge tier={store.tier} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    {intel ? <HealthBadge score={intel.healthScore} /> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <LastOrderText days={intel?.lastOrderDaysAgo ?? null} avgFreq={intel?.avgFrequencyDays ?? null} />
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                    {intel?.avgFrequencyDays != null ? `Every ${intel.avgFrequencyDays}d` : '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300">
                    {intel ? formatCurrency(intel.aov) : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <TrendIcon trend={intel?.trend ?? null} />
                  </td>
                  <td className="px-3 py-3 text-gray-700 dark:text-gray-300 font-medium">
                    {formatCurrency(store.totalAmount)}
                  </td>
                  <td className="px-3 py-3">
                    {intel ? (
                      <span className={`font-medium ${intel.outstandingRatio > 50 ? 'text-red-600 dark:text-red-400' : intel.outstandingRatio > 20 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}`}>
                        {Math.round(intel.outstandingRatio)}%
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredStores.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400 text-sm">
            No stores match the current filter.
          </div>
        )}
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
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stores</h2>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-1 rounded-md transition-colors ${showInfo ? 'text-brand-gold bg-brand-gold/10' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="What do these metrics mean?"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {filteredStores.length}{filterBy !== 'all' ? ` of ${storeCards.length}` : ''} stores
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-surface-card border border-surface-border rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Table view"
            >
              <Table2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-brand-gold/10 text-brand-gold' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-gray-400" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="text-sm bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
            >
              <option value="all">All stores</option>
              <option value="needs-attention">Needs Attention</option>
              <option value="has-dues">Has dues</option>
              <option value="fully-paid">Fully paid</option>
              <option value="company_promoter">Company Promoter</option>
              <option value="store_promoter">Store Promoter</option>
              <option value="no_promoter">No Promoter</option>
            </select>
          </div>

          {viewMode === 'grid' && (
            <div className="flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm bg-surface-card border border-surface-border rounded-lg px-2.5 py-1.5 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                <option value="health-desc">Health Score</option>
                <option value="amount-desc">Amount: High to Low</option>
                <option value="amount-asc">Amount: Low to High</option>
                <option value="aov-desc">AOV: High to Low</option>
                <option value="last-order-asc">Last Order: Recent</option>
                <option value="due-desc">Most Due</option>
                <option value="collected-asc">Least Collected</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Metrics explainer */}
      {showInfo && (
        <div className="mb-6 bg-surface-card border border-surface-border rounded-xl p-4 relative">
          <button
            onClick={() => setShowInfo(false)}
            className="absolute top-3 right-3 p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Metrics Guide</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Health Score</span> — Composite 0-100 based on recency (30%), frequency (20%), order value (25%), and payment reliability (25%). Green 70+, yellow 40-69, red &lt;40.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Last Order</span> — Days since the store&apos;s most recent invoice. Color-coded: green if within average frequency, yellow if 1-2x, red if &gt;2x.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Frequency</span> — Average number of days between consecutive invoices for that store.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">AOV (Avg Order Value)</span> — Total invoice amount divided by total number of invoices.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Trend</span> — Revenue direction over the last 3 months (month-over-month comparison). Up if &gt;10% growth, down if &gt;10% decline, flat otherwise.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Outstanding %</span> — Percentage of total invoice amount that is still unpaid (remaining amount / total amount). Green &lt;20%, yellow 20-50%, red &gt;50%.</div>
            <div><span className="font-medium text-gray-800 dark:text-gray-200">Needs Attention</span> — Filter showing stores that are overdue for an order (last order &gt; 1.5x avg frequency) or have a health score below 40.</div>
          </div>
        </div>
      )}

      {viewMode === 'table' ? (
        renderTableView()
      ) : (
        <>
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
      )}
    </>
  );
}
