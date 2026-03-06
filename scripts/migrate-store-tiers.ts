import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function migrateStoreTiers() {
  // Add tier column with default 'no_promoter'
  const { error: alterError } = await supabase.rpc('exec_sql', {
    sql: `ALTER TABLE stores ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'no_promoter' CHECK (tier IN ('company_promoter', 'store_promoter', 'no_promoter'));`,
  });

  if (alterError) {
    // If rpc doesn't exist, try raw SQL via REST
    console.error('Could not add tier column via rpc:', alterError.message);
    console.log('\nRun this SQL manually in the Supabase SQL editor:\n');
    console.log(`ALTER TABLE stores ADD COLUMN IF NOT EXISTS tier text NOT NULL DEFAULT 'no_promoter'`);
    console.log(`  CHECK (tier IN ('company_promoter', 'store_promoter', 'no_promoter'));`);
    console.log(`\nUPDATE stores SET tier = 'company_promoter' WHERE code LIKE 'KK-%';`);
    process.exit(1);
  }

  // Set existing KK- stores to company_promoter
  const { error: updateError } = await supabase
    .from('stores')
    .update({ tier: 'company_promoter' })
    .like('code', 'KK-%');

  if (updateError) {
    console.error('Error updating tiers:', updateError.message);
    process.exit(1);
  }

  console.log('Migration complete: tier column added, existing KK- stores set to company_promoter.');
}

migrateStoreTiers();
