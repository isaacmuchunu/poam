import { db } from '@/db/client';
import { workflowDefinitions, workflowExecutions, notifications, poamItems, milestones, tasks } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

// Workflow trigger types
export type WorkflowTrigger = 
  | 'status_change'
  | 'date_based'
  | 'manual'
  | 'approval_required'
  | 'overdue'
  | 'milestone_completion'
  | 'evidence_uploaded';

// Workflow action types
export type WorkflowAction = 
  | 'send_notification'
  | 'send_email'
  | 'create_task'
  | 'update_status'
  | 'assign_user'
  | 'escalate'
  | 'create_reminder'
  | 'webhook'
  | 'slack_notification'
  | 'teams_notification';

export interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

export interface WorkflowActionConfig {
  type: WorkflowAction;
  config: {
    // Notification actions
    recipientIds?: string[];
    recipientRoles?: string[];
    title?: string;
    message?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    
    // Email actions
    emailTemplate?: string;
    emailSubject?: string;
    emailBody?: string;
    
    // Task actions
    taskName?: string;
    taskDescription?: string;
    assigneeId?: string;
    dueDate?: string;
    
    // Status actions
    newStatus?: string;
    
    // Assignment actions
    userId?: string;
    
    // Escalation actions
    escalateTo?: string;
    escalationLevel?: number;
    
    // Reminder actions
    reminderDate?: string;
    reminderType?: string;
    
    // Webhook actions
    webhookUrl?: string;
    webhookMethod?: 'GET' | 'POST' | 'PUT';
    webhookHeaders?: Record<string, string>;
    webhookBody?: any;
    
    // Slack/Teams actions
    channelId?: string;
    webhookUrl?: string;
  };
  delay?: number; // Delay in seconds before executing
  condition?: WorkflowCondition; // Additional condition for this action
}

export interface WorkflowDefinitionData {
  name: string;
  description?: string;
  triggerType: WorkflowTrigger;
  triggerConditions: WorkflowCondition[];
  actions: WorkflowActionConfig[];
  isActive: boolean;
}

export class WorkflowEngine {
  // Execute a workflow based on trigger
  static async executeWorkflow(
    organizationId: string,
    triggerType: WorkflowTrigger,
    entityType: string,
    entityId: string,
    triggerData: any
  ): Promise<void> {
    try {
      // Find matching workflow definitions
      const workflows = await db
        .select()
        .from(workflowDefinitions)
        .where(
          and(
            eq(workflowDefinitions.organizationId, organizationId),
            eq(workflowDefinitions.triggerType, triggerType),
            eq(workflowDefinitions.isActive, true)
          )
        );

      for (const workflow of workflows) {
        // Check if trigger conditions are met
        if (await this.evaluateConditions(workflow.triggerConditions as WorkflowCondition[], triggerData)) {
          await this.executeWorkflowActions(
            workflow.id,
            organizationId,
            entityType,
            entityId,
            workflow.actions as WorkflowActionConfig[],
            triggerData
          );
        }
      }
    } catch (error) {
      console.error('Workflow execution error:', error);
    }
  }

