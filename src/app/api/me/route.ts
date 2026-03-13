import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionCookie } from '@/lib/auth';

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

  return NextResponse.json({
    role: session.role,
    storeCode: session.storeCode ?? null,
  });
}
