import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData, fetchSalesDataForDateRange, generateMockData } from '@/lib/google-sheets';
import { ApiResponse, DashboardData } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const useMock = searchParams.get('mock') === 'true';

    let data: DashboardData;

    if (useMock) {
      // Use mock data for development/testing
      data = generateMockData();
    } else if (startDate && endDate) {
      // Fetch data for specific date range
      data = await fetchSalesDataForDateRange(startDate, endDate);
    } else {
      // Fetch all data
      data = await fetchSalesData();
    }

    const response: ApiResponse<DashboardData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales data:', error);

    const response: ApiResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales data',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
