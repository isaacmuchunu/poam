import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { frameworks } from '@/db/schema';

// GET /api/frameworks - Get all compliance frameworks for tenant
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const db = getTenantDbFromRequest(req);
      const items = await db.select().from(frameworks);
      return NextResponse.json(items);
    } catch (error) {
      console.error('Error fetching frameworks:', error);
      return NextResponse.json({ error: 'Failed to fetch frameworks' }, { status: 500 });
    }
  });
}

// POST /api/frameworks - Create a new compliance framework
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
      
      // Insert new framework
      const result = await db.insert(frameworks).values({
        ...body,
        organizationId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error creating framework:', error);
      return NextResponse.json({ error: 'Failed to create framework' }, { status: 500 });
    }
  });
}
