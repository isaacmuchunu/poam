import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { milestones, tasks, poamItems } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

const milestoneSchema = z.object({
  poamItemId: z.string().uuid('Invalid POA&M item ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  parentMilestoneId: z.string().uuid().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assigneeId: z.string().uuid().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  estimatedHours: z.number().int().positive().optional(),
  riskLevel: z.enum(['low', 'medium', 'high']).default('low'),
});

// GET /api/milestones - List milestones
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const poamItemId = url.searchParams.get('poamItemId');
    const status = url.searchParams.get('status');
    const assigneeId = url.searchParams.get('assigneeId');
    const priority = url.searchParams.get('priority');
    const sortBy = url.searchParams.get('sortBy') || 'plannedEndDate';
    const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? desc : asc;

    let conditions = [eq(milestones.organizationId, orgId)];
    
    if (poamItemId) {
      conditions.push(eq(milestones.poamItemId, poamItemId));
    }
    if (status) {
      conditions.push(eq(milestones.status, status));
    }
    if (assigneeId) {
      conditions.push(eq(milestones.assigneeId, assigneeId));
    }
    if (priority) {
      conditions.push(eq(milestones.priority, priority));
    }

    const milestonesData = await db
      .select({
        milestone: milestones,
        taskCount: db
          .select({ count: sql`count(*)` })
          .from(tasks)
          .where(eq(tasks.milestoneId, milestones.id))
          .as('taskCount')
      })
      .from(milestones)
      .where(and(...conditions))
      .orderBy(sortOrder(milestones[sortBy as keyof typeof milestones] || milestones.plannedEndDate));

    // Calculate progress for each milestone
    const milestonesWithProgress = await Promise.all(
      milestonesData.map(async (item) => {
        const milestoneTasksData = await db
          .select()
          .from(tasks)
          .where(eq(tasks.milestoneId, item.milestone.id));

        const totalTasks = milestoneTasksData.length;
        const completedTasks = milestoneTasksData.filter(task => task.status === 'completed').length;
        const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...item.milestone,
          taskCount: totalTasks,
          completedTaskCount: completedTasks,
          progressPercentage,
        };
      })
    );

    return NextResponse.json({
      milestones: milestonesWithProgress,
      count: milestonesWithProgress.length
    });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    return NextResponse.json({ error: 'Failed to fetch milestones' }, { status: 500 });
  }
}

// POST /api/milestones - Create milestone
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = milestoneSchema.parse(body);

    // Verify POA&M item exists and belongs to organization
    const poamItem = await db
      .select()
      .from(poamItems)
      .where(
        and(
          eq(poamItems.id, validatedData.poamItemId),
          eq(poamItems.organizationId, orgId)
        )
      )
      .limit(1);

    if (poamItem.length === 0) {
      return NextResponse.json({ error: 'POA&M item not found' }, { status: 404 });
    }

    // If parent milestone specified, verify it exists
    if (validatedData.parentMilestoneId) {
      const parentMilestone = await db
        .select()
        .from(milestones)
        .where(
          and(
            eq(milestones.id, validatedData.parentMilestoneId),
            eq(milestones.organizationId, orgId)
          )
        )
        .limit(1);

      if (parentMilestone.length === 0) {
        return NextResponse.json({ error: 'Parent milestone not found' }, { status: 404 });
      }
    }

    const newMilestone = await db.insert(milestones).values({
      organizationId: orgId,
      ...validatedData,
      plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : null,
      plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : null,
    }).returning();

    return NextResponse.json(newMilestone[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating milestone:', error);
    return NextResponse.json({ error: 'Failed to create milestone' }, { status: 500 });
  }
}