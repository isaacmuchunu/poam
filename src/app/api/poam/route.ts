import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { poamItems } from '@/db/schema';
import { poamItemSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

// GET /api/poam - Get all POA&M items for tenant
export async function GET(req: NextRequest) {
  try {
    const db = getTenantDbFromRequest(req);
    const items = await db.select().from(poamItems);
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching POA&M items:', error);
    return NextResponse.json({ error: 'Failed to fetch POA&M items' }, { status: 500 });
  }
}

// POST /api/poam - Create a new POA&M item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    // Validate request body
    const validatedData = poamItemSchema.parse(body);
    
    // Get tenant-specific database client
    const db = getTenantDbFromRequest(req);
    
    // Insert new POA&M item
    const result = await db.insert(poamItems).values({
      ...validatedData,
      organizationId: tenantId,
      creationDate: new Date(),
    }).returning();
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating POA&M item:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to create POA&M item' }, { status: 500 });
  }
}
