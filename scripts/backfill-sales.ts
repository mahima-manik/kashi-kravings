import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { fetchSalesData } from '../src/lib/google-sheets';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function backfill() {
  console.log('Fetching all sales data from Google Sheets...');
  const sheetData = await fetchSalesData(true);
  const records = sheetData.salesRecords;
  console.log(`Found ${records.length} records.`);

  // Fetch stores for code -> id mapping
  const { data: stores, error: storesError } = await supabase.from('stores').select('id, code');
  if (storesError) {
    console.error('Failed to fetch stores:', storesError.message);
    process.exit(1);
  }

  const storeCodeToId: Record<string, string> = Object.fromEntries(
    (stores ?? []).map(s => [s.code, s.id])
  );

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

  // Upsert in batches of 100
  const batchSize = 100;
  let migrated = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('sales_records')
      .upsert(batch, { onConflict: 'recorded_at' });

    if (error) {
      console.error(`Error at batch starting at index ${i}:`, error.message);
      process.exit(1);
    }

    migrated += batch.length;
    console.log(`Migrated ${migrated}/${rows.length}`);
  }

  console.log('Backfill complete!');
}

backfill();
