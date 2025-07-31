import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { organizations } from '@/db/schema';
import { organizationSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

// GET /api/tenant/details - Get tenant details
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    const db = getTenantDbFromRequest(req);
    
    // Get organization details
    const org = await db.select().from(organizations)
      .where(eq(organizations.id, tenantId))
      .limit(1);
    
    if (org.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    return NextResponse.json(org[0]);
  } catch (error) {
    console.error('Error fetching tenant details:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant details' }, { status: 500 });
  }
}

// PATCH /api/tenant/details - Update tenant details
export async function PATCH(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = organizationSchema.partial().parse(body);
    
    const db = getTenantDbFromRequest(req);
    
    // Update organization
    const result = await db.update(organizations)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(organizations.id, tenantId))
      .returning();
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('Error updating tenant details:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: (error as { errors: unknown[] }).errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update tenant details' }, { status: 500 });
  }
}
