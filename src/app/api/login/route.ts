import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPassword, createSessionCookie } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Authenticate against users table
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
