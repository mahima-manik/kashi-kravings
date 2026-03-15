'use client';

import { useState, useEffect, useMemo } from 'react';
import { Loader2, IndianRupee, ArrowRight } from 'lucide-react';
import type { ApiResponse, Invoice, InvoiceData } from '@/lib/types';
import { formatCurrency } from '@/lib/format';
import { getUnpaidInvoices, computeAgingBuckets } from '@/lib/aging';
import { computeStoreIntelligence } from '@/lib/store-intelligence';
import { computeMilestones } from '@/lib/milestones';
import { MetricCard, AgingDistribution, MilestoneSection, FeaturedDeals } from '@/components/Dashboard';
import CartDrawer from '@/components/Dashboard/CartDrawer';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function StoreHomePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [storeCode, setStoreCode] = useState<string | null>(null);
  const [storeName, setStoreName] = useState<string | null>(null);
  const [contactName, setContactName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    const { signal } = abortController;

    async function load() {
      try {
        // Fetch user info and invoices in parallel
        const [meRes, invRes] = await Promise.all([
          fetch('/api/me', { signal }),
          fetch('/api/invoices', { signal }),
        ]);
        if (signal.aborted) return;

        const meData: { role: string | null; storeCode?: string; storeName?: string; contactName?: string } = await meRes.json();

        if (!meData.storeCode) {
          setError('Store not found');
          setIsLoading(false);
          return;
        }
        setStoreCode(meData.storeCode);
        setStoreName(meData.storeName ?? null);
        setContactName(meData.contactName ?? meData.storeName ?? null);

        const invResult: ApiResponse<InvoiceData> = await invRes.json();
        if (signal.aborted) return;

        if (invResult.success && invResult.data) {
          const filterName = meData.storeName ?? meData.storeCode;
          const filtered = invResult.data.invoices.filter(
            (inv) => inv.contactName === filterName
          );
          setInvoices(filtered);
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError('Failed to load data');
      } finally {
        if (!signal.aborted) setIsLoading(false);
      }
    }

    load();
    return () => { abortController.abort(); };
  }, []);

  const storeIntel = useMemo(() => {
    if (invoices.length === 0) return null;
    const intel = computeStoreIntelligence(invoices);
    // Get first (only) entry since invoices are pre-filtered for this store
    const entries = Array.from(intel.values());
    return entries[0] ?? null;
  }, [invoices]);

  const milestones = useMemo(() => computeMilestones(invoices), [invoices]);

  const agingData = useMemo(() => {
    const unpaid = getUnpaidInvoices(invoices);
    return computeAgingBuckets(unpaid);
  }, [invoices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-brand-gold" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-gray-500 dark:text-gray-400 text-sm">{error}</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-olive/10 to-brand-gold/10 dark:from-brand-olive/20 dark:to-brand-gold/20 rounded-xl p-6 border border-brand-gold/20 flex items-center gap-5">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center overflow-hidden flex-shrink-0 relative border-2 border-brand-gold/30">
          <span className="text-xl sm:text-2xl font-bold text-brand-olive/60 dark:text-brand-gold/60">
            {(storeName ?? '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </span>
          <img
            src={`/stores/${storeCode}.jpg`}
            alt={storeName ?? ''}
            className="absolute inset-0 w-full h-full object-cover rounded-full"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {getGreeting()}{contactName ? `, ${contactName}` : ''}!
          </h2>
          {storeName && (
            <p className="text-sm font-medium text-brand-olive dark:text-brand-gold mt-0.5">{storeName}</p>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
            Welcome to your Kashi Kravings dashboard 🎉
          </p>
        </div>
      </div>

      {/* Clear Dues Banner */}
      {(() => {
        const outstanding = invoices.reduce((s, inv) => s + inv.remainingAmount, 0);
        if (outstanding <= 0) return null;
        return (
          <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/20 border border-red-200/60 dark:border-red-800/30 px-5 py-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
                <IndianRupee className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(outstanding)} <span className="font-normal text-gray-500 dark:text-gray-400">outstanding</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Clear dues to improve your reliability score</p>
              </div>
            </div>
            <button
              onClick={() => {/* UI-only placeholder */}}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              Clear Dues
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        );
      })()}

      {/* Quick Stats */}
      {storeIntel && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Avg Order Value"
            value={formatCurrency(storeIntel.aov)}
          />
          <MetricCard
            label="Payment Reliability"
            value={`${Math.round(storeIntel.paidPct)}%`}
            warn={storeIntel.paidPct < 50}
          />
          <MetricCard
            label="Order Frequency"
            value={storeIntel.avgFrequencyDays != null ? `Every ${storeIntel.avgFrequencyDays} days` : '—'}
          />
          <MetricCard
            label="Outstanding"
            value={formatCurrency(invoices.reduce((s, inv) => s + inv.remainingAmount, 0))}
            warn={invoices.some(inv => inv.remainingAmount > 0)}
          />
        </div>
      )}

      {/* Quick Restock Deals */}
      <FeaturedDeals />

      {/* Milestones */}
      <MilestoneSection milestones={milestones} />

      {/* Aging Breakdown */}
      {agingData.buckets.total > 0 && (
        <AgingDistribution buckets={agingData.buckets} />
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </div>
  );
}
