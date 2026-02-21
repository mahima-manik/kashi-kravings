'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import type { PresetKey } from '@/components/Dashboard/DateRangePicker';
import {
  Header,
  SummaryCards,
  SalesByLocation,
  DateRangePicker,
  ProductUnitSales,
  PromotionImpact,
} from '@/components/Dashboard';
import { DashboardData, ApiResponse } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('sales');
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [location, setLocation] = useState('all');
  const [activePreset, setActivePreset] = useState<PresetKey>('1m');

  const [appliedStartDate, setAppliedStartDate] = useState(startDate);
  const [appliedEndDate, setAppliedEndDate] = useState(endDate);
  const [appliedLocation, setAppliedLocation] = useState('all');

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

  const filteredStoreSummaries = data?.storeSummaries.filter((store) => {
    if (appliedLocation === 'all') return true;
    return store.storeCode === appliedLocation;
  }) ?? [];

  const filteredRecords = data?.salesRecords.filter((record) => {
    if (appliedLocation === 'all') return true;
    return record.location === appliedLocation;
  }) ?? [];

  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.saleValue, 0);
  const totalCollection = filteredRecords.reduce((sum, r) => sum + r.collectionReceived, 0);
  const totalOutstanding = totalRevenue - totalCollection;
  const collectionRate = totalRevenue > 0 ? (totalCollection / totalRevenue) * 100 : 0;

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-brand-gold mx-auto" />
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-primary">
      <Header onRefresh={() => fetchData()} isLoading={isLoading} activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 bg-amber-900/30 border border-amber-700/50 text-amber-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            location={location}
            activePreset={activePreset}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onLocationChange={(loc) => { setLocation(loc); setAppliedLocation(loc); }}
            onApply={handleApplyFilters}
            onReset={handleReset}
            onQuickSelect={handleQuickSelect}
          />
        </div>

        {data && activeTab === 'sales' && (
          <>
            <div className="mb-6">
              <SummaryCards
                totalRevenue={totalRevenue}
                totalCollection={totalCollection}
                totalOutstanding={totalOutstanding}
                collectionRate={collectionRate}
                transactionCount={filteredRecords.length}
              />
            </div>

            <div className="mb-6">
              <SalesByLocation records={filteredRecords} />
            </div>

            <div className="mb-6">
              <ProductUnitSales records={filteredRecords} />
            </div>
          </>
        )}

        {data && activeTab === 'promotions' && (
          <div className="mb-6">
            <PromotionImpact records={filteredRecords} />
          </div>
        )}
      </main>
    </div>
  );
}
