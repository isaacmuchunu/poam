import React from 'react';
import { TenantSettings } from '@/components/tenant/tenant-settings';
import { TenantInfo } from '@/components/tenant/tenant-selector';

interface SettingsPageProps {
  settings: {
    theme: {
      primaryColor: string;
      logoUrl: string | null;
      favicon: string | null;
    };
    notificationSettings: {
      emailEnabled: boolean;
      slackEnabled: boolean;
      slackWebhookUrl: string | null;
    };
    securitySettings: {
      mfaRequired: boolean;
      sessionTimeout: number;
    };
  };
}

export default function SettingsPage({ settings }: SettingsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Tenant Settings</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TenantSettings 
            initialData={settings}
            onSubmit={(data) => console.log('Submit settings', data)}
          />
        </div>
        
        <div>
          <TenantInfo className="w-full" />
        </div>
      </div>
    </div>
  );
}
