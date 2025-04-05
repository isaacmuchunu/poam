import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/users - Get all users for tenant
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = getTenantDbFromRequest(req);
    const allUsers = await db.select().from(users);
    
    return NextResponse.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Get tenant-specific database client
    const db = getTenantDbFromRequest(req);
    
    // Insert new user
    const result = await db.insert(users).values({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
