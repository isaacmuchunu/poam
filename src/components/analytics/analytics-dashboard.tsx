"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComplianceHeatmap } from './compliance-heatmap';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Calendar,
  FileText,
  Shield,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  compliance: {
    overall: number;
    byFramework: Array<{
      framework: string;
      percentage: number;
      trend: number;
      controls: number;
    }>;
    byCategory: Array<{
      category: string;
      compliant: number;
      nonCompliant: number;
      partiallyCompliant: number;
    }>;
    timeline: Array<{
      date: string;
      compliance: number;
      assessments: number;
    }>;
  };
  poam: {
    total: number;
    byStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
    bySeverity: Array<{
      severity: string;
      count: number;
      avgDaysToResolve: number;
    }>;
    overdue: number;
    completionRate: number;
    timeline: Array<{
      date: string;
      created: number;
      completed: number;
      overdue: number;
    }>;
  };
  risk: {
    totalRiskScore: number;
    distribution: Array<{
      level: string;
      count: number;
      percentage: number;
    }>;
    trends: Array<{
      date: string;
      high: number;
      medium: number;
      low: number;
    }>;
    topRisks: Array<{
      id: string;
      description: string;
      score: number;
      category: string;
      status: string;
    }>;
  };
  performance: {
    assessmentVelocity: number;
    avgResolutionTime: number;
    userActivity: Array<{
      user: string;
      assessments: number;
      poamItems: number;
      evidenceUploads: number;
    }>;
    systemPerformance: Array<{
      system: string;
      complianceScore: number;
      poamCount: number;
      lastAssessed: string;
    }>;
  };
}

interface AnalyticsDashboardProps {
  organizationId: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AnalyticsDashboard({ organizationId }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [organizationId, selectedTimeframe, selectedFramework]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        timeframe: selectedTimeframe,
        framework: selectedFramework,
      });
      
      const response = await fetch(`/api/analytics/dashboard?${params}`);
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const complianceHeatmapData = useMemo(() => {
    if (!data) return [];
    
    // Mock data for heatmap - in production, this would come from the API
    return [
      {
        controlId: 'AC-1',
        controlName: 'Access Control Policy and Procedures',
        framework: 'NIST',
        category: 'Access Control',
        status: 'compliant' as const,
        riskLevel: 'low' as const,
        completionPercentage: 100,
        lastAssessed: '2024-01-15',
        assignee: 'John Doe',
        poamCount: 0,
        evidenceCount: 3,
        trend: 'stable' as const,
        trendPercentage: 0,
      },
      // Add more mock data...
    ];
  }, [data]);

  const exportReport = async (type: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await fetch(`/api/analytics/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          timeframe: selectedTimeframe,
          framework: selectedFramework,
          data,
        }),
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Failed to load analytics data</p>
        <Button onClick={fetchAnalyticsData} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive compliance and risk analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={(value: any) => setSelectedTimeframe(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Frameworks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              <SelectItem value="ISO27001">ISO 27001</SelectItem>
              <SelectItem value="NIST">NIST</SelectItem>
              <SelectItem value="SOC2">SOC 2</SelectItem>
              <SelectItem value="PCI_DSS">PCI DSS</SelectItem>
              <SelectItem value="GDPR">GDPR</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={() => exportReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.compliance.overall}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active POA&M Items</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.poam.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.poam.overdue} overdue items
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.risk.totalRiskScore}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 inline mr-1 text-green-500" />
              -5.2% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.performance.avgResolutionTime} days</div>
            <p className="text-xs text-muted-foreground">
              Across all POA&M items
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="compliance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
          <TabsTrigger value="poam">POA&M Tracking</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Compliance by Framework */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance by Framework</CardTitle>
                <CardDescription>Current compliance status across frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.compliance.byFramework}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trend</CardTitle>
                <CardDescription>Compliance percentage over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.compliance.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="compliance" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Compliance by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance by Category</CardTitle>
              <CardDescription>Detailed breakdown of compliance status by control category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.compliance.byCategory} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="compliant" stackId="a" fill="#10B981" />
                  <Bar dataKey="partiallyCompliant" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="nonCompliant" stackId="a" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Risk Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Distribution</CardTitle>
                <CardDescription>Current risk levels across the organization</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.risk.distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ level, percentage }) => `${level}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.risk.distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Risk Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Risk Trends</CardTitle>
                <CardDescription>Risk level changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.risk.trends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="high" stackId="1" stroke="#EF4444" fill="#EF4444" />
                    <Area type="monotone" dataKey="medium" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
                    <Area type="monotone" dataKey="low" stackId="1" stroke="#10B981" fill="#10B981" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Risks */}
          <Card>
            <CardHeader>
              <CardTitle>Top Risk Items</CardTitle>
              <CardDescription>Highest priority risks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.risk.topRisks.map((risk) => (
                  <div key={risk.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex-1">
                      <h4 className="font-medium">{risk.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{risk.category}</Badge>
                        <Badge variant={risk.status === 'open' ? 'destructive' : 'secondary'}>
                          {risk.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-red-600">{risk.score}</div>
                      <div className="text-xs text-gray-500">Risk Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="poam" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* POA&M Status */}
            <Card>
              <CardHeader>
                <CardTitle>POA&M Status Distribution</CardTitle>
                <CardDescription>Current status of all POA&M items</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.poam.byStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percentage }) => `${status}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.poam.byStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* POA&M Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>POA&M Activity</CardTitle>
                <CardDescription>Creation and completion trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.poam.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="created" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="completed" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="overdue" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Severity Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>POA&M by Severity</CardTitle>
              <CardDescription>Average resolution time by severity level</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.poam.bySeverity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="severity" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="count" fill="#8884d8" />
                  <Bar yAxisId="right" dataKey="avgDaysToResolve" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle>User Activity</CardTitle>
                <CardDescription>Top contributors by activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.userActivity.map((user, index) => (
                    <div key={user.user} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{user.user}</div>
                          <div className="text-sm text-gray-500">
                            {user.assessments} assessments, {user.poamItems} POA&M items
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">{user.evidenceUploads} uploads</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Compliance scores by system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.systemPerformance.map((system) => (
                    <div key={system.system} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{system.system}</div>
                        <div className="text-sm text-gray-500">
                          {system.poamCount} POA&M items • Last assessed: {new Date(system.lastAssessed).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{system.complianceScore}%</div>
                        <div className="text-xs text-gray-500">Compliance</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <ComplianceHeatmap 
            data={complianceHeatmapData}
            framework={selectedFramework === 'all' ? undefined : selectedFramework}
            onControlClick={(control) => {
              console.log('Control clicked:', control);
              // Handle control click - could open detail modal
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}