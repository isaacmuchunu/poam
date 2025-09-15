"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WithPermission } from '@/components/auth/permission-guard';
import { EvidenceRepository } from '@/components/evidence/evidence-repository';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Archive, 
  Upload,
  Calendar,
  Bell,
  Settings,
  Shield,
  Database
} from 'lucide-react';

interface EvidenceStats {
  totalItems: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  archived: number;
  categoryCounts: Array<{
    category: string;
    count: number;
  }>;
  upcomingRetentions: Array<{
    id: string;
    name: string;
    retentionDate: string;
    category: string;
  }>;
  recentUploads: Array<{
    id: string;
    name: string;
    uploadedBy: string;
    uploadedAt: string;
    category: string;
  }>;
}

interface Reminder {
  id: string;
  type: 'retention' | 'review' | 'renewal';
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  entityId: string;
  entityType: string;
  isRead: boolean;
}

export default function EvidenceHubPage() {
  const [stats, setStats] = useState<EvidenceStats | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'all' | 'poam' | 'milestone' | 'task'>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string>('');
  const [entities, setEntities] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch evidence statistics
      const statsResponse = await fetch('/api/evidence/stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch reminders
      const remindersResponse = await fetch('/api/evidence/reminders');
      const remindersData = await remindersResponse.json();
      setReminders(remindersData.reminders || []);

      // Fetch entities for filtering
      const entitiesResponse = await fetch('/api/evidence/entities');
      const entitiesData = await entitiesResponse.json();
      setEntities(entitiesData.entities || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markReminderAsRead = async (reminderId: string) => {
    try {
      await fetch(`/api/evidence/reminders/${reminderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      
      setReminders(reminders.map(r => 
        r.id === reminderId ? { ...r, isRead: true } : r
      ));
    } catch (error) {
      console.error('Error marking reminder as read:', error);
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || colors.medium;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const unreadReminders = reminders.filter(r => !r.isRead);
  const overdueReminders = reminders.filter(r => 
    new Date(r.dueDate) < new Date() && !r.isRead
  );

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Evidence & Documentation Hub</h1>
          <p className="text-muted-foreground">
            Centralized repository with version control, automated reminders, and compliance tracking
          </p>
        </div>
        <div className="flex gap-2">
          <WithPermission permission="write:evidence">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Evidence
            </Button>
          </WithPermission>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Evidence</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Across all categories
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Ready for use
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reminders</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{unreadReminders.length}</div>
              <p className="text-xs text-muted-foreground">
                {overdueReminders.length} overdue
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reminders and Alerts */}
      {unreadReminders.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Bell className="h-5 w-5" />
              Active Reminders ({unreadReminders.length})
            </CardTitle>
            <CardDescription className="text-orange-700">
              Important items requiring your attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {unreadReminders.slice(0, 5).map((reminder) => (
                <div key={reminder.id} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{reminder.title}</h4>
                      <Badge className={getPriorityColor(reminder.priority)} variant="outline">
                        {reminder.priority}
                      </Badge>
                      {new Date(reminder.dueDate) < new Date() && (
                        <Badge variant="destructive">Overdue</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{reminder.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {formatDate(reminder.dueDate)}</span>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => markReminderAsRead(reminder.id)}
                  >
                    Mark Read
                  </Button>
                </div>
              ))}
              {unreadReminders.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  +{unreadReminders.length - 5} more reminders
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Overview */}
      {stats && stats.categoryCounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Evidence by Category</CardTitle>
            <CardDescription>Distribution of evidence across different categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {stats.categoryCounts.map((category) => (
                <div key={category.category} className="text-center">
                  <div className="text-2xl font-bold">{category.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {category.category}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="repository" className="space-y-4">
        <TabsList>
          <TabsTrigger value="repository">
            <FileText className="h-4 w-4 mr-2" />
            Repository
          </TabsTrigger>
          <TabsTrigger value="reminders">
            <Bell className="h-4 w-4 mr-2" />
            Reminders
          </TabsTrigger>
          <TabsTrigger value="retention">
            <Archive className="h-4 w-4 mr-2" />
            Retention
          </TabsTrigger>
          <TabsTrigger value="compliance">
            <Shield className="h-4 w-4 mr-2" />
            Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="repository" className="space-y-4">
          {/* Entity Filter */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Select value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="View" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Evidence</SelectItem>
                    <SelectItem value="poam">By POA&M Item</SelectItem>
                    <SelectItem value="milestone">By Milestone</SelectItem>
                    <SelectItem value="task">By Task</SelectItem>
                  </SelectContent>
                </Select>
                
                {selectedView !== 'all' && (
                  <Select value={selectedEntityId} onValueChange={setSelectedEntityId}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder={`Select ${selectedView}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {entities
                        .filter(e => e.type === selectedView)
                        .map((entity) => (
                          <SelectItem key={entity.id} value={entity.id}>
                            {entity.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Evidence Repository Component */}
          <EvidenceRepository 
            poamItemId={selectedView === 'poam' ? selectedEntityId : undefined}
            milestoneId={selectedView === 'milestone' ? selectedEntityId : undefined}
            taskId={selectedView === 'task' ? selectedEntityId : undefined}
          />
        </TabsContent>

        <TabsContent value="reminders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Reminders</CardTitle>
              <CardDescription>
                Automated reminders for evidence review, renewal, and retention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.map((reminder) => (
                  <div key={reminder.id} className={`p-4 border rounded ${reminder.isRead ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${reminder.isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                          {reminder.title}
                        </h4>
                        <Badge className={getPriorityColor(reminder.priority)} variant="outline">
                          {reminder.priority}
                        </Badge>
                        {new Date(reminder.dueDate) < new Date() && !reminder.isRead && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                        {reminder.isRead && (
                          <Badge variant="secondary">Read</Badge>
                        )}
                      </div>
                      {!reminder.isRead && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => markReminderAsRead(reminder.id)}
                        >
                          Mark Read
                        </Button>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${reminder.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                      {reminder.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Due: {formatDate(reminder.dueDate)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        <span>{reminder.entityType}: {reminder.entityId}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {reminders.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reminders at this time</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Retention</CardTitle>
              <CardDescription>
                Manage evidence lifecycle and retention policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats && stats.upcomingRetentions.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="font-medium">Upcoming Retentions</h4>
                  <div className="space-y-2">
                    {stats.upcomingRetentions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <h5 className="font-medium text-sm">{item.name}</h5>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                            <Badge variant="outline">{item.category}</Badge>
                            <span>Retention Date: {formatDate(item.retentionDate)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">Extend</Button>
                          <Button size="sm" variant="outline">Archive</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No upcoming retentions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Overview</CardTitle>
              <CardDescription>
                Evidence compliance status and audit readiness
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Audit Readiness</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Evidence Coverage</span>
                      <span className="text-sm font-medium">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Review Completion</span>
                      <span className="text-sm font-medium">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Recent Activity</h4>
                  {stats && stats.recentUploads.length > 0 ? (
                    <div className="space-y-2">
                      {stats.recentUploads.slice(0, 5).map((upload) => (
                        <div key={upload.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium">{upload.name}</span>
                            <span className="text-gray-500 ml-2">by {upload.uploadedBy}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(upload.uploadedAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recent uploads</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}