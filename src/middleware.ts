import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionCookie } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('kk-auth');
  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === '/login';
  const isApiRoute = pathname.startsWith('/api/');
  const isSalesEntry = pathname.startsWith('/sales-entry');

  // Allow API routes through (login, stores, sales endpoints need to work)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Try to decode session from signed cookie
  let role: 'admin' | 'sales_rep' | 'store_owner' | null = null;
  let storeCode: string | undefined;
  if (authCookie?.value) {
    const session = await verifySessionCookie(authCookie.value);
    if (session) {
      role = session.role;
      storeCode = session.storeCode;
    }
  }

  // Authenticated user on login page → redirect based on role
  if (role && isLoginPage) {
    if (role === 'store_owner' && storeCode) {
      return NextResponse.redirect(new URL(`/stores/${storeCode}`, request.url));
    }
    const dest = role === 'sales_rep' ? '/sales-entry' : '/';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Authenticated
  if (role) {
    // Store owners can only access their own store page
    if (role === 'store_owner' && storeCode) {
      const allowedPath = `/stores/${storeCode}`;
      if (pathname !== allowedPath) {
        return NextResponse.redirect(new URL(allowedPath, request.url));
      }
      return NextResponse.next();
    }
    // Sales reps can only access /sales-entry
    if (role === 'sales_rep' && !isSalesEntry) {
      return NextResponse.redirect(new URL('/sales-entry', request.url));
    }
    // Admins can access everything
    return NextResponse.next();
  }

  // Not authenticated → redirect to login (unless already there)
  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpeg|jpg|png|svg|ico|webp)$).*)'],
};
