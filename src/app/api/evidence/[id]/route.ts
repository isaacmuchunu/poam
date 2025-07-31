import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { evidenceFiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/evidence/[id] - Get a specific evidence file
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const [evidenceFile] = await db
        .select()
        .from(evidenceFiles)
        .where(and(eq(evidenceFiles.id, params.id), eq(evidenceFiles.organizationId, tenantId)))
        .limit(1);
      
      if (!evidenceFile) {
        return NextResponse.json({ error: 'Evidence file not found' }, { status: 404 });
      }
      
      return NextResponse.json(evidenceFile);
    } catch (error) {
      console.error('Error fetching evidence file:', error);
      return NextResponse.json({ error: 'Failed to fetch evidence file' }, { status: 500 });
    }
  });
}

// PUT /api/evidence/[id] - Update a specific evidence file
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
        .update(evidenceFiles)
        .set(body)
        .where(and(eq(evidenceFiles.id, params.id), eq(evidenceFiles.organizationId, tenantId)))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'Evidence file not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating evidence file:', error);
      return NextResponse.json({ error: 'Failed to update evidence file' }, { status: 500 });
    }
  });
}

// DELETE /api/evidence/[id] - Delete a specific evidence file
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [deleted] = await db
        .delete(evidenceFiles)
        .where(and(eq(evidenceFiles.id, params.id), eq(evidenceFiles.organizationId, tenantId)))
        .returning();
      
      if (!deleted) {
        return NextResponse.json({ error: 'Evidence file not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error deleting evidence file:', error);
      return NextResponse.json({ error: 'Failed to delete evidence file' }, { status: 500 });
    }
  });
}
