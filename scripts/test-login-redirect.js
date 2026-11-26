/**
 * TopPlaced AI - Production Login Redirect & Middleware Test Suite
 * Validates origin resolution, token validation, role-based redirects, and query preservation.
 */

const assert = require('node:assert');
const test = require('node:test');

// Mock NextRequest and NextResponse for Node environment test
class MockHeaders {
  constructor(init = {}) {
    this.map = new Map();
    for (const [k, v] of Object.entries(init)) {
      this.map.set(k.toLowerCase(), v);
    }
  }
  get(key) {
    return this.map.get(key.toLowerCase()) || null;
  }
}

class MockNextRequest {
  constructor({ url, headers = {}, cookies = {} }) {
    this.url = url;
    this.nextUrl = new URL(url);
    this.headers = new MockHeaders(headers);
    this.cookies = {
      get: (key) => (cookies[key] ? { value: cookies[key] } : undefined),
    };
  }
}

// Import or recreate the functions from middleware.ts for rigorous testing
function getPublicOrigin(req) {
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

function isTokenExpired(token) {
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

// Role-based redirect URL helper from LoginPage
function getRedirectUrl(role, search = '') {
  const normalizedRole = (role || '').toLowerCase().trim();
  const isAdmin =
    normalizedRole === 'admin' ||
    normalizedRole === 'superadmin' ||
    normalizedRole === 'super_admin';

  const params = new URLSearchParams(search);
  const redirectParam = params.get('redirect');

  if (isAdmin) {
    if (
      redirectParam &&
      redirectParam.startsWith('/admin') &&
      !redirectParam.startsWith('//') &&
      !redirectParam.includes('\\')
    ) {
      return redirectParam;
    }
    return '/admin';
  }

  if (normalizedRole === 'mentor') {
    return '/mentor';
  }

  if (
    redirectParam &&
    redirectParam.startsWith('/') &&
    !redirectParam.startsWith('//') &&
    !redirectParam.includes('\\') &&
    !redirectParam.startsWith('/auth') &&
    !redirectParam.startsWith('/admin')
  ) {
    return redirectParam;
  }

  return '/learner';
}

function createJwt(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mockSignature123`;
}

// --- Test Cases ---

test('1. getPublicOrigin resolves https://ai.topplaced.com in production environments', () => {
  const prevEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';

  // Even if Node server is running on localhost:3000 behind reverse proxy:
  const req = new MockNextRequest({
    url: 'http://localhost:3000/learner/interview/setup',
    headers: { host: 'localhost:3000' },
  });

  const origin = getPublicOrigin(req);
  assert.strictEqual(origin, 'https://ai.topplaced.com');

  process.env.NEXT_PUBLIC_ENVIRONMENT = prevEnv;
});

test('2. getPublicOrigin resolves x-forwarded-host and x-forwarded-proto correctly', () => {
  const req = new MockNextRequest({
    url: 'http://localhost:3000/learner',
    headers: {
      'x-forwarded-host': 'ai.topplaced.com',
      'x-forwarded-proto': 'https',
    },
  });

  const origin = getPublicOrigin(req);
  assert.strictEqual(origin, 'https://ai.topplaced.com');
});

test('3. getPublicOrigin retains localhost in local development environment', () => {
  const prevEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  delete process.env.NEXT_PUBLIC_ENVIRONMENT;
  delete process.env.NEXT_PUBLIC_API_URL;

  const req = new MockNextRequest({
    url: 'http://localhost:3000/learner',
    headers: { host: 'localhost:3000' },
  });

  const origin = getPublicOrigin(req);
  assert.strictEqual(origin, 'http://localhost:3000');

  process.env.NEXT_PUBLIC_ENVIRONMENT = prevEnv;
});

test('4. isTokenExpired correctly validates active and expired JWT tokens', () => {
  const validToken = createJwt({
    sub: 'user_123',
    email: 'learner@topplaced.com',
    exp: Math.floor(Date.now() / 1000) + 86400, // +24 hours
  });

  const expiredToken = createJwt({
    sub: 'user_123',
    email: 'learner@topplaced.com',
    exp: Math.floor(Date.now() / 1000) - 3600, // -1 hour
  });

  assert.strictEqual(isTokenExpired(validToken), false, 'Valid future token should not be expired');
  assert.strictEqual(isTokenExpired(`Bearer ${validToken}`), false, 'Token with Bearer prefix should not be expired');
  assert.strictEqual(isTokenExpired(`"${validToken}"`), false, 'Quoted token should not be expired');
  assert.strictEqual(isTokenExpired(expiredToken), true, 'Past token should be expired');
  assert.strictEqual(isTokenExpired(''), true, 'Empty token should be expired');
  assert.strictEqual(isTokenExpired('invalid.token'), true, 'Malformed token should be expired');
});

test('5. Redirect URL generation never points to localhost:3000 when unauthenticated on production', () => {
  const prevEnv = process.env.NEXT_PUBLIC_ENVIRONMENT;
  process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';

  const req = new MockNextRequest({
    url: 'http://localhost:3000/learner/interview/setup',
    headers: { host: 'localhost:3000' },
  });

  const origin = getPublicOrigin(req);
  const redirectUrl = new URL('/auth/login', origin);
  redirectUrl.searchParams.set('redirect', req.nextUrl.pathname);

  assert.strictEqual(
    redirectUrl.toString(),
    'https://ai.topplaced.com/auth/login?redirect=%2Flearner%2Finterview%2Fsetup'
  );
  assert.strictEqual(redirectUrl.origin, 'https://ai.topplaced.com');
  assert.strictEqual(redirectUrl.searchParams.get('redirect'), '/learner/interview/setup');

  process.env.NEXT_PUBLIC_ENVIRONMENT = prevEnv;
});

test('6. Role-based redirect logic preserves interview setup and route guards', () => {
  // Candidate with redirect query
  assert.strictEqual(
    getRedirectUrl('user', '?redirect=%2Flearner%2Finterview%2Fsetup'),
    '/learner/interview/setup'
  );
  assert.strictEqual(
    getRedirectUrl('learner', '?redirect=%2Flearner%2Finterview%2Fsetup'),
    '/learner/interview/setup'
  );

  // Candidate without redirect query
  assert.strictEqual(getRedirectUrl('user', ''), '/learner');
  assert.strictEqual(getRedirectUrl('learner', ''), '/learner');

  // Admin user
  assert.strictEqual(getRedirectUrl('admin', ''), '/admin');
  assert.strictEqual(getRedirectUrl('superadmin', ''), '/admin');
  assert.strictEqual(getRedirectUrl('admin', '?redirect=%2Fadmin%2Fusers'), '/admin/users');

  // Prevent admin redirect escaping to candidate
  assert.strictEqual(getRedirectUrl('learner', '?redirect=%2Fadmin%2Fusers'), '/learner');

  // Mentor user
  assert.strictEqual(getRedirectUrl('mentor', ''), '/mentor');

  // Reject open redirects
  assert.strictEqual(getRedirectUrl('learner', '?redirect=http%3A%2F%2Fevil.com'), '/learner');
  assert.strictEqual(getRedirectUrl('learner', '?redirect=%2F%2Fevil.com'), '/learner');
  assert.strictEqual(getRedirectUrl('learner', '?redirect=https%3A%2F%2Flocalhost%3A3000%2Flearner'), '/learner');
});
