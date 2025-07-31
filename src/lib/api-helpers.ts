import { NextRequest, NextResponse } from 'next/server';
import { auditLogs } from '@/db/schema';
import { getTenantDbFromRequest } from '@/middleware/tenant';

// Helper to log API actions for audit trail
export async function logAuditAction(
  req: NextRequest,
  action: string,
  entityType: string,
  entityId?: string,
  details?: any
) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    const userId = req.headers.get('x-user-id');
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    if (!tenantId) return;

    const db = getTenantDbFromRequest(req);
    
    await db.insert(auditLogs).values({
      organizationId: tenantId,
      userId: userId || null,
      action,
      entityType,
      entityId,
      details,
      ipAddress,
      userAgent,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw error to avoid disrupting the main operation
  }
}

// Helper to validate tenant access
export function validateTenantAccess(req: NextRequest): {
  tenantId: string | null;
  userId: string | null;
  error?: NextResponse;
} {
  const tenantId = req.headers.get('x-tenant-id');
  const userId = req.headers.get('x-user-id');

  if (!tenantId) {
    return {
      tenantId: null,
      userId: null,
      error: NextResponse.json({ error: 'No tenant context' }, { status: 403 })
    };
  }

  return { tenantId, userId };
}

// Helper to handle common API errors
export function handleApiError(error: any, operation: string) {
  console.error(`Error in ${operation}:`, error);
  
  if (error.message?.includes('not found')) {
    return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
  }
  
  if (error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }
  
  if (error.message?.includes('validation')) {
    return NextResponse.json({ error: 'Validation failed', details: error.details }, { status: 400 });
  }
  
  return NextResponse.json({ error: `Failed to ${operation}` }, { status: 500 });
}

// Helper to format response with metadata
export function formatApiResponse(data: any, metadata?: {
  total?: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}) {
  return {
    data,
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };
}

// Helper to parse query parameters
export function parseQueryParams(url: string) {
  const { searchParams } = new URL(url);
  const params: Record<string, any> = {};
  
  for (const [key, value] of searchParams.entries()) {
    // Handle numeric parameters
    if (!isNaN(Number(value))) {
      params[key] = Number(value);
    }
    // Handle boolean parameters
    else if (value === 'true' || value === 'false') {
      params[key] = value === 'true';
    }
    // Handle array parameters (comma-separated)
    else if (value.includes(',')) {
      params[key] = value.split(',').map(v => v.trim());
    }
    else {
      params[key] = value;
    }
  }
  
  return params;
}

// Helper to validate required fields
export function validateRequiredFields(data: any, requiredFields: string[]): string[] {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  }
  
  return missingFields;
}

// Helper to sanitize data for database insertion
export function sanitizeData(data: any, allowedFields: string[]) {
  const sanitized: any = {};
  
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      sanitized[field] = data[field];
    }
  }
  
  return sanitized;
}
