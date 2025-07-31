'use client';

import React, { useState, useEffect } from 'react';
import { AuditLogsTable } from '@/components/audit/audit-logs-table';

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export default function AuditLogsPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/audit-logs');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      } else {
        console.error('Failed to fetch audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilter = async (filters: {
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`/api/audit-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data);
      } else {
        console.error('Failed to fetch filtered audit logs');
      }
    } catch (error) {
      console.error('Error fetching filtered audit logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>
      
      <AuditLogsTable
        auditLogs={auditLogs}
        isLoading={isLoading}
        onFilter={handleFilter}
      />
    </div>
  );
}
