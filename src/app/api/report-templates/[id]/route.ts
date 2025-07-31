import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { reportTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/report-templates/[id] - Get a specific report template
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const [template] = await db
        .select()
        .from(reportTemplates)
        .where(and(eq(reportTemplates.id, params.id), eq(reportTemplates.organizationId, tenantId)))
        .limit(1);
      
      if (!template) {
        return NextResponse.json({ error: 'Report template not found' }, { status: 404 });
      }
      
      return NextResponse.json(template);
    } catch (error) {
      console.error('Error fetching report template:', error);
      return NextResponse.json({ error: 'Failed to fetch report template' }, { status: 500 });
    }
  });
}

// PUT /api/report-templates/[id] - Update a specific report template
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [updated] = await db
        .update(reportTemplates)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(eq(reportTemplates.id, params.id), eq(reportTemplates.organizationId, tenantId)))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'Report template not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating report template:', error);
      return NextResponse.json({ error: 'Failed to update report template' }, { status: 500 });
    }
  });
}

// DELETE /api/report-templates/[id] - Delete a specific report template
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [deleted] = await db
        .delete(reportTemplates)
        .where(and(eq(reportTemplates.id, params.id), eq(reportTemplates.organizationId, tenantId)))
        .returning();
      
      if (!deleted) {
        return NextResponse.json({ error: 'Report template not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting report template:', error);
      return NextResponse.json({ error: 'Failed to delete report template' }, { status: 500 });
    }
  });
}
