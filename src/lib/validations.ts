import { z } from 'zod';

// POA&M Item validation schema
export const poamItemSchema = z.object({
  securityControl: z.string().min(1),
  weakness: z.string().min(1),
  weaknessDescription: z.string().optional(),
  sourceOfWeakness: z.string().optional(),
  severityLevel: z.enum(['Critical', 'High', 'Moderate', 'Low']),
  resourceEstimate: z.record(z.string(), z.any()).optional(),
  identificationMethod: z.string().optional(),
  pointOfContactId: z.string().uuid(),
  plannedStartDate: z.string().datetime().optional(),
  plannedCompletionDate: z.string().datetime(),
  milestones: z.array(
    z.object({
      description: z.string(),
      dueDate: z.string().datetime(),
      completed: z.boolean().default(false)
    })
  ).optional(),
  assignedToId: z.string().uuid().optional(),
  systemAssetId: z.string().uuid().optional(),
  complianceFrameworkId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
});

// Organization validation schema
export const organizationSchema = z.object({
  name: z.string().min(1),
  subscriptionTier: z.enum(['free', 'professional', 'enterprise']).default('free'),
});

// User validation schema
export const userSchema = z.object({
  clerkId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['admin', 'user', 'viewer']).default('user'),
});

// Tenant settings validation schema
export const tenantSettingsSchema = z.object({
  theme: z.object({
    primaryColor: z.string(),
    logoUrl: z.string().nullable(),
    favicon: z.string().nullable(),
  }).optional(),
  customFields: z.array(
    z.object({
      name: z.string(),
      type: z.enum(['text', 'number', 'date', 'select', 'boolean']),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
    })
  ).optional(),
  notificationSettings: z.object({
    emailEnabled: z.boolean().default(true),
    slackEnabled: z.boolean().default(false),
    slackWebhookUrl: z.string().nullable(),
  }).optional(),
  securitySettings: z.object({
    mfaRequired: z.boolean().default(false),
    sessionTimeout: z.number().default(3600),
  }).optional(),
});

// System validation schema
export const systemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemType: z.string().optional(),
  owner: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
});

// Framework validation schema
export const frameworkSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  version: z.string().optional(),
});

// Evidence file validation schema
export const evidenceFileSchema = z.object({
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.number().optional(),
  description: z.string().optional(),
  poamItemId: z.string().uuid(),
  storageUrl: z.string().url(),
});

// Report template validation schema
export const reportTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  config: z.object({
    includeCharts: z.boolean().default(true),
    includeSummary: z.boolean().default(true),
    includeDetails: z.boolean().default(true),
    filterBySeverity: z.array(z.string()).default([]),
    filterByStatus: z.array(z.string()).default([]),
    dateRange: z.enum(['last_30_days', 'last_90_days', 'last_year', 'all_time']).default('last_30_days'),
  }),
  isDefault: z.boolean().default(false),
});

// Organization member validation schema
export const organizationMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['admin', 'manager', 'member', 'viewer']).default('member'),
});

// Audit log validation schema
export const auditLogSchema = z.object({
  action: z.string().min(1),
  entityType: z.string().min(1),
  entityId: z.string().uuid().optional(),
  details: z.record(z.string(), z.any()).optional(),
});
