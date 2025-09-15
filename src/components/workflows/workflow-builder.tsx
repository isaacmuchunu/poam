"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { WithPermission } from '@/components/auth/permission-guard';
import { 
  Plus, 
  Play, 
  Pause, 
  Edit, 
  Trash2, 
  Copy,
  Workflow,
  Zap,
  Bell,
  Mail,
  CheckSquare,
  UserCheck,
  AlertTriangle,
  Clock,
  Webhook,
  MessageSquare,
  Activity,
  Settings,
  X,
  ArrowDown
} from 'lucide-react';

interface WorkflowCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
}

interface WorkflowAction {
  type: 'send_notification' | 'send_email' | 'create_task' | 'update_status' | 'assign_user' | 'escalate' | 'create_reminder' | 'webhook' | 'slack_notification' | 'teams_notification';
  config: Record<string, any>;
  delay?: number;
  condition?: WorkflowCondition;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  triggerType: 'status_change' | 'date_based' | 'manual' | 'approval_required' | 'overdue' | 'milestone_completion' | 'evidence_uploaded';
  triggerConditions: WorkflowCondition[];
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats?: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    lastExecution?: any;
  };
}

const triggerTypeLabels = {
  status_change: 'Status Change',
  date_based: 'Date Based',
  manual: 'Manual',
  approval_required: 'Approval Required',
  overdue: 'Overdue',
  milestone_completion: 'Milestone Completion',
  evidence_uploaded: 'Evidence Uploaded',
};

const actionTypeIcons = {
  send_notification: Bell,
  send_email: Mail,
  create_task: CheckSquare,
  update_status: Activity,
  assign_user: UserCheck,
  escalate: AlertTriangle,
  create_reminder: Clock,
  webhook: Webhook,
  slack_notification: MessageSquare,
  teams_notification: MessageSquare,
};

const actionTypeLabels = {
  send_notification: 'Send Notification',
  send_email: 'Send Email',
  create_task: 'Create Task',
  update_status: 'Update Status',
  assign_user: 'Assign User',
  escalate: 'Escalate',
  create_reminder: 'Create Reminder',
  webhook: 'Webhook',
  slack_notification: 'Slack Notification',
  teams_notification: 'Teams Notification',
};

