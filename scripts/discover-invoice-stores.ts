import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function discoverInvoiceStores() {
  // 1. Fetch all distinct contact_name values from invoices
  const { data: invoiceContacts, error: invoiceError } = await supabase
    .from('invoices')
    .select('contact_name');

  if (invoiceError) {
    console.error('Error fetching invoices:', invoiceError.message);
    process.exit(1);
  }

  const contactNames = Array.from(new Set(
    (invoiceContacts ?? [])
      .map(r => r.contact_name?.trim())
      .filter(Boolean)
  ));

  // 2. Fetch all existing stores
  const { data: existingStores, error: storesError } = await supabase
    .from('stores')
    .select('code, name, aliases');

  if (storesError) {
    console.error('Error fetching stores:', storesError.message);
    process.exit(1);
  }

  const stores = existingStores ?? [];

  // 3. Find unmatched contact names
  const existingCodes = new Set(stores.map(s => s.code));
  const existingNames = new Set(stores.map(s => s.name.toLowerCase()));
  const existingAliases = new Set(
    stores.flatMap(s => (s.aliases ?? []).map((a: string) => a.toLowerCase()))
  );

  const unmatched = contactNames.filter(name => {
    const lower = name.toLowerCase();
    if (existingCodes.has(name)) return false;
    if (existingNames.has(lower)) return false;
    if (existingAliases.has(lower)) return false;
    // Also check prefix matching (same as findStoreCode)
    for (const store of stores) {
      if (lower.startsWith(store.name.toLowerCase())) return false;
      for (const alias of store.aliases ?? []) {
        if (lower.startsWith(alias.toLowerCase())) return false;
      }
    }
    return true;
  });

  if (unmatched.length === 0) {
    console.log('No new stores to discover. All invoice contacts already matched.');
    return;
  }

  // 4. Insert new stores
  const newStores = unmatched.map(name => ({
    code: name,
    name: name,
    aliases: [] as string[],
    tier: 'no_promoter',
    address: null,
  }));

  const { error: insertError } = await supabase
    .from('stores')
    .upsert(newStores, { onConflict: 'code' });

  if (insertError) {
    console.error('Error inserting new stores:', insertError.message);
    process.exit(1);
  }

  console.log(`\nDiscovered ${newStores.length} new stores from invoices:\n`);
  for (const store of newStores) {
    console.log(`  - ${store.name} (code: ${store.code})`);
  }
  console.log('\nReview these in the admin UI and delete any that are individuals (not real stores).');
}

discoverInvoiceStores();
