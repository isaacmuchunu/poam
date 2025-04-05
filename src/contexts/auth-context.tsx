"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';

// Define the auth context type
type AuthContextType = {
  userId: string | null;
  role: string | null;
  permissions: string[];
  isLoaded: boolean;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  userId: null,
  role: null,
  permissions: [],
  isLoaded: false,
});

// Hook to use the auth context
export const useAuthContext = () => useContext(AuthContext);

// Provider component for the auth context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { userId, isLoaded: isAuthLoaded, orgId } = useAuth();
  const [authDetails, setAuthDetails] = useState<AuthContextType>({
    userId: null,
    role: null,
    permissions: [],
    isLoaded: false,
  });

  useEffect(() => {
    if (isAuthLoaded && userId && orgId) {
      // Fetch user roles and permissions from the API
      const fetchRoles = async () => {
        try {
          const res = await fetch('/api/auth/roles');
          
          if (!res.ok) {
            throw new Error('Failed to fetch user roles');
          }
          
          const data = await res.json();
          
          setAuthDetails({
            userId: data.userId,
            role: data.role,
            permissions: data.permissions,
            isLoaded: true,
          });
        } catch (error) {
          console.error('Error fetching user roles:', error);
          
          // Set default values if API call fails
          setAuthDetails({
            userId,
            role: 'member',
            permissions: ['read:poam'],
            isLoaded: true,
          });
        }
      };
      
      fetchRoles();
    } else if (isAuthLoaded) {
      // If auth is loaded but user is not authenticated
      setAuthDetails(prev => ({ ...prev, isLoaded: true }));
    }
  }, [isAuthLoaded, userId, orgId]);

  return (
    <AuthContext.Provider value={authDetails}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to check if user has a specific permission
export const hasPermission = (
  permissions: string[],
  requiredPermission: string
): boolean => {
  return permissions.includes(requiredPermission);
};
