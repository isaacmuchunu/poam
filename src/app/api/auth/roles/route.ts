import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { clerkClient } from '@clerk/nextjs';

// GET /api/auth/roles - Get user roles and permissions
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = auth();
    
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
    
    // Define permissions based on role
    let permissions = [];
    
    switch (role) {
      case 'admin':
        permissions = [
          'read:poam',
          'write:poam',
          'delete:poam',
          'read:users',
          'write:users',
          'read:settings',
          'write:settings',
          'read:reports',
          'write:reports'
        ];
        break;
      case 'member':
        permissions = [
          'read:poam',
          'write:poam',
          'read:users',
          'read:settings',
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
