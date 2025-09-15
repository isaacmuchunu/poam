import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { actionPlanTemplates } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';
import { z } from 'zod';

const actionPlanTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  industryVertical: z.string().min(1, 'Industry vertical is required'),
  frameworkType: z.string().optional(),
  tasks: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'critical']),
    estimatedHours: z.number().optional(),
    dependencies: z.array(z.string()).optional(),
    skillsRequired: z.array(z.string()).optional(),
    deliverables: z.array(z.string()).optional(),
    acceptanceCriteria: z.array(z.string()).optional(),
  })),
  estimatedDuration: z.number().optional(),
  complexity: z.enum(['low', 'medium', 'high']).optional(),
  isCustom: z.boolean().default(false),
});

// GET /api/templates/action-plans - List action plan templates
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const industryVertical = url.searchParams.get('industry');
    const frameworkType = url.searchParams.get('framework');
    const complexity = url.searchParams.get('complexity');
    const includeGlobal = url.searchParams.get('includeGlobal') === 'true';

    let conditions = [];
    
    // Include organization-specific templates
    conditions.push(eq(actionPlanTemplates.organizationId, orgId));
    
    // Include global templates if requested
    if (includeGlobal) {
      conditions.push(eq(actionPlanTemplates.isGlobal, true));
    }

    let query = db.select().from(actionPlanTemplates)
      .where(
        and(
          or(...conditions),
          eq(actionPlanTemplates.isActive, true),
          industryVertical ? eq(actionPlanTemplates.industryVertical, industryVertical) : undefined,
          frameworkType ? eq(actionPlanTemplates.frameworkType, frameworkType) : undefined,
          complexity ? eq(actionPlanTemplates.complexity, complexity) : undefined
        )
      );

    const templates = await query;

    return NextResponse.json({
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Error fetching action plan templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

// POST /api/templates/action-plans - Create action plan template
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = actionPlanTemplateSchema.parse(body);

    const newTemplate = await db.insert(actionPlanTemplates).values({
      organizationId: orgId,
      createdById: userId,
      ...validatedData,
    }).returning();

    return NextResponse.json(newTemplate[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating action plan template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}