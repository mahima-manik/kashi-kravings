import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('kk-auth');

  if (!authCookie?.value) {
    return NextResponse.json({ role: null });
  }

  const session = await verifySessionCookie(authCookie.value);
  if (!session) {
    return NextResponse.json({ role: null });
  }

  const result: Record<string, unknown> = {
    role: session.role,
    email: session.email,
    userId: session.userId,
    storeCode: session.storeCode ?? null,
  };

  // For store owners, fetch store profile data
  if (session.role === 'store_owner' && session.storeCode) {
    const { data: store } = await supabase
      .from('stores')
      .select('name, contact_name, contact_phone, address')
      .eq('code', session.storeCode)
      .single();

    if (store) {
      result.storeName = store.name;
      result.contactName = store.contact_name;
      result.contactPhone = store.contact_phone;
      result.address = store.address;
    }
  }

  return NextResponse.json(result);
}