  // Execute workflow actions
  private static async executeWorkflowActions(
    workflowId: string,
    organizationId: string,
    entityType: string,
    entityId: string,
    actions: WorkflowActionConfig[],
    triggerData: any
  ): Promise<void> {
    // Create workflow execution record
    const execution = await db.insert(workflowExecutions).values({
      workflowDefinitionId: workflowId,
      organizationId,
      entityType,
      entityId,
      status: 'running',
      executionLog: { startTime: new Date().toISOString(), actions: [] },
    }).returning();

    const executionId = execution[0].id;
    const executionLog: any = { startTime: new Date().toISOString(), actions: [] };

    try {
      for (const action of actions) {
        // Apply delay if specified
        if (action.delay && action.delay > 0) {
          await new Promise(resolve => setTimeout(resolve, action.delay * 1000));
        }

        // Check action-specific conditions
        if (action.condition && !await this.evaluateConditions([action.condition], triggerData)) {
          continue;
        }

        // Execute the action
        const actionResult = await this.executeAction(
          organizationId,
          entityType,
          entityId,
          action,
          triggerData
        );

        executionLog.actions.push({
          type: action.type,
          timestamp: new Date().toISOString(),
          result: actionResult,
        });
      }

      // Mark execution as completed
      await db.update(workflowExecutions)
        .set({
          status: 'completed',
          completedAt: new Date(),
          executionLog,
        })
        .where(eq(workflowExecutions.id, executionId));

    } catch (error) {
      // Mark execution as failed
      await db.update(workflowExecutions)
        .set({
          status: 'failed',
          completedAt: new Date(),
          executionLog: {
            ...executionLog,
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        })
        .where(eq(workflowExecutions.id, executionId));

      throw error;
    }
  }

  // Execute individual action
  private static async executeAction(
    organizationId: string,
    entityType: string,
    entityId: string,
    action: WorkflowActionConfig,
    triggerData: any
  ): Promise<any> {
    switch (action.type) {
      case 'send_notification':
        return await this.sendNotification(organizationId, action.config, triggerData);
      
      case 'send_email':
        return await this.sendEmail(organizationId, action.config, triggerData);
      
      case 'create_task':
        return await this.createTask(organizationId, entityId, action.config, triggerData);
      
      case 'update_status':
        return await this.updateEntityStatus(entityType, entityId, action.config, triggerData);
      
      case 'assign_user':
        return await this.assignUser(entityType, entityId, action.config, triggerData);
      
      case 'escalate':
        return await this.escalateItem(organizationId, entityType, entityId, action.config, triggerData);
      
      case 'create_reminder':
        return await this.createReminder(organizationId, entityType, entityId, action.config, triggerData);
      
      case 'webhook':
        return await this.callWebhook(action.config, triggerData);
      
      case 'slack_notification':
      case 'teams_notification':
        return await this.sendChatNotification(action.type, action.config, triggerData);
      
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Action implementations
  private static async sendNotification(
    organizationId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    const recipientIds = config.recipientIds || [];
    
    // Add recipients by role
    if (config.recipientRoles && config.recipientRoles.length > 0) {
      // In production, fetch users by role
      // recipientIds.push(...usersByRole);
    }

    const notificationPromises = recipientIds.map(recipientId =>
      db.insert(notifications).values({
        organizationId,
        recipientId,
        type: 'workflow_action',
        title: config.title || 'Workflow Notification',
        message: this.interpolateMessage(config.message || 'A workflow action was triggered', triggerData),
        priority: config.priority || 'medium',
        entityType: triggerData.entityType,
        entityId: triggerData.entityId,
      })
    );

    await Promise.all(notificationPromises);
    return { recipientCount: recipientIds.length };
  }

  private static async sendEmail(
    organizationId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    // In production, integrate with email service (SendGrid, SES, etc.)
    console.log('Email would be sent:', {
      to: config.recipientIds,
      subject: this.interpolateMessage(config.emailSubject || 'Workflow Alert', triggerData),
      body: this.interpolateMessage(config.emailBody || 'A workflow was triggered', triggerData),
    });
    
    return { status: 'sent', recipientCount: config.recipientIds?.length || 0 };
  }

  private static async createTask(
    organizationId: string,
    parentEntityId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    // Determine milestone ID based on parent entity
    let milestoneId = parentEntityId;
    
    if (triggerData.entityType === 'poam_item') {
      // Find or create a default milestone for this POA&M item
      const defaultMilestone = await db.select()
        .from(milestones)
        .where(
          and(
            eq(milestones.poamItemId, parentEntityId),
            eq(milestones.name, 'Workflow Tasks')
          )
        )
        .limit(1);

      if (defaultMilestone.length === 0) {
        const newMilestone = await db.insert(milestones).values({
          organizationId,
          poamItemId: parentEntityId,
          name: 'Workflow Tasks',
          description: 'Tasks created by automated workflows',
          status: 'in_progress',
          priority: 'medium',
        }).returning();
        
        milestoneId = newMilestone[0].id;
      } else {
        milestoneId = defaultMilestone[0].id;
      }
    }

    const newTask = await db.insert(tasks).values({
      organizationId,
      milestoneId,
      name: this.interpolateMessage(config.taskName || 'Workflow Task', triggerData),
      description: this.interpolateMessage(config.taskDescription || 'Task created by workflow', triggerData),
      assigneeId: config.assigneeId,
      plannedEndDate: config.dueDate ? new Date(config.dueDate) : null,
      priority: 'medium',
    }).returning();

    return { taskId: newTask[0].id };
  }

  private static async updateEntityStatus(
    entityType: string,
    entityId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    if (!config.newStatus) {
      throw new Error('New status is required for update_status action');
    }

    switch (entityType) {
      case 'poam_item':
        await db.update(poamItems)
          .set({ status: config.newStatus, updatedAt: new Date() })
          .where(eq(poamItems.id, entityId));
        break;
      
      case 'milestone':
        await db.update(milestones)
          .set({ status: config.newStatus, updatedAt: new Date() })
          .where(eq(milestones.id, entityId));
        break;
      
      case 'task':
        await db.update(tasks)
          .set({ status: config.newStatus, updatedAt: new Date() })
          .where(eq(tasks.id, entityId));
        break;
      
      default:
        throw new Error(`Unsupported entity type for status update: ${entityType}`);
    }

    return { entityType, entityId, newStatus: config.newStatus };
  }

  private static async assignUser(
    entityType: string,
    entityId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    if (!config.userId) {
      throw new Error('User ID is required for assign_user action');
    }

    switch (entityType) {
      case 'poam_item':
        await db.update(poamItems)
          .set({ assignedToId: config.userId, updatedAt: new Date() })
          .where(eq(poamItems.id, entityId));
        break;
      
      case 'milestone':
        await db.update(milestones)
          .set({ assigneeId: config.userId, updatedAt: new Date() })
          .where(eq(milestones.id, entityId));
        break;
      
      case 'task':
        await db.update(tasks)
          .set({ assigneeId: config.userId, updatedAt: new Date() })
          .where(eq(tasks.id, entityId));
        break;
      
      default:
        throw new Error(`Unsupported entity type for assignment: ${entityType}`);
    }

    return { entityType, entityId, assigneeId: config.userId };
  }

  private static async escalateItem(
    organizationId: string,
    entityType: string,
    entityId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    // Create escalation notification
    if (config.escalateTo) {
      await db.insert(notifications).values({
        organizationId,
        recipientId: config.escalateTo,
        type: 'escalation',
        title: `Escalation: ${triggerData.entityName || 'Item'} requires attention`,
        message: this.interpolateMessage(
          `Item has been escalated to level ${config.escalationLevel || 1}`,
          triggerData
        ),
        priority: 'urgent',
        entityType,
        entityId,
      });
    }

    return { escalatedTo: config.escalateTo, level: config.escalationLevel };
  }

  private static async createReminder(
    organizationId: string,
    entityType: string,
    entityId: string,
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    const reminderDate = config.reminderDate ? new Date(config.reminderDate) : new Date(Date.now() + 24 * 60 * 60 * 1000); // Default: 1 day

    await db.insert(notifications).values({
      organizationId,
      recipientId: triggerData.assigneeId || triggerData.userId,
      type: 'reminder',
      title: `Reminder: ${triggerData.entityName || 'Item'} needs attention`,
      message: this.interpolateMessage(config.message || 'This is a reminder about an important item', triggerData),
      priority: config.priority || 'medium',
      entityType,
      entityId,
      scheduledFor: reminderDate,
    });

    return { reminderDate: reminderDate.toISOString() };
  }

  private static async callWebhook(
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL is required');
    }

    const response = await fetch(config.webhookUrl, {
      method: config.webhookMethod || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config.webhookHeaders,
      },
      body: JSON.stringify({
        ...config.webhookBody,
        triggerData,
        timestamp: new Date().toISOString(),
      }),
    });

    return {
      status: response.status,
      statusText: response.statusText,
      success: response.ok,
    };
  }

  private static async sendChatNotification(
    type: 'slack_notification' | 'teams_notification',
    config: WorkflowActionConfig['config'],
    triggerData: any
  ): Promise<any> {
    if (!config.webhookUrl) {
      throw new Error(`${type} webhook URL is required`);
    }

    const message = this.interpolateMessage(config.message || 'Workflow notification', triggerData);
    
    let payload;
    if (type === 'slack_notification') {
      payload = {
        channel: config.channelId,
        text: message,
        attachments: [{
          color: 'warning',
          fields: [{
            title: 'Entity',
            value: `${triggerData.entityType}: ${triggerData.entityName || triggerData.entityId}`,
            short: true,
          }],
        }],
      };
    } else {
      // Teams notification
      payload = {
        "@type": "MessageCard",
        "@context": "https://schema.org/extensions",
        summary: config.title || 'Workflow Notification',
        themeColor: "0078D4",
        sections: [{
          activityTitle: config.title || 'Workflow Notification',
          activitySubtitle: message,
          facts: [{
            name: 'Entity',
            value: `${triggerData.entityType}: ${triggerData.entityName || triggerData.entityId}`,
          }],
        }],
      };
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return {
      status: response.status,
      success: response.ok,
    };
  }

  // Evaluate workflow conditions
  private static async evaluateConditions(
    conditions: WorkflowCondition[],
    data: any
  ): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      
      let conditionMet = false;
      
      switch (condition.operator) {
        case 'equals':
          conditionMet = fieldValue === condition.value;
          break;
        case 'not_equals':
          conditionMet = fieldValue !== condition.value;
          break;
        case 'greater_than':
          conditionMet = fieldValue > condition.value;
          break;
        case 'less_than':
          conditionMet = fieldValue < condition.value;
          break;
        case 'contains':
          conditionMet = String(fieldValue).includes(String(condition.value));
          break;
        case 'in':
          conditionMet = Array.isArray(condition.value) && condition.value.includes(fieldValue);
          break;
        case 'not_in':
          conditionMet = Array.isArray(condition.value) && !condition.value.includes(fieldValue);
          break;
        default:
          conditionMet = false;
      }
      
      if (!conditionMet) {
        return false;
      }
    }
    
    return true;
  }

