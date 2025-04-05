import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { systems } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/systems - Get all systems for tenant
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const db = getTenantDbFromRequest(req);
      const items = await db.select().from(systems);
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching systems:', error);
      return NextResponse.json({ error: 'Failed to fetch systems' }, { status: 500 });
    }
  });
}

// POST /api/systems - Create a new system
export async function POST(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      // Get tenant-specific database client
      const db = getTenantDbFromRequest(req);
      
      // Insert new system
      const result = await db.insert(systems).values({
        ...body,
        organizationId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error creating system:', error);
      return NextResponse.json({ error: 'Failed to create system' }, { status: 500 });
    }
  });
}
