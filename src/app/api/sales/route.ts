import { NextRequest, NextResponse } from 'next/server';
import { fetchSalesData, buildDashboardData } from '@/lib/google-sheets';
import { supabase } from '@/lib/supabase';
import { ApiResponse, DashboardData, SalesRecord } from '@/lib/types';
import { generateMockData } from '@/lib/google-sheets';
import { verifySessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function dbRowToSalesRecord(row: Record<string, unknown>, storeCodeToName: Record<string, string>): SalesRecord {
  const code = String(row.store_code ?? '');
  return {
    id: String(row.id),
    timestamp: String(row.recorded_at ?? ''),
    date: String(row.date ?? ''),
    location: code,
    storeName: storeCodeToName[code] || code,
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
  // Fetch stores once for code → name mapping
  const { data: stores, error: storesError } = await supabase.from('stores').select('code, name');
  if (storesError) throw storesError;

  const storeCodeToName: Record<string, string> = Object.fromEntries(
    (stores ?? []).map(s => [s.code, s.name])
  );

  let query = supabase.from('sales_records').select('*').order('date', { ascending: false });

  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);

  const { data, error } = await query;
  if (error) throw error;

  const records = (data ?? []).map(row => dbRowToSalesRecord(row, storeCodeToName));
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

export async function POST(request: NextRequest) {
  try {
    // Verify auth
    const authCookie = request.cookies.get('kk-auth');
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const session = await verifySessionCookie(authCookie.value);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { store_code, date } = body;

    if (!store_code || !date) {
      return NextResponse.json(
        { success: false, error: 'store_code and date are required' },
        { status: 400 }
      );
    }

    // Look up store_id from store_code
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('code', store_code)
      .single();

    const row = {
      recorded_at: new Date().toISOString(),
      date,
      store_code,
      store_id: store?.id ?? null,
      paan_l: Number(body.paan_l) || 0,
      thandai_l: Number(body.thandai_l) || 0,
      gilori_l: Number(body.gilori_l) || 0,
      paan_s: Number(body.paan_s) || 0,
      thandai_s: Number(body.thandai_s) || 0,
      gilori_s: Number(body.gilori_s) || 0,
      heritage_box_9: Number(body.heritage_box_9) || 0,
      heritage_box_15: Number(body.heritage_box_15) || 0,
      sale_value: Number(body.sale_value) || 0,
      collection_received: Number(body.collection_received) || 0,
      sample_given: Number(body.sample_given) || 0,
      num_tso: Number(body.num_tso) || 0,
      promotion_duration: Number(body.promotion_duration) || 0,
      sample_consumed: Number(body.sample_consumed) || 0,
    };

    const { data, error } = await supabase
      .from('sales_records')
      .insert(row)
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data: { id: data.id } });
  } catch (error) {
    console.error('Error inserting sales record:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to insert sales record' },
      { status: 500 }
    );
  }
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
