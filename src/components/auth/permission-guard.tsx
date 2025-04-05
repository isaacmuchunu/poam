import React from 'react';
import { useAuthContext, hasPermission } from '@/contexts/auth-context';

interface WithPermissionProps {
  permission: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function WithPermission({ permission, fallback = null, children }: WithPermissionProps) {
  const { permissions, isLoaded } = useAuthContext();
  
  if (!isLoaded) {
    return null;
  }
  
  if (hasPermission(permissions, permission)) {
    return <>{children}</>;
  }
  
  return <>{fallback}</>;
}

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { userId, isLoaded } = useAuthContext();
  
  if (!isLoaded) {
    return <div>Loading authentication...</div>;
  }
  
  if (!userId) {
    return <div>You must be logged in to view this page.</div>;
  }
  
  return <>{children}</>;
}
