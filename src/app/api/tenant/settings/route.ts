import { NextRequest, NextResponse } from 'next/server';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { organizations, tenantSettings } from '@/db/schema';
import { tenantSettingsSchema } from '@/lib/validations';
import { eq } from 'drizzle-orm';

// GET /api/tenant/settings - Get tenant settings
export async function GET(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    const db = getTenantDbFromRequest(req);
    
    // Get tenant settings
    const settings = await db.select().from(tenantSettings)
      .where(eq(tenantSettings.organizationId, tenantId))
      .limit(1);
    
    if (settings.length === 0) {
      // If settings don't exist, return default settings
      return NextResponse.json({
        theme: {
          primaryColor: '#0f172a',
          logoUrl: null,
          favicon: null
        },
        customFields: [],
        notificationSettings: {
          emailEnabled: true,
          slackEnabled: false,
          slackWebhookUrl: null
        },
        securitySettings: {
          mfaRequired: false,
          sessionTimeout: 3600
        }
      });
    }
    
    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json({ error: 'Failed to fetch tenant settings' }, { status: 500 });
  }
}

// PATCH /api/tenant/settings - Update tenant settings
export async function PATCH(req: NextRequest) {
  try {
    const tenantId = req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = tenantSettingsSchema.parse(body);
    
    const db = getTenantDbFromRequest(req);
    
    // Check if settings exist
    const existingSettings = await db.select().from(tenantSettings)
      .where(eq(tenantSettings.organizationId, tenantId))
      .limit(1);
    
    if (existingSettings.length === 0) {
      // If settings don't exist, create them
      const result = await db.insert(tenantSettings).values({
        organizationId: tenantId,
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      
      return NextResponse.json(result[0]);
    }
    
    // Update settings
    const result = await db.update(tenantSettings)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(tenantSettings.organizationId, tenantId))
      .returning();
    
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error('Error updating tenant settings:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Failed to update tenant settings' }, { status: 500 });
  }
}
