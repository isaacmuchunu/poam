import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

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

// Clerk authentication middleware configuration
export default clerkMiddleware(async (auth, req) => {
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
    
    // Add tenant ID to headers for API routes
    if (orgId && req.nextUrl.pathname.startsWith('/api/')) {
      const requestHeaders = new Headers(req.headers);
      requestHeaders.set('x-tenant-id', orgId);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
