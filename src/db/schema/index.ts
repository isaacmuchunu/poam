import { pgTable, uuid, timestamp, text, integer, jsonb, boolean } from 'drizzle-orm/pg-core';

// Organizations/Tenants table
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  subscriptionTier: text('subscription_tier').default('free').notNull(),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status').default('active'),
  status: text('status').default('active').notNull(),
});

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  role: text('role').default('user').notNull(),
});

// Organization memberships
export const organizationMemberships = pgTable('organization_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: text('role').default('member').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Systems/Assets table
export const systems = pgTable('systems', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  systemType: text('system_type'),
  owner: text('owner'),
  status: text('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Compliance frameworks
export const frameworks = pgTable('frameworks', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  version: text('version'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// POA&M items table
export const poamItems = pgTable('poam_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  creationDate: timestamp('creation_date').defaultNow().notNull(),
  securityControl: text('security_control').notNull(),
  weakness: text('weakness').notNull(),
  weaknessDescription: text('weakness_description'),
  sourceOfWeakness: text('source_of_weakness'),
  severityLevel: text('severity_level').notNull(),
  resourceEstimate: jsonb('resource_estimate'),
  identificationMethod: text('identification_method'),
  pointOfContactId: uuid('point_of_contact_id').references(() => users.id),
  plannedStartDate: timestamp('planned_start_date'),
  plannedCompletionDate: timestamp('planned_completion_date'),
  milestones: jsonb('milestones'),
  actualStartDate: timestamp('actual_start_date'),
  milestonesChanges: jsonb('milestones_changes'),
  status: text('status').notNull().default('in_progress'),
  actualCompletionDate: timestamp('actual_completion_date'),
  comments: text('comments'),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  approvalStatus: text('approval_status').default('pending'),
  riskScore: integer('risk_score'),
  dependencies: jsonb('dependencies'),
  evidenceRepository: jsonb('evidence_repository'),
  costEstimate: integer('cost_estimate'),
  systemAssetId: uuid('system_asset_id').references(() => systems.id),
  complianceFrameworkId: uuid('compliance_framework_id').references(() => frameworks.id),
  residualRisk: integer('residual_risk'),
  reviewDate: timestamp('review_date'),
  reviewCycle: text('review_cycle'),
  tags: jsonb('tags'),
});

// Tenant settings
export const tenantSettings = pgTable('tenant_settings', {
  organizationId: uuid('organization_id').references(() => organizations.id).primaryKey(),
  theme: jsonb('theme').default({
    primaryColor: '#0f172a',
    logoUrl: null,
    favicon: null
  }),
  customFields: jsonb('custom_fields').default([]),
  notificationSettings: jsonb('notification_settings').default({
    emailEnabled: true,
    slackEnabled: false,
    slackWebhookUrl: null
  }),
  securitySettings: jsonb('security_settings').default({
    mfaRequired: false,
    sessionTimeout: 3600
  }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Evidence files
export const evidenceFiles = pgTable('evidence_files', {
  id: uuid('id').defaultRandom().primaryKey(),
  poamItemId: uuid('poam_item_id').references(() => poamItems.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type'),
  fileSize: integer('file_size'),
  storageUrl: text('storage_url').notNull(),
  uploadedById: uuid('uploaded_by_id').references(() => users.id).notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  description: text('description'),
});

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  details: jsonb('details'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Report templates
export const reportTemplates = pgTable('report_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  config: jsonb('config').notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isDefault: boolean('is_default').default(false),
});

// Audit templates for compliance frameworks
export const auditTemplates = pgTable('audit_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  frameworkType: text('framework_type').notNull(), // ISO27001, NIST, SOC2, PCI_DSS, GDPR
  version: text('version').notNull(),
  controls: jsonb('controls').notNull(), // Array of control objects
  industryVertical: text('industry_vertical'), // healthcare, finance, technology, etc.
  isGlobal: boolean('is_global').default(false), // Global templates available to all orgs
  isCustom: boolean('is_custom').default(false), // Custom templates created by users
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
});

// Action plan templates
export const actionPlanTemplates = pgTable('action_plan_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  description: text('description'),
  industryVertical: text('industry_vertical').notNull(),
  frameworkType: text('framework_type'), // Optional link to framework
  tasks: jsonb('tasks').notNull(), // Array of task templates
  estimatedDuration: integer('estimated_duration'), // Days
  complexity: text('complexity'), // low, medium, high
  isGlobal: boolean('is_global').default(false),
  isCustom: boolean('is_custom').default(false),
  createdById: uuid('created_by_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true),
});

// Milestones and tasks with hierarchical structure
export const milestones = pgTable('milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  poamItemId: uuid('poam_item_id').references(() => poamItems.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  parentMilestoneId: uuid('parent_milestone_id').references(() => milestones.id),
  plannedStartDate: timestamp('planned_start_date'),
  plannedEndDate: timestamp('planned_end_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualEndDate: timestamp('actual_end_date'),
  status: text('status').default('pending').notNull(), // pending, in_progress, completed, cancelled
  priority: text('priority').default('medium').notNull(), // low, medium, high, critical
  assigneeId: uuid('assignee_id').references(() => users.id),
  dependencies: jsonb('dependencies'), // Array of milestone IDs this depends on
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  progressPercentage: integer('progress_percentage').default(0),
  riskLevel: text('risk_level').default('low'), // low, medium, high
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Tasks under milestones
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  milestoneId: uuid('milestone_id').references(() => milestones.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').default('pending').notNull(),
  priority: text('priority').default('medium').notNull(),
  assigneeId: uuid('assignee_id').references(() => users.id),
  plannedStartDate: timestamp('planned_start_date'),
  plannedEndDate: timestamp('planned_end_date'),
  actualStartDate: timestamp('actual_start_date'),
  actualEndDate: timestamp('actual_end_date'),
  estimatedHours: integer('estimated_hours'),
  actualHours: integer('actual_hours'),
  dependencies: jsonb('dependencies'),
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Evidence repository with version control
export const evidenceRepository = pgTable('evidence_repository', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  poamItemId: uuid('poam_item_id').references(() => poamItems.id),
  milestoneId: uuid('milestone_id').references(() => milestones.id),
  taskId: uuid('task_id').references(() => tasks.id),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'), // policy, procedure, evidence, screenshot, etc.
  fileType: text('file_type'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),
  storageUrl: text('storage_url'),
  version: text('version').default('1.0'),
  parentVersionId: uuid('parent_version_id').references(() => evidenceRepository.id),
  checksum: text('checksum'), // For integrity verification
  uploadedById: uuid('uploaded_by_id').references(() => users.id).notNull(),
  reviewedById: uuid('reviewed_by_id').references(() => users.id),
  reviewStatus: text('review_status').default('pending'), // pending, approved, rejected
  reviewComments: text('review_comments'),
  tags: jsonb('tags'),
  metadata: jsonb('metadata'), // Custom metadata
  retentionDate: timestamp('retention_date'),
  isArchived: boolean('is_archived').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow definitions for automation
export const workflowDefinitions = pgTable('workflow_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  triggerType: text('trigger_type').notNull(), // status_change, date_based, manual
  triggerConditions: jsonb('trigger_conditions').notNull(),
  actions: jsonb('actions').notNull(), // Array of action objects
  isActive: boolean('is_active').default(true),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Workflow executions log
export const workflowExecutions = pgTable('workflow_executions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowDefinitionId: uuid('workflow_definition_id').references(() => workflowDefinitions.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  entityType: text('entity_type').notNull(), // poam_item, milestone, task
  entityId: uuid('entity_id').notNull(),
  status: text('status').notNull(), // pending, running, completed, failed
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  executionLog: jsonb('execution_log'),
  errorMessage: text('error_message'),
});

// Notifications and alerts
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  recipientId: uuid('recipient_id').references(() => users.id).notNull(),
  type: text('type').notNull(), // deadline_reminder, status_change, approval_request, etc.
  title: text('title').notNull(),
  message: text('message').notNull(),
  entityType: text('entity_type'), // poam_item, milestone, task
  entityId: uuid('entity_id'),
  priority: text('priority').default('medium'), // low, medium, high, urgent
  isRead: boolean('is_read').default(false),
  readAt: timestamp('read_at'),
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Integration configurations
export const integrationConfigs = pgTable('integration_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  integrationType: text('integration_type').notNull(), // jira, slack, teams, sharepoint, etc.
  name: text('name').notNull(),
  config: jsonb('config').notNull(), // Integration-specific configuration
  credentials: jsonb('credentials'), // Encrypted credentials
  isActive: boolean('is_active').default(true),
  lastSyncAt: timestamp('last_sync_at'),
  syncStatus: text('sync_status').default('idle'), // idle, syncing, error
  errorMessage: text('error_message'),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
