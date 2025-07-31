import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { organizationMemberships } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/organizations/members/[id] - Update member role
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
        .update(organizationMemberships)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(and(
          eq(organizationMemberships.id, params.id),
          eq(organizationMemberships.organizationId, tenantId)
        ))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating member:', error);
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }
  });
}

// DELETE /api/organizations/members/[id] - Remove member from organization
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [deleted] = await db
        .delete(organizationMemberships)
        .where(and(
          eq(organizationMemberships.id, params.id),
          eq(organizationMemberships.organizationId, tenantId)
        ))
        .returning();
      
      if (!deleted) {
        return NextResponse.json({ error: 'Member not found' }, { status: 404 });
      }
      
      return NextResponse.json({ success: true });
    } catch (error) {
      console.error('Error removing member:', error);
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
    }
  });
}
