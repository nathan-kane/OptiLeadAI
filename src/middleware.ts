import { NextRequest, NextResponse } from 'next/server';

// API routes that require active subscription
const PROTECTED_API_ROUTES = [
  '/api/call-prospect',
  '/api/lead-scoring',
  '/api/email-personalization',
  '/api/drip-campaigns',
  '/api/analytics'
];

// API routes that don't require subscription (auth, billing, etc.)
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/stripe',
  '/api/default-prompt'
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply middleware to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if this is a protected API route
  if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
    // Add a header to indicate this route requires subscription check
    // The actual subscription verification will be done in each API route
    const response = NextResponse.next();
    response.headers.set('X-Requires-Subscription', 'true');
    return response;
  }

  // For other API routes, continue without subscription check
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
