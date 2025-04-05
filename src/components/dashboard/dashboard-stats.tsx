import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSeverityColor, getStatusColor } from '@/lib/utils';

interface DashboardStatsProps {
  stats: {
    statusCounts: Array<{ status: string; count: number }>;
    severityCounts: Array<{ severity: string; count: number }>;
    systemCounts: Array<{ systemId: string; systemName: string; count: number }>;
    frameworkCounts: Array<{ frameworkId: string; frameworkName: string; count: number }>;
    upcomingItems: Array<{
      id: string;
      weakness: string;
      plannedCompletionDate: string;
      severityLevel: string;
    }>;
    totalItems: number;
  };
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total POA&M Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">
            Across all systems and frameworks
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.statusCounts.map((item) => (
              <div key={item.status} className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(item.status)}`} />
                <span className="text-sm flex-1">{item.status.replace('_', ' ')}</span>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">By Severity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.severityCounts.map((item) => (
              <div key={item.severity} className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${getSeverityColor(item.severity)}`} />
                <span className="text-sm flex-1">{item.severity}</span>
                <span className="text-sm font-medium">{item.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Deadlines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats.upcomingItems.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center">
                <div className={`h-2 w-2 rounded-full mr-2 ${getSeverityColor(item.severityLevel)}`} />
                <span className="text-xs flex-1 truncate">{item.weakness}</span>
                <span className="text-xs font-medium">
                  {new Date(item.plannedCompletionDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardTabs({ stats }: DashboardStatsProps) {
  return (
    <Tabs defaultValue="systems" className="mt-6">
      <TabsList>
        <TabsTrigger value="systems">Systems</TabsTrigger>
        <TabsTrigger value="frameworks">Frameworks</TabsTrigger>
      </TabsList>
      <TabsContent value="systems" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.systemCounts.map((system) => (
            <Card key={system.systemId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{system.systemName}</CardTitle>
                <CardDescription>System</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{system.count}</div>
                <p className="text-xs text-muted-foreground">POA&M items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="frameworks" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.frameworkCounts.map((framework) => (
            <Card key={framework.frameworkId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{framework.frameworkName}</CardTitle>
                <CardDescription>Framework</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{framework.count}</div>
                <p className="text-xs text-muted-foreground">POA&M items</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
