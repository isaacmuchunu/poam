import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { reportTemplates } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/report-templates - Get all report templates for tenant
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const items = await db
        .select()
        .from(reportTemplates)
        .where(eq(reportTemplates.organizationId, tenantId));
      
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching report templates:', error);
      return NextResponse.json({ error: 'Failed to fetch report templates' }, { status: 500 });
    }
  });
}

// POST /api/report-templates - Create a new report template
export async function POST(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      const userId = req.headers.get('x-user-id');
      
      if (!tenantId || !userId) {
        return NextResponse.json({ error: 'No tenant or user context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const result = await db.insert(reportTemplates).values({
        ...body,
        organizationId: tenantId,
        createdById: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error creating report template:', error);
      return NextResponse.json({ error: 'Failed to create report template' }, { status: 500 });
    }
  });
}
