import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData, buildDashboardData } from '@/lib/google-sheets';
import { supabase } from '@/lib/supabase';
import { ApiResponse, DashboardData, SalesRecord } from '@/lib/types';
import { STORE_MAP } from '@/lib/stores';
import { generateMockData } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

function dbRowToSalesRecord(row: Record<string, unknown>, index: number): SalesRecord {
  return {
    id: String(row.id),
    timestamp: String(row.recorded_at ?? ''),
    date: String(row.date ?? ''),
    location: String(row.store_code ?? ''),
    storeName: STORE_MAP[String(row.store_code ?? '')] || String(row.store_code ?? ''),
    paanL: Number(row.paan_l) || 0,
    thandaiL: Number(row.thandai_l) || 0,
    giloriL: Number(row.gilori_l) || 0,
    paanS: Number(row.paan_s) || 0,
    thandaiS: Number(row.thandai_s) || 0,
    giloriS: Number(row.gilori_s) || 0,
    heritageBox9: Number(row.heritage_box_9) || 0,
    heritageBox15: Number(row.heritage_box_15) || 0,
    saleValue: Number(row.sale_value) || 0,
    collectionReceived: Number(row.collection_received) || 0,
    sampleGiven: Number(row.sample_given) || 0,
    numTSO: Number(row.num_tso) || 0,
    promotionDuration: Number(row.promotion_duration) || 0,
    sampleConsumed: Number(row.sample_consumed) || 0,
  };
}

async function readFromDb(startDate?: string, endDate?: string): Promise<DashboardData> {
  let query = supabase.from('sales_records').select('*').order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const records = (data ?? []).map((row, i) => dbRowToSalesRecord(row, i));
  return buildDashboardData(records);
}

async function syncFromSheets(): Promise<DashboardData> {
  // Fetch fresh data from Google Sheets
  const sheetData = await fetchSalesData(true);
  const records = sheetData.salesRecords;

  // Fetch stores for code -> id mapping
  const { data: stores, error: storesError } = await supabase.from('stores').select('id, code');
  if (storesError) throw storesError;

  const storeCodeToId: Record<string, string> = Object.fromEntries(
    (stores ?? []).map(s => [s.code, s.id])
  );

  // Build DB rows
  const rows = records
    .filter(r => r.timestamp && r.date && r.location)
    .map(r => ({
      recorded_at: r.timestamp,
      date: r.date,
      store_code: r.location,
      store_id: storeCodeToId[r.location] ?? null,
      paan_l: r.paanL,
      thandai_l: r.thandaiL,
      gilori_l: r.giloriL,
      paan_s: r.paanS,
      thandai_s: r.thandaiS,
      gilori_s: r.giloriS,
      heritage_box_9: r.heritageBox9,
      heritage_box_15: r.heritageBox15,
      sale_value: r.saleValue,
      collection_received: r.collectionReceived,
      sample_given: r.sampleGiven,
      num_tso: r.numTSO,
      promotion_duration: r.promotionDuration,
      sample_consumed: r.sampleConsumed,
    }));

  if (rows.length > 0) {
    const { error } = await supabase
      .from('sales_records')
      .upsert(rows, { onConflict: 'recorded_at' });
    if (error) throw error;
  }

  return sheetData;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') ?? undefined;
    const endDate = searchParams.get('endDate') ?? undefined;
    const useMock = searchParams.get('mock') === 'true';
    const doSync = searchParams.get('sync') === 'true';

    let data: DashboardData;

    if (useMock) {
      data = generateMockData();
    } else if (doSync) {
      data = await syncFromSheets();
    } else {
      data = await readFromDb(startDate, endDate);
    }

    const response: ApiResponse<DashboardData> = { success: true, data };
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
