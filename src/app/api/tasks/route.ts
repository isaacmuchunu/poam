import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { tasks, milestones } from '@/db/schema';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { z } from 'zod';

const taskSchema = z.object({
  milestoneId: z.string().uuid('Invalid milestone ID'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  assigneeId: z.string().uuid().optional(),
  plannedStartDate: z.string().datetime().optional(),
  plannedEndDate: z.string().datetime().optional(),
  estimatedHours: z.number().int().positive().optional(),
  dependencies: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string()).optional(),
});

// GET /api/tasks - List tasks
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const milestoneId = url.searchParams.get('milestoneId');
    const status = url.searchParams.get('status');
    const assigneeId = url.searchParams.get('assigneeId');
    const priority = url.searchParams.get('priority');
    const sortBy = url.searchParams.get('sortBy') || 'plannedEndDate';
    const sortOrder = url.searchParams.get('sortOrder') === 'desc' ? desc : asc;

    let conditions = [eq(tasks.organizationId, orgId)];
    
    if (milestoneId) {
      conditions.push(eq(tasks.milestoneId, milestoneId));
    }
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    if (assigneeId) {
      conditions.push(eq(tasks.assigneeId, assigneeId));
    }
    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    const tasksData = await db
      .select({
        task: tasks,
        milestone: {
          id: milestones.id,
          name: milestones.name,
          poamItemId: milestones.poamItemId,
        }
      })
      .from(tasks)
      .leftJoin(milestones, eq(tasks.milestoneId, milestones.id))
      .where(and(...conditions))
      .orderBy(sortOrder(tasks[sortBy as keyof typeof tasks] || tasks.plannedEndDate));

    return NextResponse.json({
      tasks: tasksData.map(item => ({
        ...item.task,
        milestone: item.milestone
      })),
      count: tasksData.length
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// POST /api/tasks - Create task
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = taskSchema.parse(body);

    // Verify milestone exists and belongs to organization
    const milestone = await db
      .select()
      .from(milestones)
      .where(
        and(
          eq(milestones.id, validatedData.milestoneId),
          eq(milestones.organizationId, orgId)
        )
      )
      .limit(1);

    if (milestone.length === 0) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const newTask = await db.insert(tasks).values({
      organizationId: orgId,
      ...validatedData,
      plannedStartDate: validatedData.plannedStartDate ? new Date(validatedData.plannedStartDate) : null,
      plannedEndDate: validatedData.plannedEndDate ? new Date(validatedData.plannedEndDate) : null,
    }).returning();

    return NextResponse.json(newTask[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

// PUT /api/tasks/[id] - Update task status and progress
export async function PUT(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, status, actualStartDate, actualEndDate, actualHours } = body;

    // Verify task exists and belongs to organization
    const existingTask = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.id, taskId),
          eq(tasks.organizationId, orgId)
        )
      )
      .limit(1);

    if (existingTask.length === 0) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updateData: any = { status };
    
    if (actualStartDate) {
      updateData.actualStartDate = new Date(actualStartDate);
    }
    if (actualEndDate) {
      updateData.actualEndDate = new Date(actualEndDate);
    }
    if (actualHours) {
      updateData.actualHours = actualHours;
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, taskId))
      .returning();

    // Update milestone progress if needed
    if (status === 'completed' || status === 'cancelled') {
      await updateMilestoneProgress(existingTask[0].milestoneId);
    }

    return NextResponse.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

// Helper function to update milestone progress
async function updateMilestoneProgress(milestoneId: string) {
  const milestoneTasksData = await db
    .select()
    .from(tasks)
    .where(eq(tasks.milestoneId, milestoneId));

  const totalTasks = milestoneTasksData.length;
  const completedTasks = milestoneTasksData.filter(task => task.status === 'completed').length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  await db
    .update(milestones)
    .set({
      progressPercentage,
      status: progressPercentage === 100 ? 'completed' : 'in_progress',
      updatedAt: new Date(),
    })
    .where(eq(milestones.id, milestoneId));
}