  // Utility functions
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private static interpolateMessage(message: string, data: any): string {
    return message.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path);
      return value !== undefined ? String(value) : match;
    });
  }

  // Trigger workflows for common events
  static async triggerStatusChange(
    organizationId: string,
    entityType: string,
    entityId: string,
    oldStatus: string,
    newStatus: string,
    additionalData: any = {}
  ): Promise<void> {
    await this.executeWorkflow(
      organizationId,
      'status_change',
      entityType,
      entityId,
      {
        entityType,
        entityId,
        oldStatus,
        newStatus,
        ...additionalData,
      }
    );
  }

  static async triggerOverdueItem(
    organizationId: string,
    entityType: string,
    entityId: string,
    dueDate: string,
    additionalData: any = {}
  ): Promise<void> {
    await this.executeWorkflow(
      organizationId,
      'overdue',
      entityType,
      entityId,
      {
        entityType,
        entityId,
        dueDate,
        daysOverdue: Math.floor((Date.now() - new Date(dueDate).getTime()) / (24 * 60 * 60 * 1000)),
        ...additionalData,
      }
    );
  }

  static async triggerMilestoneCompletion(
    organizationId: string,
    milestoneId: string,
    additionalData: any = {}
  ): Promise<void> {
    await this.executeWorkflow(
      organizationId,
      'milestone_completion',
      'milestone',
      milestoneId,
      {
        entityType: 'milestone',
        entityId: milestoneId,
        ...additionalData,
      }
    );
  }

  static async triggerEvidenceUploaded(
    organizationId: string,
    evidenceId: string,
    additionalData: any = {}
  ): Promise<void> {
    await this.executeWorkflow(
      organizationId,
      'evidence_uploaded',
      'evidence',
      evidenceId,
      {
        entityType: 'evidence',
        entityId: evidenceId,
        ...additionalData,
      }
    );
  }
}