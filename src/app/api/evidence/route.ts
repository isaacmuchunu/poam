import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { evidenceFiles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/evidence - Get all evidence files for tenant
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const { searchParams } = new URL(req.url);
      const poamItemId = searchParams.get('poamItemId');
      
      const db = getTenantDbFromRequest(req);
      
      let query = db.select().from(evidenceFiles).where(eq(evidenceFiles.organizationId, tenantId));
      
      if (poamItemId) {
        query = query.where(and(
          eq(evidenceFiles.organizationId, tenantId),
          eq(evidenceFiles.poamItemId, poamItemId)
        ));
      }
      
      const items = await query;
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching evidence files:', error);
      return NextResponse.json({ error: 'Failed to fetch evidence files' }, { status: 500 });
    }
  });
}

// POST /api/evidence - Create a new evidence file record
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
      
      const result = await db.insert(evidenceFiles).values({
        ...body,
        organizationId: tenantId,
        uploadedById: userId,
        uploadedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error creating evidence file:', error);
      return NextResponse.json({ error: 'Failed to create evidence file' }, { status: 500 });
    }
  });
}
