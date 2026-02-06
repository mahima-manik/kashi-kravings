'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import {
  Header,
  SummaryCards,
  SalesChart,
  StorePerformance,
  ProductBreakdown,
  SalesTable,
  DateRangePicker,
} from '@/components/Dashboard';
import { DashboardData, ApiResponse } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const fetchData = useCallback(async (useMock = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(useMock && { mock: 'true' }),
      });

      const response = await fetch(`/api/sales?${params}`);
      const result: ApiResponse<DashboardData> = await response.json();

      if (result.success && result.data) {
        setData(result.data);
      } else {
        // Fall back to mock data if real data fails
        const mockResponse = await fetch('/api/sales?mock=true');
        const mockResult: ApiResponse<DashboardData> = await mockResponse.json();

        if (mockResult.success && mockResult.data) {
          setData(mockResult.data);
          setError('Using demo data (Google Sheets connection failed)');
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      }
    } catch (err) {
      // Fall back to mock data on any error
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
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    fetchData();
  };

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate);
    setEndDate(newEndDate);
  };

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-chocolate-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lastUpdated={data?.lastUpdated || ''}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mb-6">
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
          />
        </div>

        {data && (
          <>
            <div className="mb-8">
              <SummaryCards
                totalRevenue={data.totalRevenue}
                totalCollection={data.totalCollection}
                totalOutstanding={data.totalOutstanding}
                totalUnits={data.totalUnits}
                storesActiveToday={data.storesActiveToday}
                collectionRate={data.collectionRate}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SalesChart data={data.dailySummaries} />
              <StorePerformance data={data.storeSummaries} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                <SalesTable data={data.salesRecords} />
              </div>
              <ProductBreakdown data={data.productSummaries} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
