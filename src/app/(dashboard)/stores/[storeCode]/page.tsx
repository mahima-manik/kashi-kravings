'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Pencil, Trash2, X, Check } from 'lucide-react';
import { ApiResponse, Invoice, InvoiceData, SalesRecord, DashboardData, DailySales } from '@/lib/types';
import type { Store, StoreTier } from '@/lib/stores';
import { STORE_TIERS } from '@/lib/stores';
import { formatCurrency } from '@/lib/format';
import { InvoiceTable, StoreDailySalesTable, AgingDistribution, StoreAnalytics, MetricCard } from '@/components/Dashboard';
import { getUnpaidInvoices, computeAgingBuckets } from '@/lib/aging';
import { computeStoreIntelligence } from '@/lib/store-intelligence';

type Tab = 'sales' | 'invoices' | 'analytics';

const TIER_BADGE_CLASSES: Record<StoreTier, string> = {
  company_promoter: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  store_promoter: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  no_promoter: 'bg-gray-100 text-gray-600 dark:bg-gray-700/50 dark:text-gray-400',
};

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

function findStoreCodeLocal(contactName: string, stores: Store[]): string | null {
  const lower = contactName.toLowerCase();
  for (const store of stores) {
    if (lower.startsWith(store.name.toLowerCase())) return store.code;
    for (const alias of store.aliases ?? []) {
      if (lower.startsWith(alias.toLowerCase())) return store.code;
    }
  }
  return null;
}