export function WorkflowBuilder() {
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    triggerType: 'status_change' as WorkflowDefinition['triggerType'],
    triggerConditions: [] as WorkflowCondition[],
    actions: [] as WorkflowAction[],
    isActive: true,
  });

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkflow = async () => {
    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflow),
      });

      if (response.ok) {
        setNewWorkflow({
          name: '',
          description: '',
          triggerType: 'status_change',
          triggerConditions: [],
          actions: [],
          isActive: true,
        });
        setIsCreating(false);
        fetchWorkflows();
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
    }
  };

  const handleToggleWorkflow = async (workflowId: string, isActive: boolean) => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive }),
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Error toggling workflow:', error);
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    try {
      await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });
      fetchWorkflows();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
      });
      // Show success message
    } catch (error) {
      console.error('Error executing workflow:', error);
    }
  };

  const addTriggerCondition = () => {
    setNewWorkflow({
      ...newWorkflow,
      triggerConditions: [
        ...newWorkflow.triggerConditions,
        { field: '', operator: 'equals', value: '' },
      ],
    });
  };

  const updateTriggerCondition = (index: number, condition: Partial<WorkflowCondition>) => {
    const conditions = [...newWorkflow.triggerConditions];
    conditions[index] = { ...conditions[index], ...condition };
    setNewWorkflow({ ...newWorkflow, triggerConditions: conditions });
  };

  const removeTriggerCondition = (index: number) => {
    setNewWorkflow({
      ...newWorkflow,
      triggerConditions: newWorkflow.triggerConditions.filter((_, i) => i !== index),
    });
  };

  const addAction = (actionType: WorkflowAction['type']) => {
    const newAction: WorkflowAction = {
      type: actionType,
      config: {},
    };

    // Set default config based on action type
    switch (actionType) {
      case 'send_notification':
        newAction.config = {
          title: '',
          message: '',
          priority: 'medium',
          recipientIds: [],
        };
        break;
      case 'send_email':
        newAction.config = {
          emailSubject: '',
          emailBody: '',
          recipientIds: [],
        };
        break;
      case 'create_task':
        newAction.config = {
          taskName: '',
          taskDescription: '',
          assigneeId: '',
        };
        break;
      case 'update_status':
        newAction.config = {
          newStatus: '',
        };
        break;
      case 'assign_user':
        newAction.config = {
          userId: '',
        };
        break;
      case 'escalate':
        newAction.config = {
          escalateTo: '',
          escalationLevel: 1,
        };
        break;
      case 'create_reminder':
        newAction.config = {
          message: '',
          reminderDate: '',
        };
        break;
      case 'webhook':
        newAction.config = {
          webhookUrl: '',
          webhookMethod: 'POST',
        };
        break;
      case 'slack_notification':
      case 'teams_notification':
        newAction.config = {
          webhookUrl: '',
          message: '',
          channelId: '',
        };
        break;
    }

    setNewWorkflow({
      ...newWorkflow,
      actions: [...newWorkflow.actions, newAction],
    });
  };

  const updateAction = (index: number, action: Partial<WorkflowAction>) => {
    const actions = [...newWorkflow.actions];
    actions[index] = { ...actions[index], ...action };
    setNewWorkflow({ ...newWorkflow, actions });
  };

  const removeAction = (index: number) => {
    setNewWorkflow({
      ...newWorkflow,
      actions: newWorkflow.actions.filter((_, i) => i !== index),
    });
  };

  const renderActionConfig = (action: WorkflowAction, index: number) => {
    const ActionIcon = actionTypeIcons[action.type];
    
    return (
      <Card key={index} className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ActionIcon className="h-4 w-4" />
              <CardTitle className="text-sm">{actionTypeLabels[action.type]}</CardTitle>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeAction(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {action.type === 'send_notification' && (
            <>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={action.config.title || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, title: e.target.value }
                  })}
                  placeholder="Notification title"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={action.config.message || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, message: e.target.value }
                  })}
                  placeholder="Notification message (use {{field}} for variables)"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={action.config.priority || 'medium'}
                  onValueChange={(value) => updateAction(index, {
                    config: { ...action.config, priority: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {action.type === 'create_task' && (
            <>
              <div>
                <label className="text-sm font-medium">Task Name</label>
                <Input
                  value={action.config.taskName || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, taskName: e.target.value }
                  })}
                  placeholder="Task name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={action.config.taskDescription || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, taskDescription: e.target.value }
                  })}
                  placeholder="Task description"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Due Date (Optional)</label>
                <Input
                  type="datetime-local"
                  value={action.config.dueDate || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, dueDate: e.target.value }
                  })}
                />
              </div>
            </>
          )}

          {action.type === 'update_status' && (
            <div>
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={action.config.newStatus || ''}
                onValueChange={(value) => updateAction(index, {
                  config: { ...action.config, newStatus: value }
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action.type === 'webhook' && (
            <>
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  value={action.config.webhookUrl || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, webhookUrl: e.target.value }
                  })}
                  placeholder="https://example.com/webhook"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Method</label>
                <Select
                  value={action.config.webhookMethod || 'POST'}
                  onValueChange={(value) => updateAction(index, {
                    config: { ...action.config, webhookMethod: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {(action.type === 'slack_notification' || action.type === 'teams_notification') && (
            <>
              <div>
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  value={action.config.webhookUrl || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, webhookUrl: e.target.value }
                  })}
                  placeholder="Webhook URL from Slack/Teams"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={action.config.message || ''}
                  onChange={(e) => updateAction(index, {
                    config: { ...action.config, message: e.target.value }
                  })}
                  placeholder="Message to send"
                  rows={3}
                />
              </div>
              {action.type === 'slack_notification' && (
                <div>
                  <label className="text-sm font-medium">Channel (Optional)</label>
                  <Input
                    value={action.config.channelId || ''}
                    onChange={(e) => updateAction(index, {
                      config: { ...action.config, channelId: e.target.value }
                    })}
                    placeholder="#channel-name"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm font-medium">Delay (seconds, optional)</label>
            <Input
              type="number"
              value={action.delay || ''}
              onChange={(e) => updateAction(index, {
                delay: e.target.value ? parseInt(e.target.value) : undefined
              })}
              placeholder="0"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Workflow Automation</h2>
          <p className="text-muted-foreground">
            Create automated workflows for approval processes, notifications, and task management
          </p>
        </div>
        <div className="flex gap-2">
          <WithPermission permission="write:workflows">
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Workflow
            </Button>
          </WithPermission>
        </div>
      </div>

      {/* Workflows List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {workflows.map((workflow) => (
          <Card key={workflow.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      {triggerTypeLabels[workflow.triggerType]}
                    </Badge>
                    <Badge variant={workflow.isActive ? 'default' : 'secondary'}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <Switch
                  checked={workflow.isActive}
                  onCheckedChange={(checked) => handleToggleWorkflow(workflow.id, checked)}
                />
              </div>
              {workflow.description && (
                <CardDescription>{workflow.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Actions Summary */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Actions ({workflow.actions.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {workflow.actions.slice(0, 3).map((action, index) => {
                      const ActionIcon = actionTypeIcons[action.type];
                      return (
                        <Badge key={index} variant="outline" className="text-xs">
                          <ActionIcon className="h-3 w-3 mr-1" />
                          {actionTypeLabels[action.type]}
                        </Badge>
                      );
                    })}
                    {workflow.actions.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{workflow.actions.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Statistics */}
                {workflow.stats && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{workflow.stats.totalExecutions}</div>
                      <div className="text-gray-500">Total Runs</div>
                    </div>
                    <div>
                      <div className="font-medium">{workflow.stats.successRate}%</div>
                      <div className="text-gray-500">Success Rate</div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedWorkflow(workflow)}>
                    <Activity className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <WithPermission permission="execute:workflows">
                    <Button size="sm" variant="outline" onClick={() => handleExecuteWorkflow(workflow.id)}>
                      <Play className="h-3 w-3 mr-1" />
                      Run
                    </Button>
                  </WithPermission>
                  <WithPermission permission="write:workflows">
                    <Button size="sm" variant="outline">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDeleteWorkflow(workflow.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </WithPermission>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {workflows.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Workflow className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
            <p className="text-gray-500 mb-4">Create your first automated workflow to get started</p>
            <WithPermission permission="write:workflows">
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Workflow
              </Button>
            </WithPermission>
          </div>
        )}
      </div>

      {/* Create Workflow Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Build automated workflows to streamline your compliance processes
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="space-y-4">
            <TabsList>
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="trigger">Trigger</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newWorkflow.name}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                  placeholder="Enter workflow name"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={newWorkflow.description}
                  onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                  placeholder="Describe what this workflow does"
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={newWorkflow.isActive}
                  onCheckedChange={(checked) => setNewWorkflow({ ...newWorkflow, isActive: checked })}
                />
                <label className="text-sm font-medium">Active</label>
              </div>
            </TabsContent>

            <TabsContent value="trigger" className="space-y-4">
              <div>
                <label className="text-sm font-medium">Trigger Type</label>
                <Select
                  value={newWorkflow.triggerType}
                  onValueChange={(value: any) => setNewWorkflow({ ...newWorkflow, triggerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(triggerTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Trigger Conditions</label>
                  <Button size="sm" variant="outline" onClick={addTriggerCondition}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Condition
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {newWorkflow.triggerConditions.map((condition, index) => (
                    <div key={index} className="flex gap-2 items-center p-3 border rounded">
                      <Input
                        placeholder="Field name"
                        value={condition.field}
                        onChange={(e) => updateTriggerCondition(index, { field: e.target.value })}
                        className="flex-1"
                      />
                      <Select
                        value={condition.operator}
                        onValueChange={(value: any) => updateTriggerCondition(index, { operator: value })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="equals">Equals</SelectItem>
                          <SelectItem value="not_equals">Not Equals</SelectItem>
                          <SelectItem value="contains">Contains</SelectItem>
                          <SelectItem value="greater_than">Greater Than</SelectItem>
                          <SelectItem value="less_than">Less Than</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => updateTriggerCondition(index, { value: e.target.value })}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeTriggerCondition(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-medium">Workflow Actions</label>
                  <Select onValueChange={(value: any) => addAction(value)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Add action" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(actionTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            {React.createElement(actionTypeIcons[value as keyof typeof actionTypeIcons], { className: "h-4 w-4" })}
                            {label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  {newWorkflow.actions.map((action, index) => (
                    <div key={index}>
                      {renderActionConfig(action, index)}
                      {index < newWorkflow.actions.length - 1 && (
                        <div className="flex justify-center my-2">
                          <ArrowDown className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {newWorkflow.actions.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No actions added yet</p>
                      <p className="text-sm">Use the dropdown above to add workflow actions</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateWorkflow} 
              disabled={!newWorkflow.name || newWorkflow.actions.length === 0}
            >
              Create Workflow
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workflow Detail Dialog */}
      <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              {selectedWorkflow?.name}
            </DialogTitle>
            <DialogDescription>{selectedWorkflow?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedWorkflow && (
            <div className="space-y-6">
              <Tabs defaultValue="overview">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="executions">Executions</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Trigger Type</label>
                      <Badge variant="outline">
                        {triggerTypeLabels[selectedWorkflow.triggerType]}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Badge variant={selectedWorkflow.isActive ? 'default' : 'secondary'}>
                        {selectedWorkflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Actions ({selectedWorkflow.actions.length})</label>
                    <div className="space-y-2 mt-2">
                      {selectedWorkflow.actions.map((action, index) => {
                        const ActionIcon = actionTypeIcons[action.type];
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 border rounded">
                            <ActionIcon className="h-4 w-4" />
                            <span className="font-medium">{actionTypeLabels[action.type]}</span>
                            {action.delay && (
                              <Badge variant="outline" className="text-xs">
                                Delay: {action.delay}s
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {selectedWorkflow.stats && (
                    <div>
                      <label className="text-sm font-medium">Statistics</label>
                      <div className="grid grid-cols-4 gap-4 mt-2">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{selectedWorkflow.stats.totalExecutions}</div>
                          <div className="text-xs text-gray-500">Total Runs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{selectedWorkflow.stats.successfulExecutions}</div>
                          <div className="text-xs text-gray-500">Successful</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{selectedWorkflow.stats.failedExecutions}</div>
                          <div className="text-xs text-gray-500">Failed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{selectedWorkflow.stats.successRate}%</div>
                          <div className="text-xs text-gray-500">Success Rate</div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="executions">
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Executions</h4>
                    {/* Execution history would be displayed here */}
                    <p className="text-sm text-gray-500">Execution history will be displayed here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}