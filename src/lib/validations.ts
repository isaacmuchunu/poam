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
