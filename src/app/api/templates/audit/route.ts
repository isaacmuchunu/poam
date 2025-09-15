import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { auditTemplates } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';

const auditTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  frameworkType: z.enum(['ISO27001', 'NIST', 'SOC2', 'PCI_DSS', 'GDPR']),
  version: z.string().min(1, 'Version is required'),
  controls: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedHours: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    evidenceRequirements: z.array(z.string()).optional(),
  })),
  industryVertical: z.string().optional(),
  isCustom: z.boolean().default(false),
});

// GET /api/templates/audit - List audit templates
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const frameworkType = url.searchParams.get('framework');
    const industryVertical = url.searchParams.get('industry');
    const includeGlobal = url.searchParams.get('includeGlobal') === 'true';

    let conditions = [];
    
    // Include organization-specific templates
    conditions.push(eq(auditTemplates.organizationId, orgId));
    
    // Include global templates if requested
    if (includeGlobal) {
      conditions.push(eq(auditTemplates.isGlobal, true));
    }

    let query = db.select().from(auditTemplates)
      .where(
        and(
          or(...conditions),
          eq(auditTemplates.isActive, true),
          frameworkType ? eq(auditTemplates.frameworkType, frameworkType) : undefined,
          industryVertical ? eq(auditTemplates.industryVertical, industryVertical) : undefined
        )
      );

    const templates = await query;

    return NextResponse.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching audit templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates/audit - Create audit template
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = auditTemplateSchema.parse(body);

    const newTemplate = await db.insert(auditTemplates).values({
      organizationId: orgId,
      createdById: userId,
      ...validatedData,
    }).returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating audit template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}