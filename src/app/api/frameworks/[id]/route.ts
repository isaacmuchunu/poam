import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { frameworks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/frameworks/[id] - Get a specific framework
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const [framework] = await db
        .select()
        .from(frameworks)
        .where(and(eq(frameworks.id, params.id), eq(frameworks.organizationId, tenantId)))
        .limit(1);
      
      if (!framework) {
        return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
      }
      
      return NextResponse.json(framework);
    } catch (error) {
      console.error('Error fetching framework:', error);
      return NextResponse.json({ error: 'Failed to fetch framework' }, { status: 500 });
    }
  });
}

// PUT /api/frameworks/[id] - Update a specific framework
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
        .update(frameworks)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(eq(frameworks.id, params.id), eq(frameworks.organizationId, tenantId)))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating framework:', error);
      return NextResponse.json({ error: 'Failed to update framework' }, { status: 500 });
    }
  });
}

// DELETE /api/frameworks/[id] - Delete a specific framework
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [deleted] = await db
        .delete(frameworks)
        .where(and(eq(frameworks.id, params.id), eq(frameworks.organizationId, tenantId)))
        .returning();
      
      if (!deleted) {
        return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting framework:', error);
      return NextResponse.json({ error: 'Failed to delete framework' }, { status: 500 });
    }
  });
}
