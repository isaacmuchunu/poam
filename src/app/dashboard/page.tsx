import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DashboardStats, DashboardTabs } from '@/components/dashboard/dashboard-stats';
import { PoamTable } from '@/components/poam/poam-table';

interface DashboardStatsData {
  totalPoams: number;
  overdue: number;
  completed: number;
  inProgress: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
}

interface PoamItem {
  id: string;
  securityControl: string;
  weakness: string;
  severityLevel: string;
  status: string;
  plannedCompletionDate: string;
  systemAssetId?: string;
  systemName?: string;
}

interface DashboardPageProps {
  stats: DashboardStatsData;
  recentItems: PoamItem[];
}

export default function DashboardPage({ stats, recentItems }: DashboardPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>Create POA&M Item</Button>
      </div>
      
      <DashboardStats stats={stats} />
      
      <DashboardTabs stats={stats} />
      
      <Card>
        <CardHeader>
          <CardTitle>Recent POA&M Items</CardTitle>
        </CardHeader>
        <CardContent>
          <PoamTable 
            data={recentItems} 
            onEdit={(id) => console.log('Edit', id)} 
            onDelete={(id) => console.log('Delete', id)} 
            onView={(id) => console.log('View', id)} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
