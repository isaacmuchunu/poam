import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { systems } from '@/db/schema';
import { systemSchema } from '@/lib/validations';
import { logAuditAction, validateTenantAccess, handleApiError } from '@/lib/api-helpers';
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
      const { tenantId, error } = validateTenantAccess(req);
      
      if (error) return error;
      
      // Validate request body
      const validatedData = systemSchema.parse(body);
      
      // Get tenant-specific database client
      const db = getTenantDbFromRequest(req);
      
      // Insert new system
      const result = await db.insert(systems).values({
        ...validatedData,
        organizationId: tenantId!,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      // Log audit action
      await logAuditAction(req, 'CREATE', 'SYSTEM', result[0].id, { name: result[0].name });
      
      return NextResponse.json(result[0], { status: 201 });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
      }
      return handleApiError(error, 'create system');
    }
  });
}
