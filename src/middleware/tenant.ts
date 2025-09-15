import { NextRequest, NextResponse } from 'next/server';
import { getTenantDb } from '@/db/client';

// Middleware to set tenant context based on Clerk organization
export const tenantMiddleware = async (req: NextRequest) => {
  const tenantId = req.headers.get('x-tenant-id');
  
  if (!tenantId) {
    return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
  }
  
  // Set schema for this request
  const schema = `tenant_${tenantId}`;
  
  // Clone the request and add tenant information to headers
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-tenant-schema', schema);
  
  // Return modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};

// Helper function to get tenant ID from request
export const getTenantId = (req: NextRequest): string | null => {
  return req.headers.get('x-tenant-id');
};

// Helper function to get tenant schema from request
export const getTenantSchema = (req: NextRequest): string | null => {
  return req.headers.get('x-tenant-schema');
};

// Helper function to get tenant-specific database client
export const getTenantDbFromRequest = (req: NextRequest) => {
  const tenantId = getTenantId(req);
  if (!tenantId) {
    throw new Error('No tenant context');
  }
  return getTenantDb(tenantId);
};
