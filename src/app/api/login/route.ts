import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, createSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  // Strip leading country code 91, take last 10 digits
  if (digits.length > 10 && digits.startsWith('91')) {
    return digits.slice(digits.length - 10);
  }
  return digits.slice(-10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, password } = body;

    // Phone-based login (store owners)
    if (phone) {
      const normalized = normalizePhone(phone);
      if (normalized.length !== 10) {
        return NextResponse.json({ success: false, error: 'Invalid phone number' }, { status: 400 });
      }

      const { data: store, error } = await supabase
        .from('stores')
        .select('code, password_hash')
        .eq('contact_phone', normalized)
        .single();

      if (error || !store?.password_hash) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const valid = await verifyPassword(password, store.password_hash);
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
      }

      const cookie = await createSessionCookie({
        role: 'store_owner',
        email: '',
        userId: store.code,
        storeCode: store.code,
      });

      const response = NextResponse.json({ success: true, role: 'store_owner', storeCode: store.code });
      response.cookies.set('kk-auth', cookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      });
      return response;
    }

    // Email-based login (admin / sales_rep)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash, role')
      .eq('email', email)
      .single();

    const authenticated = !error && user && await verifyPassword(password, user.password_hash);

    if (authenticated) {
      const role = user.role as 'admin' | 'sales_rep';
      const userId = user.id;
      const cookie = await createSessionCookie({ role, email, userId });
      const response = NextResponse.json({ success: true, role });

      response.cookies.set('kk-auth', cookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}
