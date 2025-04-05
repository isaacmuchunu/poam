import { authMiddleware, clerkClient } from '@clerk/nextjs';
import { NextResponse } from 'next/server';

// Clerk authentication middleware configuration
export default authMiddleware({
  // Public routes that don't require authentication
  publicRoutes: [
    '/',
    '/api/webhooks/clerk',
    '/login',
    '/sign-up',
    '/pricing',
    '/about',
    '/contact',
    '/api/health'
  ],
  
  // Function to run after authentication check
  async afterAuth(auth, req, evt) {
    // If the user is authenticated and trying to access a protected route
    if (auth.userId && !auth.isPublicRoute) {
      // Get the organization from the request
      const { userId, orgId } = auth;
      
      // If no organization is selected, redirect to organization selection
      if (!orgId && !req.nextUrl.pathname.startsWith('/select-organization')) {
        const selectOrgUrl = new URL('/select-organization', req.url);
        return NextResponse.redirect(selectOrgUrl);
      }
      
      // Add tenant ID to headers for API routes
      if (orgId && req.nextUrl.pathname.startsWith('/api/')) {
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('x-tenant-id', orgId);
        
        // Return the request with the modified headers
        return NextResponse.next({
          request: {
            headers: requestHeaders,
          },
        });
      }
    }
    
    // If the user is not authenticated and trying to access a protected route
    if (!auth.userId && !auth.isPublicRoute) {
      const signInUrl = new URL('/login', req.url);
      signInUrl.searchParams.set('redirect_url', req.url);
      return NextResponse.redirect(signInUrl);
    }
    
    return NextResponse.next();
  },
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
