import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie, verifyPassword, hashPassword } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get('kk-auth');
    if (!authCookie?.value) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const session = await verifySessionCookie(authCookie.value);
    if (!session || session.role !== 'store_owner' || !session.storeCode) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Both current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 4) {
      return NextResponse.json({ success: false, error: 'New password must be at least 4 characters' }, { status: 400 });
    }

    const { data: store, error: fetchError } = await supabase
      .from('stores')
      .select('password_hash')
      .eq('code', session.storeCode)
      .single();

    if (fetchError || !store?.password_hash) {
      return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, store.password_hash);
    if (!valid) {
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
    }

    const newHash = await hashPassword(newPassword);
    const { error: updateError } = await supabase
      .from('stores')
      .update({ password_hash: newHash })
      .eq('code', session.storeCode);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to change password' }, { status: 500 });
  }
}
