"use client";

import React from 'react';
import { AnalyticsDashboard } from '@/components/analytics/analytics-dashboard';
import { WithPermission } from '@/components/auth/permission-guard';
import { useAuth } from '@clerk/nextjs';

export default function AnalyticsPage() {
  const { orgId } = useAuth();

  return (
    <WithPermission permission="read:analytics" fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access analytics features.</p>
        </div>
      </div>
    }>
      {orgId && <AnalyticsDashboard organizationId={orgId} />}
    </WithPermission>
  );
}