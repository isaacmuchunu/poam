import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { workflowDefinitions, workflowExecutions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { WorkflowDefinitionData } from '@/lib/workflow-engine';

const workflowConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'in', 'not_in']),
  value: z.any(),
});

const workflowActionSchema = z.object({
  type: z.enum([
    'send_notification',
    'send_email', 
    'create_task',
    'update_status',
    'assign_user',
    'escalate',
    'create_reminder',
    'webhook',
    'slack_notification',
    'teams_notification'
  ]),
  config: z.object({
    recipientIds: z.array(z.string()).optional(),
    recipientRoles: z.array(z.string()).optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    emailTemplate: z.string().optional(),
    emailSubject: z.string().optional(),
    emailBody: z.string().optional(),
    taskName: z.string().optional(),
    taskDescription: z.string().optional(),
    assigneeId: z.string().optional(),
    dueDate: z.string().optional(),
    newStatus: z.string().optional(),
    userId: z.string().optional(),
    escalateTo: z.string().optional(),
    escalationLevel: z.number().optional(),
    reminderDate: z.string().optional(),
    reminderType: z.string().optional(),
    webhookUrl: z.string().url().optional(),
    webhookMethod: z.enum(['GET', 'POST', 'PUT']).optional(),
    webhookHeaders: z.record(z.string()).optional(),
    webhookBody: z.any().optional(),
    channelId: z.string().optional(),
  }),
  delay: z.number().optional(),
  condition: workflowConditionSchema.optional(),
});

const workflowDefinitionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  triggerType: z.enum([
    'status_change',
    'date_based', 
    'manual',
    'approval_required',
    'overdue',
    'milestone_completion',
    'evidence_uploaded'
  ]),
  triggerConditions: z.array(workflowConditionSchema),
  actions: z.array(workflowActionSchema),
  isActive: z.boolean().default(true),
});

// GET /api/workflows - List workflow definitions
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const triggerType = url.searchParams.get('triggerType');
    const isActive = url.searchParams.get('isActive');

    let conditions = [eq(workflowDefinitions.organizationId, orgId)];
    
    if (triggerType) {
      conditions.push(eq(workflowDefinitions.triggerType, triggerType));
    }
    
    if (isActive !== null) {
      conditions.push(eq(workflowDefinitions.isActive, isActive === 'true'));
    }

    const workflows = await db
      .select()
      .from(workflowDefinitions)
      .where(and(...conditions))
      .orderBy(desc(workflowDefinitions.createdAt));

    // Get execution statistics for each workflow
    const workflowsWithStats = await Promise.all(
      workflows.map(async (workflow) => {
        const executions = await db
          .select()
          .from(workflowExecutions)
          .where(eq(workflowExecutions.workflowDefinitionId, workflow.id))
          .orderBy(desc(workflowExecutions.startedAt))
          .limit(10);

        const totalExecutions = executions.length;
        const successfulExecutions = executions.filter(e => e.status === 'completed').length;
        const failedExecutions = executions.filter(e => e.status === 'failed').length;
        const lastExecution = executions[0];

        return {
          ...workflow,
          stats: {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            successRate: totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0,
            lastExecution: lastExecution ? {
              id: lastExecution.id,
              status: lastExecution.status,
              startedAt: lastExecution.startedAt,
              completedAt: lastExecution.completedAt,
            } : null,
          },
          recentExecutions: executions.slice(0, 5),
        };
      })
    );

    return NextResponse.json({
      workflows: workflowsWithStats,
      count: workflows.length,
    });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

// POST /api/workflows - Create workflow definition
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = workflowDefinitionSchema.parse(body);

    const newWorkflow = await db.insert(workflowDefinitions).values({
      organizationId: orgId,
      createdById: userId,
      ...validatedData,
      triggerConditions: validatedData.triggerConditions,
      actions: validatedData.actions,
    }).returning();

    return NextResponse.json(newWorkflow[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Validation error', 
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Error creating workflow:', error);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}