import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { auditTemplates } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateAuditTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  frameworkType: z.enum(['ISO27001', 'NIST', 'SOC2', 'PCI_DSS', 'GDPR']).optional(),
  version: z.string().min(1, 'Version is required').optional(),
  controls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedHours: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    evidenceRequirements: z.array(z.string()).optional(),
  })).optional(),
  industryVertical: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/templates/audit/[id] - Get specific audit template
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const template = await db.select().from(auditTemplates)
      .where(
        and(
          eq(auditTemplates.id, params.id),
          or(
            eq(auditTemplates.organizationId, orgId),
            eq(auditTemplates.isGlobal, true)
          )
        )
      )
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json(template[0]);
  } catch (error) {
    console.error('Error fetching audit template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

// PUT /api/templates/audit/[id] - Update audit template
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = updateAuditTemplateSchema.parse(body);

    // Check if template exists and belongs to organization
    const existingTemplate = await db.select().from(auditTemplates)
      .where(
        and(
          eq(auditTemplates.id, params.id),
          eq(auditTemplates.organizationId, orgId),
          eq(auditTemplates.isCustom, true) // Only custom templates can be updated
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ error: 'Template not found or cannot be modified' }, { status: 404 });
    }

    const updatedTemplate = await db.update(auditTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(auditTemplates.id, params.id))
      .returning();

    return NextResponse.json(updatedTemplate[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error updating audit template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

// DELETE /api/templates/audit/[id] - Delete audit template
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if template exists and belongs to organization
    const existingTemplate = await db.select().from(auditTemplates)
      .where(
        and(
          eq(auditTemplates.id, params.id),
          eq(auditTemplates.organizationId, orgId),
          eq(auditTemplates.isCustom, true) // Only custom templates can be deleted
        )
      )
      .limit(1);

    if (existingTemplate.length === 0) {
      return NextResponse.json({ error: 'Template not found or cannot be deleted' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    await db.update(auditTemplates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(auditTemplates.id, params.id));

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting audit template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}