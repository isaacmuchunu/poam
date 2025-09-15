import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { poamItems } from '@/db/schema';
import { poamItemSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

// GET /api/poam/[id] - Get a specific POA&M item
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getTenantDbFromRequest(req);
    
    const item = await db.select().from(poamItems).where(eq(poamItems.id, id)).limit(1);
    
    if (item.length === 0) {
      return NextResponse.json({ error: 'POA&M item not found' }, { status: 404 });
    }
    
    return NextResponse.json(item[0]);
  } catch (error) {
    console.error('Error fetching POA&M item:', error);
    return NextResponse.json({ error: 'Failed to fetch POA&M item' }, { status: 500 });
  }
}

// PATCH /api/poam/[id] - Update a POA&M item
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await req.json();
    
    // Validate request body
    const validatedData = poamItemSchema.partial().parse(body);
    
    // Get tenant-specific database client
    const db = getTenantDbFromRequest(req);
    
    // Check if item exists
    const existingItem = await db.select().from(poamItems).where(eq(poamItems.id, id)).limit(1);
    
    if (existingItem.length === 0) {
      return NextResponse.json({ error: 'POA&M item not found' }, { status: 404 });
    }
    
    // Update POA&M item
    const result = await db.update(poamItems)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(poamItems.id, id))
      .returning();
    
    return NextResponse.json(result[0]);
  } catch (error: unknown) {
    console.error('Error updating POA&M item:', error);
    
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: (error as { errors: unknown[] }).errors 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update POA&M item' }, { status: 500 });
  }
}

// DELETE /api/poam/[id] - Delete a POA&M item
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const db = getTenantDbFromRequest(req);
    
    // Check if item exists
    const existingItem = await db.select().from(poamItems).where(eq(poamItems.id, id)).limit(1);
    
    if (existingItem.length === 0) {
      return NextResponse.json({ error: 'POA&M item not found' }, { status: 404 });
    }
    
    // Delete POA&M item
    await db.delete(poamItems).where(eq(poamItems.id, id));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting POA&M item:', error);
    return NextResponse.json({ error: 'Failed to delete POA&M item' }, { status: 500 });
  }
}