export default function StoreDetailPage({ params }: { params: { storeCode: string } }) {
  const router = useRouter();
  const storeName = decodeURIComponent(params.storeCode);

  const [storeList, setStoreList] = useState<Store[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTier, setEditTier] = useState<StoreTier>('no_promoter');
  const [editAddress, setEditAddress] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editContactPhone, setEditContactPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const storeCode = useMemo(() => findStoreCodeLocal(storeName, storeList), [storeName, storeList]);
  const storeEntry = useMemo(() => storeList.find(s => s.code === storeCode), [storeList, storeCode]);
  const canonicalName = storeEntry?.name ?? storeName;

  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then((result: ApiResponse<Store[]>) => {
        if (result.success && result.data) setStoreList(result.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (storeList.length === 0) return;

    const abortController = new AbortController();
    const { signal } = abortController;

    setIsLoadingInvoices(true);
    setIsLoadingSales(true);
    setError(null);

    async function fetchInvoices() {
      try {
        const res = await fetch('/api/invoices', { signal });
        const result: ApiResponse<InvoiceData> = await res.json();
        if (!signal.aborted && result.success && result.data) {
          setInvoices(result.data.invoices.filter(inv => inv.contactName === storeName));
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to fetch invoices');
      } finally {
        if (!signal.aborted) setIsLoadingInvoices(false);
      }
    }

    async function fetchSales() {
      try {
        const res = await fetch('/api/sales', { signal });
        const result: ApiResponse<DashboardData> = await res.json();
        if (!signal.aborted && result.success && result.data) {
          const filtered = result.data.salesRecords.filter(r =>
            (storeCode && r.location === storeCode) ||
            r.storeName.toLowerCase() === canonicalName.toLowerCase()
          );
          setSalesRecords(filtered);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
      } finally {
        if (!signal.aborted) setIsLoadingSales(false);
      }
    }

    fetchInvoices();
    fetchSales();

    return () => { abortController.abort(); };
  }, [storeName, storeCode, canonicalName, storeList]);

  function startEditing() {
    setEditName(storeEntry?.name ?? storeName);
    setEditTier(storeEntry?.tier ?? 'no_promoter');
    setEditAddress(storeEntry?.address ?? '');
    setEditContactName(storeEntry?.contact_name ?? '');
    setEditContactPhone(storeEntry?.contact_phone ?? '');
    setIsEditing(true);
  }

  async function saveEdits() {
    if (!storeCode) return;
    setIsSaving(true);
    try {
      const address = editAddress.trim() || null;
      const contact_name = editContactName.trim() || null;
      const rawPhone = editContactPhone.replace(/\D/g, '');
      if (rawPhone && rawPhone.length !== 10) {
        setError('Phone number must be 10 digits');
        setIsSaving(false);
        return;
      }
      const contact_phone = rawPhone || null;
      const res = await fetch('/api/stores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: storeCode, name: editName, tier: editTier, address, contact_name, contact_phone }),
      });
      const result: ApiResponse<Store> = await res.json();
      if (result.success && result.data) {
        setStoreList(prev => prev.map(s => s.code === storeCode ? result.data! : s));
        setIsEditing(false);
      } else {
        setError(result.error ?? 'Failed to save');
      }
    } catch {
      setError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!storeCode) return;
    try {
      const res = await fetch('/api/stores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: storeCode }),
      });
      const result: ApiResponse<{ deleted: boolean }> = await res.json();
      if (result.success) {
        router.push('/stores');
      } else {
        setError(result.error ?? 'Failed to delete store');
        setDeleteConfirm(false);
      }
    } catch {
      setError('Failed to delete store');
      setDeleteConfirm(false);
    }
  }

  const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalRemaining = invoices.reduce((s, inv) => s + inv.remainingAmount, 0);
  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;

  const dailySales = useMemo(() => aggregateDailySales(salesRecords), [salesRecords]);

  const agingData = useMemo(() => {
    const unpaid = getUnpaidInvoices(invoices);
    return computeAgingBuckets(unpaid);
  }, [invoices]);

  const storeIntel = useMemo(() => {
    if (invoices.length === 0) return null;
    const intel = computeStoreIntelligence(invoices);
    return intel.get(storeName) ?? null;
  }, [invoices, storeName]);

  const totalSalesValue = salesRecords.reduce((s, r) => s + r.saleValue, 0);
  const totalTSOs = salesRecords.reduce((s, r) => s + r.numTSO, 0);
  const totalCollection = salesRecords.reduce((s, r) => s + r.collectionReceived, 0);
  const totalUnits = salesRecords.reduce((s, r) => s + r.paanL + r.thandaiL + r.giloriL + r.paanS + r.thandaiS + r.giloriS + r.heritageBox9 + r.heritageBox15, 0);
  const totalPromotionHours = salesRecords.reduce((s, r) => s + r.promotionDuration, 0);
  const totalSamplesGiven = salesRecords.reduce((s, r) => s + r.sampleGiven, 0);
  const totalSamplesConsumed = salesRecords.reduce((s, r) => s + r.sampleConsumed, 0);

  const isLoading = isLoadingInvoices || isLoadingSales;

  return (
    <>
      {/* Back + header */}
      <div className="mb-6">
        <Link href="/stores" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-gold transition-colors mb-3">
          <ArrowLeft className="h-4 w-4" /> All Stores
        </Link>

        {isEditing ? (
          <div className="bg-surface-card border border-surface-border rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tier</label>
              <select
                value={editTier}
                onChange={e => setEditTier(e.target.value as StoreTier)}
                className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
              >
                {(Object.entries(STORE_TIERS) as [StoreTier, string][]).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Address</label>
              <input
                type="text"
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
                className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                placeholder="e.g. Dashashwamedh Ghat, Varanasi"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contact Name</label>
              <input
                type="text"
                value={editContactName}
                onChange={e => setEditContactName(e.target.value)}
                className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                placeholder="e.g. Rajesh Kumar"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contact Phone (10 digits)</label>
              <input
                type="tel"
                value={editContactPhone}
                onChange={e => setEditContactPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full text-sm bg-white dark:bg-gray-900 border border-surface-border rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-gold"
                placeholder="e.g. 9876543210"
                maxLength={10}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdits}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-brand-gold text-white hover:bg-brand-gold/90 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Save
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-surface-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </button>
            </div>
          </div>
        ) : (
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{canonicalName}</h2>
                {storeEntry?.tier && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TIER_BADGE_CLASSES[storeEntry.tier]}`}>
                    {STORE_TIERS[storeEntry.tier]}
                  </span>
                )}
              </div>
              {storeCode && <p className="text-sm text-gray-500 dark:text-gray-400">{storeCode}</p>}
              {storeEntry?.aliases && storeEntry.aliases.length > 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Aliases: {storeEntry.aliases.join(', ')}
                </p>
              )}
              {storeEntry?.address && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {storeEntry.address}
                </p>
              )}
              {(storeEntry?.contact_name || storeEntry?.contact_phone) && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {storeEntry.contact_name && <span>{storeEntry.contact_name}</span>}
                  {storeEntry.contact_name && storeEntry.contact_phone && <span> &middot; </span>}
                  {storeEntry.contact_phone && (
                    <a href={`tel:${storeEntry.contact_phone}`} className="hover:text-brand-gold transition-colors">
                      {storeEntry.contact_phone}
                    </a>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {storeCode && (
                <>
                  <button
                    onClick={startEditing}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-gold hover:bg-brand-gold/10 transition-colors"
                    title="Edit store"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                    title="Delete store"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 max-w-sm mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Store</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete <strong>{canonicalName}</strong>? Invoice data will be preserved but unlinked.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 text-sm rounded-lg border border-surface-border text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Summary cards */}
      {(invoices.length > 0 || salesRecords.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard label="Total Sales" value={salesRecords.length > 0 ? formatCurrency(totalSalesValue) : '—'} />
          <MetricCard label="Invoice Amount" value={invoices.length > 0 ? formatCurrency(totalAmount) : '—'} />
          <MetricCard label="Remaining" value={invoices.length > 0 ? formatCurrency(totalRemaining) : '—'} warn={totalRemaining > 0} />
          <MetricCard label="Status" value={invoices.length > 0 ? `${paidCount} Paid / ${unpaidCount} Unpaid` : '—'} />
        </div>
      )}

      {/* Intelligence Metrics */}
      {storeIntel && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <MetricCard
            label="Avg Order Value"
            value={formatCurrency(storeIntel.aov)}
          />
          <MetricCard
            label="Order Frequency"
            value={storeIntel.avgFrequencyDays != null ? `Every ${storeIntel.avgFrequencyDays} days` : '—'}
          />
          <MetricCard
            label="Last Order"
            value={storeIntel.lastOrderDaysAgo != null ? `${storeIntel.lastOrderDaysAgo} days ago` : '—'}
            warn={storeIntel.isOverdueForOrder}
            subtitle={storeIntel.isOverdueForOrder ? 'Overdue for order' : undefined}
          />
          <MetricCard
            label="Payment Reliability"
            value={`${Math.round(storeIntel.paidPct)}%`}
            warn={storeIntel.paidPct < 50}
          />
          <MetricCard
            label="Health Score"
            value={`${storeIntel.healthScore}/100`}
            warn={storeIntel.healthScore < 40}
            subtitle={storeIntel.healthScore >= 70 ? 'Healthy' : storeIntel.healthScore >= 40 ? 'Moderate' : 'At Risk'}
          />
        </div>
      )}

      {/* Aging Breakdown */}
      {!isLoadingInvoices && agingData.buckets.total > 0 && (
        <div className="mb-6">
          <AgingDistribution buckets={agingData.buckets} />
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
        {storeEntry?.tier === 'company_promoter' && (
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === 'analytics'
                ? 'border-brand-gold text-brand-gold'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Analytics
          </button>
        )}
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
              <StoreDailySalesTable
                dailySales={dailySales}
                totalSalesValue={totalSalesValue}
                totalCollection={totalCollection}
                totalUnits={totalUnits}
                totalTSOs={totalTSOs}
                totalPromotionHours={totalPromotionHours}
                totalSamplesGiven={totalSamplesGiven}
                totalSamplesConsumed={totalSamplesConsumed}
              />
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

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <StoreAnalytics dailySales={dailySales} />
          )}
        </>
      )}
    </>
  );
}
