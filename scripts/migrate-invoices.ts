import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { findStoreCode } from '../src/lib/stores';
import fs from 'fs';
import path from 'path';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

function ddmmyyyyToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

async function migrate() {
  // Load invoices.json
  const invoicesPath = path.join(process.cwd(), 'src/data/invoices.json');
  const raw = fs.readFileSync(invoicesPath, 'utf-8');
  const invoiceMap = JSON.parse(raw) as Record<string, Record<string, unknown>>;
  const invoices = Object.values(invoiceMap);
  console.log(`Found ${invoices.length} invoices to migrate.`);

  // Fetch stores to build code -> id map
  const { data: storeRows, error: storesError } = await supabase
    .from('stores')
    .select('id, code, name, aliases');

  if (storesError) {
    console.error('Failed to fetch stores:', storesError.message);
    process.exit(1);
  }

  const stores = storeRows ?? [];
  const storeCodeToId: Record<string, string> = Object.fromEntries(
    stores.map(s => [s.code, s.id])
  );

  // Build DB rows
  const rows = invoices.map(inv => {
    const storeCode = findStoreCode(String(inv.contactName ?? ''), stores);
    return {
      invoice_no: String(inv.invoiceNo),
      invoice_date: ddmmyyyyToISO(String(inv.invoiceDate ?? '')),
      contact_name: String(inv.contactName ?? ''),
      store_id: storeCode ? (storeCodeToId[storeCode] ?? null) : null,
      amount: Number(inv.amount) || 0,
      remaining_amount: Number(inv.remainingAmount) || 0,
      status: String(inv.invoiceStatus ?? ''),
      due_date: ddmmyyyyToISO(String(inv.dueDate ?? '')),
      invoice_link: String(inv.invoiceLink ?? ''),
      payment_type: String(inv.paymentType ?? ''),
      party_category: String(inv.partyCategory ?? ''),
      created_by: String(inv.createdBy ?? ''),
    };
  });

  // Upsert in batches of 100
  const batchSize = 100;
  let migrated = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('invoices')
      .upsert(batch, { onConflict: 'invoice_no' });

    if (error) {
      console.error(`Error at batch starting at index ${i}:`, error.message);
      process.exit(1);
    }

    migrated += batch.length;
    console.log(`Migrated ${migrated}/${rows.length}`);
  }

  console.log('Migration complete!');
}

migrate();
