'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, IndianRupee, Package, Users } from 'lucide-react';
import { DashboardData, SalesRecord, ApiResponse, STORES } from '@/lib/types';
import { formatCurrency } from '@/lib/format';

interface StoreMetrics {
  storeCode: string;
  storeName: string;
  totalRevenue: number;
  totalCollection: number;
  outstanding: number;
  totalUnits: number;
  activeDays: number;
  totalTSODays: number;
  firstDate: string;
  lastDate: string;
}

function computeStoreMetrics(records: SalesRecord[]): StoreMetrics[] {
  const map = new Map<string, StoreMetrics>();

  for (const r of records) {
    if (!r.location) continue;

    const existing = map.get(r.location);
    const units = r.paanL + r.thandaiL + r.giloriL + r.paanS + r.thandaiS + r.giloriS + r.heritageBox9 + r.heritageBox15;

    if (existing) {
      existing.totalRevenue += r.saleValue;
      existing.totalCollection += r.collectionReceived;
      existing.outstanding = existing.totalRevenue - existing.totalCollection;
      existing.totalUnits += units;
      existing.totalTSODays += r.numTSO;
      if (r.date < existing.firstDate) existing.firstDate = r.date;
      if (r.date > existing.lastDate) existing.lastDate = r.date;
    } else {
      map.set(r.location, {
        storeCode: r.location,
        storeName: r.storeName,
        totalRevenue: r.saleValue,
        totalCollection: r.collectionReceived,
        outstanding: r.saleValue - r.collectionReceived,
        totalUnits: units,
        activeDays: 0,
        totalTSODays: r.numTSO,
        firstDate: r.date,
        lastDate: r.date,
      });
    }
  }

  // Count unique active days per store
  for (const [code, metrics] of Array.from(map.entries())) {
    const dates = new Set(records.filter(r => r.location === code).map(r => r.date));
    metrics.activeDays = dates.size;
  }

  return Array.from(map.values()).sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export default function ExplorePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/sales');
        const result: ApiResponse<DashboardData> = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          const mockResponse = await fetch('/api/sales?mock=true');
          const mockResult: ApiResponse<DashboardData> = await mockResponse.json();
          if (mockResult.success && mockResult.data) {
            setData(mockResult.data);
            setError('Using demo data');
          }
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

  const stores = data ? computeStoreMetrics(data.salesRecords) : [];

  return (
    <>
      {error && (
        <div className="mb-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stores</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {stores.length} stores where Kashi Kravings chocolates are sold
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {stores.map((store) => {
          const collectionRate = store.totalRevenue > 0
            ? Math.round((store.totalCollection / store.totalRevenue) * 100)
            : 0;

          return (
            <Link
              key={store.storeCode}
              href={`/stores/${encodeURIComponent(store.storeCode)}`}
              className="group bg-surface-card border border-surface-border rounded-xl p-4 hover:border-brand-gold/50 hover:shadow-md transition-all"
            >
              {/* Store image with initials fallback */}
              <div className="relative w-full h-32 rounded-lg bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center mb-3 overflow-hidden">
                <span className="text-3xl font-bold text-brand-olive/60 dark:text-brand-gold/60">
                  {store.storeName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </span>
                <img
                  src={`/stores/${store.storeCode}.jpg`}
                  alt={store.storeName}
                  className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>

              {/* Store name & code */}
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-gold transition-colors truncate">
                {store.storeName}
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">{store.storeCode}</p>

              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <IndianRupee className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="text-gray-700 dark:text-gray-300">{formatCurrency(store.totalRevenue)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-gray-700 dark:text-gray-300">{store.totalUnits} units</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  <span className="text-gray-700 dark:text-gray-300">{store.activeDays} days</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                  <span className="text-gray-700 dark:text-gray-300">{store.totalTSODays} TSOs</span>
                </div>
              </div>

              {/* Outstanding bar */}
              {store.outstanding > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-border-light">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500 dark:text-gray-400">Collection {collectionRate}%</span>
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {formatCurrency(store.outstanding)} due
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${collectionRate}%` }}
                    />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
