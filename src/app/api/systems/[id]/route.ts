import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { systems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/systems/[id] - Get a specific system
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const [system] = await db
        .select()
        .from(systems)
        .where(and(eq(systems.id, params.id), eq(systems.organizationId, tenantId)))
        .limit(1);
      
      if (!system) {
        return NextResponse.json({ error: 'System not found' }, { status: 404 });
      }
      
      return NextResponse.json(system);
    } catch (error) {
      console.error('Error fetching system:', error);
      return NextResponse.json({ error: 'Failed to fetch system' }, { status: 500 });
    }
  });
}

// PUT /api/systems/[id] - Update a specific system
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
        .update(systems)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(eq(systems.id, params.id), eq(systems.organizationId, tenantId)))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'System not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating system:', error);
      return NextResponse.json({ error: 'Failed to update system' }, { status: 500 });
    }
  });
}

// DELETE /api/systems/[id] - Delete a specific system
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [deleted] = await db
        .delete(systems)
        .where(and(eq(systems.id, params.id), eq(systems.organizationId, tenantId)))
        .returning();
      
      if (!deleted) {
        return NextResponse.json({ error: 'System not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting system:', error);
      return NextResponse.json({ error: 'Failed to delete system' }, { status: 500 });
    }
  });
}
