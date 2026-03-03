import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

// Hardcoded store definitions used only for seeding.
// Once seeded, the DB is the single source of truth.
const STORES = [
  { code: 'KK-TRM-01', name: 'The Ram Bhandar', aliases: [] as string[] },
  { code: 'KK-LC-02', name: 'Lakshmi Chai', aliases: [] as string[] },
  { code: 'KK-DC-06', name: 'Deena Chaat', aliases: [] as string[] },
  { code: 'KK-SJ-03', name: 'Shree Ji', aliases: ['Shreeji'] },
  { code: 'KK-BL-04', name: 'Blue Lassi', aliases: [] as string[] },
  { code: 'KK-SL-05', name: 'Siwon Lassi', aliases: [] as string[] },
  { code: 'KK-PBC-07', name: 'Popular Baati Chokha', aliases: ['Popular Baati'] },
  { code: 'KK-GB-08', name: 'GreenBerry', aliases: ['Greenberry', 'Green Berry'] },
  { code: 'KK-RB-09', name: 'Rahul Brothers', aliases: [] as string[] },
];

// code -> name map (available for other seed scripts if needed)
export const STORE_MAP: Record<string, string> = Object.fromEntries(
  STORES.map(s => [s.code, s.name])
);

async function seedStores() {
  const rows = STORES.map(store => ({
    code: store.code,
    name: store.name,
    aliases: store.aliases,
    address: null,
  }));

  const { error } = await supabase
    .from('stores')
    .upsert(rows, { onConflict: 'code' });

  if (error) {
    console.error('Error seeding stores:', error.message);
    process.exit(1);
  }

  console.log(`Seeded ${rows.length} stores successfully.`);
}

seedStores();
