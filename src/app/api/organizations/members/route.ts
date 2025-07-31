import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { organizationMemberships, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/organizations/members - Get all organization members
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const tenantId = req.headers.get('x-tenant-id');
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      const members = await db
        .select({
          id: organizationMemberships.id,
          role: organizationMemberships.role,
          createdAt: organizationMemberships.createdAt,
          updatedAt: organizationMemberships.updatedAt,
          user: {
            id: users.id,
            clerkId: users.clerkId,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(organizationMemberships)
        .innerJoin(users, eq(organizationMemberships.userId, users.id))
        .where(eq(organizationMemberships.organizationId, tenantId));
      
      return NextResponse.json(members);
    } catch (error) {
      console.error('Error fetching organization members:', error);
      return NextResponse.json({ error: 'Failed to fetch organization members' }, { status: 500 });
    }
  });
}

// POST /api/organizations/members - Add a new member to organization
export async function POST(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    try {
      const body = await req.json();
      const tenantId = req.headers.get('x-tenant-id');
      
      if (!tenantId) {
        return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
      }
      
      const db = getTenantDbFromRequest(req);
      
      const result = await db.insert(organizationMemberships).values({
        ...body,
        organizationId: tenantId,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error) {
      console.error('Error adding organization member:', error);
      return NextResponse.json({ error: 'Failed to add organization member' }, { status: 500 });
    }
  });
}
