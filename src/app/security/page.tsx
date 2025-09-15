"use client";

import React from 'react';
import { SecurityDashboard } from '@/components/security/security-dashboard';
import { WithPermission } from '@/components/auth/permission-guard';

export default function SecurityPage() {
  return (
    <WithPermission permission="read:audit_logs" fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access security features.</p>
        </div>
      </div>
    }>
      <SecurityDashboard />
    </WithPermission>
  );
}