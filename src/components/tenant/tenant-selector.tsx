import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TenantSelectorProps {
  className?: string;
}

export function TenantSelector({ className }: TenantSelectorProps) {
  const { organization, setActive } = useOrganization();
  const { userMemberships, isLoaded } = useOrganizationList();
  
  if (!isLoaded) {
    return <div>Loading organizations...</div>;
  }
  
  const handleChange = (orgId: string) => {
    setActive({ organization: orgId });
  };
  
  return (
    <div className={className}>
      <Select value={organization?.id || ''} onValueChange={handleChange}>
        <SelectTrigger className="w-60">
          <SelectValue placeholder="Select organization" />
        </SelectTrigger>
        <SelectContent>
          {userMemberships.map(({ organization }) => (
            <SelectItem key={organization.id} value={organization.id}>
              {organization.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

interface CreateTenantButtonProps {
  className?: string;
}

export function CreateTenantButton({ className }: CreateTenantButtonProps) {
  const { createOrganization } = useOrganizationList();
  
  const handleCreateTenant = async () => {
    try {
      // Open Clerk's create organization modal
      await createOrganization({
        name: 'New Organization',
      });
    } catch (error) {
      console.error('Error creating organization:', error);
    }
  };
  
  return (
    <Button onClick={handleCreateTenant} className={className}>
      Create New Tenant
    </Button>
  );
}

interface TenantInfoProps {
  className?: string;
}

export function TenantInfo({ className }: TenantInfoProps) {
  const { organization, isLoaded } = useOrganization();
  
  if (!isLoaded || !organization) {
    return null;
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tenant Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">Name:</div>
            <div className="text-sm">{organization.name}</div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">ID:</div>
            <div className="text-sm">{organization.id}</div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">Created:</div>
            <div className="text-sm">{new Date(organization.createdAt).toLocaleDateString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            <div className="text-sm font-medium">Members:</div>
            <div className="text-sm">{organization.membersCount}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
