import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/lib/types';
import type { Store } from '@/lib/stores';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse<ApiResponse<Store[]>>> {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('code, name, aliases')
      .order('name');

    if (error) throw error;

    const stores: Store[] = (data ?? []).map(row => ({
      code: row.code,
      name: row.name,
      aliases: row.aliases ?? [],
    }));

    return NextResponse.json({ success: true, data: stores });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to fetch stores' },
      { status: 500 },
    );
  }
}
