import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { organizations } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/organizations - Get organization details
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const [organization] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, tenantId))
        .limit(1);
      
      if (!organization) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });  
      }
      
      return NextResponse.json(organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }
  });
}

// PUT /api/organizations - Update organization details
export async function PUT(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const [updated] = await db
        .update(organizations)
        .set({
          ...body,
          updatedAt: new Date()
        })
        .where(eq(organizations.id, tenantId))
        .returning();
      
      if (!updated) {
        return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
      }
      
      return NextResponse.json(updated);
    } catch (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json({ error: 'Failed to update organization' }, { status: 500 });
    }
  });
}
