"use client";

import { createContext, useContext, useEffect, useState } from 'react';
import { useOrganization } from '@clerk/nextjs';

// Define the tenant context type
type TenantContextType = {
  tenantId: string | null;
  tenantName: string | null;
  subscription: {
    tier: 'free' | 'professional' | 'enterprise';
    status: string;
  } | null;
  theme: {
    primaryColor: string;
    logoUrl: string | null;
    favicon: string | null;
  } | null;
  isLoaded: boolean;
};

// Create the context with default values
const TenantContext = createContext<TenantContextType>({
  tenantId: null,
  tenantName: null,
  subscription: null,
  theme: null,
  isLoaded: false,
});

// Hook to use the tenant context
export const useTenant = () => useContext(TenantContext);

// Provider component for the tenant context
export const TenantProvider = ({ children }: { children: React.ReactNode }) => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [tenantDetails, setTenantDetails] = useState<TenantContextType>({
    tenantId: null,
    tenantName: null,
    subscription: null,
    theme: null,
    isLoaded: false,
  });

  useEffect(() => {
    if (isOrgLoaded && organization) {
      // Fetch tenant details from the API
      const fetchTenantDetails = async () => {
        try {
          const res = await fetch('/api/tenant/details');
          
          if (!res.ok) {
            throw new Error('Failed to fetch tenant details');
          }
          
          const details = await res.json();
          
          setTenantDetails({
            tenantId: organization.id,
            tenantName: organization.name,
            subscription: {
              tier: details.subscriptionTier || 'free',
              status: details.subscriptionStatus || 'active',
            },
            theme: {
              primaryColor: details.theme?.primaryColor || '#0f172a',
              logoUrl: details.theme?.logoUrl || null,
              favicon: details.theme?.favicon || null,
            },
            isLoaded: true,
          });
        } catch (error) {
          console.error('Error fetching tenant details:', error);
          
          // Set default values if API call fails
          setTenantDetails({
            tenantId: organization.id,
            tenantName: organization.name,
            subscription: {
              tier: 'free',
              status: 'active',
            },
            theme: {
              primaryColor: '#0f172a',
              logoUrl: null,
              favicon: null,
            },
            isLoaded: true,
          });
        }
      };
      
      fetchTenantDetails();
    } else if (isOrgLoaded) {
      // If organization is loaded but null, update isLoaded state
      setTenantDetails(prev => ({ ...prev, isLoaded: true }));
    }
  }, [isOrgLoaded, organization]);

  return (
    <TenantContext.Provider value={tenantDetails}>
      {children}
    </TenantContext.Provider>
  );
};
