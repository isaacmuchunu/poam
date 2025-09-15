"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { WithPermission } from '@/components/auth/permission-guard';
import { MilestoneGantt } from '@/components/milestones/milestone-gantt';
import { KanbanBoard } from '@/components/milestones/kanban-board';
import { Plus, Calendar, BarChart3, Kanban, List, Search, Filter } from 'lucide-react';

interface Task {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  tags?: string[];
  milestoneId: string;
  milestoneName: string;
}

interface Milestone {
  id: string;
  name: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigneeId?: string;
  assigneeName?: string;
  plannedStartDate?: string;
  plannedEndDate?: string;
  actualStartDate?: string;
  actualEndDate?: string;
  progressPercentage: number;
  riskLevel: 'low' | 'medium' | 'high';
  taskCount: number;
  completedTaskCount: number;
  tasks?: Task[];
  parentMilestoneId?: string;
  children?: Milestone[];
  poamItemId: string;
  poamItemName?: string;
}

interface POAMItem {
  id: string;
  securityControl: string;
  weakness: string;
  status: string;
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [poamItems, setPOAMItems] = useState<POAMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'gantt' | 'kanban' | 'list'>('gantt');
  const [selectedPOAMItem, setSelectedPOAMItem] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedPOAMItem, statusFilter, priorityFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch POA&M items first
      const poamResponse = await fetch('/api/poam');
      const poamData = await poamResponse.json();
      setPOAMItems(poamData.items || []);

      // Build query parameters for milestones
      const milestoneParams = new URLSearchParams();
      if (selectedPOAMItem !== 'all') milestoneParams.set('poamItemId', selectedPOAMItem);
      if (statusFilter !== 'all') milestoneParams.set('status', statusFilter);
      if (priorityFilter !== 'all') milestoneParams.set('priority', priorityFilter);

      // Fetch milestones
      const milestonesResponse = await fetch(`/api/milestones?${milestoneParams}`);
      const milestonesData = await milestonesResponse.json();
      
      // Fetch tasks for each milestone
      const milestonesWithTasks = await Promise.all(
        (milestonesData.milestones || []).map(async (milestone: Milestone) => {
          const tasksResponse = await fetch(`/api/tasks?milestoneId=${milestone.id}`);
          const tasksData = await tasksResponse.json();
          return {
            ...milestone,
            tasks: tasksData.tasks || [],
          };
        })
      );

      // Flatten all tasks for kanban view
      const allTasks = milestonesWithTasks.flatMap(milestone => 
        (milestone.tasks || []).map(task => ({
          ...task,
          milestoneName: milestone.name,
        }))
      );

      setMilestones(milestonesWithTasks);
      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMilestone = async (milestoneId: string, updates: any) => {
    try {
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, ...updates }),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleCreateTask = async (task: Omit<Task, 'id'>) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        fetchData(); // Refresh data
      }
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  // Filter milestones and tasks based on search term
  const filteredMilestones = milestones.filter(milestone =>
    milestone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    milestone.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter(task =>
    task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    task.milestoneName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate summary statistics
  const stats = {
    totalMilestones: milestones.length,
    completedMilestones: milestones.filter(m => m.status === 'completed').length,
    overdueMilestones: milestones.filter(m => 
      m.plannedEndDate && new Date(m.plannedEndDate) < new Date() && m.status !== 'completed'
    ).length,
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    overdueTasks: tasks.filter(t => 
      t.plannedEndDate && new Date(t.plannedEndDate) < new Date() && t.status !== 'completed'
    ).length,
    averageProgress: milestones.length > 0 
      ? Math.round(milestones.reduce((sum, m) => sum + m.progressPercentage, 0) / milestones.length)
      : 0,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Milestone & Task Management</h1>
          <p className="text-muted-foreground">
            Track progress, manage dependencies, and visualize project timelines
          </p>
        </div>
        <div className="flex gap-2">
          <WithPermission permission="write:milestones">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Milestone
            </Button>
          </WithPermission>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Milestones</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMilestones}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedMilestones} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageProgress}%</div>
            <p className="text-xs text-muted-foreground">
              Across all milestones
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedTasks} completed
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.overdueMilestones + stats.overdueTasks}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.overdueMilestones} milestones, {stats.overdueTasks} tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search milestones and tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedPOAMItem} onValueChange={setSelectedPOAMItem}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="POA&M Item" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All POA&M Items</SelectItem>
                {poamItems.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.securityControl}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* View Tabs */}
      <Tabs value={activeView} onValueChange={(value: any) => setActiveView(value)}>
        <TabsList>
          <TabsTrigger value="gantt">
            <BarChart3 className="h-4 w-4 mr-2" />
            Gantt Chart
          </TabsTrigger>
          <TabsTrigger value="kanban">
            <Kanban className="h-4 w-4 mr-2" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="h-4 w-4 mr-2" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="gantt" className="space-y-4">
          <MilestoneGantt
            poamItemId={selectedPOAMItem}
            milestones={filteredMilestones}
            onUpdateMilestone={handleUpdateMilestone}
            onUpdateTask={handleUpdateTask}
          />
        </TabsContent>

        <TabsContent value="kanban" className="space-y-4">
          <KanbanBoard
            tasks={filteredTasks}
            onUpdateTask={handleUpdateTask}
            onCreateTask={handleCreateTask}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          {/* List view implementation */}
          <Card>
            <CardHeader>
              <CardTitle>Milestones List</CardTitle>
              <CardDescription>
                Hierarchical view of all milestones and their tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredMilestones.map((milestone) => (
                  <Card key={milestone.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{milestone.name}</h4>
                          <p className="text-sm text-muted-foreground">{milestone.description}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{milestone.status}</Badge>
                          <Badge variant="outline">{milestone.priority}</Badge>
                          <div className="text-sm text-muted-foreground">
                            {milestone.progressPercentage}%
                          </div>
                        </div>
                      </div>
                      
                      {milestone.tasks && milestone.tasks.length > 0 && (
                        <div className="space-y-2 mt-4 pt-4 border-t">
                          <h5 className="font-medium text-sm">Tasks ({milestone.tasks.length})</h5>
                          <div className="grid gap-2">
                            {milestone.tasks.map((task) => (
                              <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <div>
                                  <span className="text-sm">{task.name}</span>
                                  {task.assigneeName && (
                                    <span className="text-xs text-muted-foreground ml-2">
                                      • {task.assigneeName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {task.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}