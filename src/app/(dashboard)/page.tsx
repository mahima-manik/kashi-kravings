'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import type { PresetKey } from '@/components/Dashboard/DateRangePicker';
import {
  SummaryCards,
  SalesByLocation,
  DateRangePicker,
  ProductUnitSales,
  PromotionImpact,
  SalesPromotionTrend,
} from '@/components/Dashboard';
import { DashboardData, DailySummary, SalesRecord, ApiResponse } from '@/lib/types';
import type { Store } from '@/lib/stores';
import { Loader2, RefreshCw } from 'lucide-react';

function aggregateDailySummariesFromRecords(records: SalesRecord[]): DailySummary[] {
  const map = new Map<string, DailySummary>();
  for (const r of records) {
    if (!r.date) continue;
    const existing = map.get(r.date);
    const units = r.paanL + r.thandaiL + r.giloriL + r.paanS + r.thandaiS + r.giloriS + r.heritageBox9 + r.heritageBox15;
    if (existing) {
      existing.totalRevenue += r.saleValue;
      existing.totalCollection += r.collectionReceived;
      existing.totalUnits += units;
      existing.storeCount += 1;
      existing.totalTSOs += r.numTSO;
      existing.totalSampleGiven += r.sampleGiven;
      existing.totalSampleConsumed += r.sampleConsumed;
      existing.totalPromotionHours += r.promotionDuration;
    } else {
      map.set(r.date, {
        date: r.date,
        totalRevenue: r.saleValue,
        totalCollection: r.collectionReceived,
        totalUnits: units,
        storeCount: 1,
        totalTSOs: r.numTSO,
        totalSampleGiven: r.sampleGiven,
        totalSampleConsumed: r.sampleConsumed,
        totalPromotionHours: r.promotionDuration,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('all');
  const [activePreset, setActivePreset] = useState<PresetKey>('1m');

  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);
  const [appliedLocation, setAppliedLocation] = useState('all');

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const response = await fetch('/api/sales?sync=true');
      const result: ApiResponse<DashboardData> = await response.json();
      if (result.success && result.data) {
        setData(result.data);
        setLastSynced(new Date().toLocaleTimeString());
      } else {
        setError(result.error || 'Sync failed');
      }
    } catch {
      setError('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const fetchData = useCallback(async (useMock = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: appliedStartDate,
        endDate: appliedEndDate,
        ...(useMock && { mock: 'true' }),
      });

      const response = await fetch(`/api/sales?${params}`);
      const result: ApiResponse<DashboardData> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        const mockResponse = await fetch('/api/sales?mock=true');
        const mockResult: ApiResponse<DashboardData> = await mockResponse.json();

        if (mockResult.success && mockResult.data) {
          setData(mockResult.data);
          setError('Using demo data (Google Sheets connection failed)');
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      }
    } catch {
      try {
        const mockResponse = await fetch('/api/sales?mock=true');
        const mockResult: ApiResponse<DashboardData> = await mockResponse.json();

        if (mockResult.success && mockResult.data) {
          setData(mockResult.data);
          setError('Using demo data (connection error)');
        }
      } catch {
        setError('Failed to fetch data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [appliedStartDate, appliedEndDate]);

  useEffect(() => {
    fetch('/api/stores')
      .then(res => res.json())
      .then((result: ApiResponse<Store[]>) => {
        if (result.success && result.data) setStores(result.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = () => {
    setActivePreset('custom');
    setAppliedStartDate(startDate);
    setAppliedEndDate(endDate);
    setAppliedLocation(location);
  };

  const handleQuickSelect = (start: string, end: string, preset: PresetKey) => {
    setStartDate(start);
    setEndDate(end);
    setActivePreset(preset);
    setAppliedStartDate(start);
    setAppliedEndDate(end);
    setAppliedLocation(location);
  };

  const handleReset = () => {
    const defaultStart = format(subDays(new Date(), 29), 'yyyy-MM-dd');
    const defaultEnd = format(new Date(), 'yyyy-MM-dd');
    setStartDate(defaultStart);
    setEndDate(defaultEnd);
    setLocation('all');
    setActivePreset('1m');
    setAppliedStartDate(defaultStart);
    setAppliedEndDate(defaultEnd);
    setAppliedLocation('all');
  };

  const filteredRecords = data?.salesRecords.filter((record) => {
    if (appliedLocation === 'all') return true;
    return record.location === appliedLocation;
  }) ?? [];

  const dailySummariesForTrend = appliedLocation === 'all'
    ? (data?.dailySummaries ?? [])
    : aggregateDailySummariesFromRecords(filteredRecords);

  if (isLoading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading dashboard...</p>
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

      {data && (
        <>
          <div className="flex justify-end items-center gap-3 mb-4">
            {lastSynced && (
              <span className="text-xs text-gray-400 dark:text-gray-500">
                Last synced: {lastSynced}
              </span>
            )}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync from Sheets'}
            </button>
          </div>

          <div className="mb-6">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                location={location}
                activePreset={activePreset}
                stores={stores}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onLocationChange={(loc) => { setLocation(loc); setAppliedLocation(loc); }}
                onApply={handleApplyFilters}
                onReset={handleReset}
                onQuickSelect={handleQuickSelect}
              />
          </div>

          <div className="mb-6">
            <SummaryCards records={filteredRecords} />
          </div>

          <div className="mb-6">
            <SalesByLocation records={filteredRecords} />
          </div>

          <div className="mb-6">
            <SalesPromotionTrend data={dailySummariesForTrend} />
          </div>

          <div className="mb-6">
            <ProductUnitSales records={filteredRecords} />
          </div>

          <div className="mb-6">
            <PromotionImpact records={filteredRecords} />
          </div>
        </>
      )}
    </>
  );
}
