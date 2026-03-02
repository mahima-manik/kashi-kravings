import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { STORES } from '../src/lib/stores';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function seedStores() {
  const rows = STORES.map(store => ({
    code: store.code,
    name: store.name,
    aliases: store.aliases ?? [],
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
