import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';

// GET /api/auth/roles - Get user roles and permissions
export async function GET() {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's organization memberships
    const user = await clerkClient.users.getUser(userId);
    const orgMembership = user.organizationMemberships.find(
      (membership) => membership.organization.id === orgId
    );
    
    if (!orgMembership) {
      return NextResponse.json({ error: 'User not a member of this organization' }, { status: 403 });
    }
    
    // Get user's role in the organization
    const role = orgMembership.role;
    
    // Define permissions based on role with enhanced RBAC
    let permissions = [];
    
    switch (role) {
      case 'admin':
        permissions = [
          // POA&M permissions
          'read:poam', 'write:poam', 'delete:poam', 'approve:poam', 'export:poam',
          // Template permissions
          'read:templates', 'write:templates', 'delete:templates', 'publish:templates',
          // Milestone and task permissions
          'read:milestones', 'write:milestones', 'delete:milestones', 'assign:milestones',
          'read:tasks', 'write:tasks', 'delete:tasks', 'assign:tasks',
          // Evidence permissions
          'read:evidence', 'write:evidence', 'delete:evidence', 'approve:evidence', 'version:evidence',
          // User management
          'read:users', 'write:users', 'delete:users', 'assign:roles',
          // System settings
          'read:settings', 'write:settings', 'read:integrations', 'write:integrations',
          // Reports and analytics
          'read:reports', 'write:reports', 'export:reports', 'read:analytics',
          // Workflow management
          'read:workflows', 'write:workflows', 'execute:workflows',
          // Audit logs
          'read:audit_logs', 'export:audit_logs'
        ];
        break;
      case 'auditor':
        permissions = [
          // POA&M permissions
          'read:poam', 'write:poam', 'approve:poam', 'export:poam',
          // Template permissions
          'read:templates', 'write:templates',
          // Milestone and task permissions
          'read:milestones', 'write:milestones', 'assign:milestones',
          'read:tasks', 'write:tasks', 'assign:tasks',
          // Evidence permissions
          'read:evidence', 'write:evidence', 'approve:evidence', 'version:evidence',
          // Limited user management
          'read:users',
          // Reports and analytics
          'read:reports', 'write:reports', 'export:reports', 'read:analytics',
          // Workflow execution
          'read:workflows', 'execute:workflows',
          // Audit logs
          'read:audit_logs'
        ];
        break;
      case 'manager':
        permissions = [
          // POA&M permissions
          'read:poam', 'write:poam', 'approve:poam', 'export:poam',
          // Template permissions
          'read:templates', 'write:templates',
          // Milestone and task permissions
          'read:milestones', 'write:milestones', 'assign:milestones',
          'read:tasks', 'write:tasks', 'assign:tasks',
          // Evidence permissions
          'read:evidence', 'write:evidence', 'approve:evidence',
          // User management
          'read:users', 'assign:roles',
          // Reports and analytics
          'read:reports', 'write:reports', 'export:reports', 'read:analytics',
          // Workflow execution
          'read:workflows', 'execute:workflows'
        ];
        break;
      case 'contributor':
        permissions = [
          // POA&M permissions
          'read:poam', 'write:poam', 'export:poam',
          // Template permissions
          'read:templates',
          // Milestone and task permissions
          'read:milestones', 'write:milestones',
          'read:tasks', 'write:tasks',
          // Evidence permissions
          'read:evidence', 'write:evidence',
          // Limited user access
          'read:users',
          // Reports
          'read:reports', 'export:reports'
        ];
        break;
      case 'viewer':
        permissions = [
          // Read-only access
          'read:poam', 'export:poam',
          'read:templates',
          'read:milestones', 'read:tasks',
          'read:evidence',
          'read:users',
          'read:reports', 'export:reports'
        ];
        break;
      case 'member':
        permissions = [
          'read:poam', 'write:poam',
          'read:templates',
          'read:milestones', 'write:milestones',
          'read:tasks', 'write:tasks',
          'read:evidence', 'write:evidence',
          'read:users',
          'read:reports'
        ];
        break;
      case 'guest':
        permissions = [
          'read:poam',
          'read:reports'
        ];
        break;
      default:
        permissions = ['read:poam'];
    }
    
    return NextResponse.json({
      userId,
      organizationId: orgId,
      role,
      permissions
    });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json({ error: 'Failed to fetch user roles' }, { status: 500 });
  }
}
