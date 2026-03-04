import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

const USERS = [
  { name: 'Admin', email: 'admin@kashikravings.com', password: '...', role: 'admin' as const },
  { name: 'Abhishek', email: 'test@kashikravings.com', password: '...', role: 'sales_rep' as const },
];

async function seedUsers() {
  for (const user of USERS) {
    const password_hash = await bcrypt.hash(user.password, 10);
    const { error } = await supabase
      .from('users')
      .upsert(
        { name: user.name, email: user.email, password_hash, role: user.role },
        { onConflict: 'email' }
      );

    if (error) {
      console.error(`Error seeding ${user.email}:`, error.message);
      process.exit(1);
    }
    console.log(`Seeded user: ${user.email} (${user.role})`);
  }
  console.log('Done.');
}

seedUsers();
