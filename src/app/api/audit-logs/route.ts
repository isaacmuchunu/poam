import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { auditLogs } from '@/db/schema';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

// GET /api/audit-logs - Get all audit logs for tenant with pagination and filtering
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '50');
      const action = searchParams.get('action');
      const entityType = searchParams.get('entityType');
      const userId = searchParams.get('userId');
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');
      
      const offset = (page - 1) * limit;
      
      const db = getTenantDbFromRequest(req);
      
      let whereConditions = [eq(auditLogs.organizationId, tenantId)];
      
      if (action) {
        whereConditions.push(eq(auditLogs.action, action));
      }
      
      if (entityType) {
        whereConditions.push(eq(auditLogs.entityType, entityType));
      }
      
      if (userId) {
        whereConditions.push(eq(auditLogs.userId, userId));
      }
      
      if (startDate) {
        whereConditions.push(gte(auditLogs.createdAt, new Date(startDate)));
      }
      
      if (endDate) {
        whereConditions.push(lte(auditLogs.createdAt, new Date(endDate)));
      }
      
      const items = await db
        .select()
        .from(auditLogs)
        .where(and(...whereConditions))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limit)
        .offset(offset);
      
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
    }
  });
}

// POST /api/audit-logs - Create a new audit log entry
export async function POST(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      const userId = req.headers.get('x-user-id');
      const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const userAgent = req.headers.get('user-agent') || 'unknown';
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const result = await db.insert(auditLogs).values({
        ...body,
        organizationId: tenantId,
        userId: userId || null,
        ipAddress,
        userAgent,
        createdAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error creating audit log:', error);
      return NextResponse.json({ error: 'Failed to create audit log' }, { status: 500 });
    }
  });
}
