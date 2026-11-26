import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/admin/login',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/privacy',
  '/terms',
  '/contact',
  '/about',
  '/security',
  '/pricing',
];

export function isTokenExpired(token: string): boolean {
  try {
    if (!token) return true;
    const cleanToken = token.replace(/^Bearer\s+/i, '').replace(/^"|"$/g, '').trim();
    const parts = cleanToken.split('.');
    if (parts.length < 2) return true;

    const payloadPart = parts[1];
    if (!payloadPart) return true;

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const pad =
      base64.length % 4 === 0 ? base64 : base64 + '='.repeat(4 - (base64.length % 4));

    const jsonPayload = atob(pad);

    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

export function getPublicOrigin(req: NextRequest): string {
  // 1. Standard reverse proxy forwarded headers (e.g., Nginx, AWS ALB, Cloudflare)
  const forwardedHost = req.headers.get('x-forwarded-host');
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https';
  if (forwardedHost && !forwardedHost.includes('localhost') && !forwardedHost.includes('127.0.0.1')) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 2. Host header if it represents a valid external domain
  const host = req.headers.get('host');
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    const proto = req.headers.get('x-forwarded-proto') || (req.url.startsWith('https') ? 'https' : 'http');
    return `${proto}://${host}`;
  }

  // 3. req.nextUrl origin if external
  if (req.nextUrl.origin && !req.nextUrl.origin.includes('localhost') && !req.nextUrl.origin.includes('127.0.0.1')) {
    return req.nextUrl.origin;
  }

  // 4. Production fallback: ensure redirects always point to the production domain
  const isProduction =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'production' ||
    process.env.NODE_ENV === 'production' ||
    (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.includes('topplaced.com'));

  if (isProduction) {
    return 'https://ai.topplaced.com';
  }

  // 5. Fallback for local development
  return req.nextUrl.origin;
}

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/models') ||
    pathname.startsWith('/brand') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/public')
  ) {
    return NextResponse.next();
  }

  // Canonical Clean URLs: Redirect legacy /auth routes to top-level routes
  if (pathname === '/auth/login') {
    return NextResponse.redirect(new URL(`/login${search}`, req.url), 308);
  }
  if (pathname === '/auth/register') {
    return NextResponse.redirect(new URL(`/register${search}`, req.url), 308);
  }
  if (pathname === '/auth/forgot-password') {
    return NextResponse.redirect(new URL(`/forgot-password${search}`, req.url), 308);
  }
  if (pathname === '/auth/reset-password') {
    return NextResponse.redirect(new URL(`/reset-password${search}`, req.url), 308);
  }

  const isPublic = PUBLIC_PATHS.some((p) => (p === '/' ? pathname === '/' : pathname.startsWith(p)));
  if (isPublic) return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  if (!token || isTokenExpired(token)) {
    const fullPath = search ? `${pathname}${search}` : pathname;
    const origin = getPublicOrigin(req);
    const url = new URL('/login', origin);
    if (fullPath && !fullPath.startsWith('/login') && !fullPath.startsWith('/auth') && !fullPath.startsWith('//')) {
      url.searchParams.set('redirect', fullPath);
    }
    const response = NextResponse.redirect(url);
    if (token) {
      response.cookies.delete('token');
    }
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico|robots.txt|sitemap.xml).*)'],
};
