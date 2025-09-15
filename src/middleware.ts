import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { securityMiddleware, rateLimitMiddleware } from '@/lib/middleware';

// Define public routes
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/webhooks/clerk',
  '/login',
  '/sign-up',
  '/pricing',
  '/about',
  '/contact',
  '/api/health'
]);

// Define API routes that need rate limiting
const isApiRoute = createRouteMatcher(['/api/(.*)']);

// Clerk authentication middleware configuration with enhanced security
export default clerkMiddleware(async (auth, req) => {
  // Apply rate limiting to API routes
  if (isApiRoute(req)) {
    const rateLimitResponse = await rateLimitMiddleware(req, async (req) => {
      return NextResponse.next();
    });
    
    if (rateLimitResponse.status === 429) {
      return rateLimitResponse;
    }
  }

  // If the route is not public, require authentication
  if (!isPublicRoute(req)) {
    const { userId, orgId, redirectToSignIn } = await auth();
    
    // If user is not authenticated, redirect to sign in
    if (!userId) {
      return redirectToSignIn();
    }
    
    // If no organization is selected, redirect to organization selection
    if (!orgId && !req.nextUrl.pathname.startsWith('/select-organization')) {
      const selectOrgUrl = new URL('/select-organization', req.url);
      return NextResponse.redirect(selectOrgUrl);
    }
    
    // Apply security middleware for authenticated routes
    const securityResponse = await securityMiddleware(req);
    if (securityResponse) {
      return securityResponse;
    }
    
    // Add tenant ID and security headers for API routes
    if (orgId && req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-id', orgId);
      requestHeaders.set('x-user-id', userId);
      requestHeaders.set('x-request-id', crypto.randomUUID());
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  
  // Add security headers to all responses
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.dev https://*.clerk.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://clerk.dev https://*.clerk.dev https://api.clerk.dev wss:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
