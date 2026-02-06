import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('kk-auth');
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

  // Allow API routes (login needs to work)
  if (isApiRoute) {
    return NextResponse.next();
  }

  // If authenticated, allow access (redirect away from login if already logged in)
  if (authCookie?.value === 'authenticated') {
    if (isLoginPage) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // If not authenticated and not on login page, redirect to login
  if (!isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:jpeg|jpg|png|svg|ico|webp)$).*)'],
};
