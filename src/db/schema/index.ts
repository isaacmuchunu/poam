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
