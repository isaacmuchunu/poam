"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, ChevronDown, ChevronRight, Clock, User, AlertTriangle } from 'lucide-react';

interface Task {
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
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
  tags?: string[];
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
}

interface MilestoneGanttProps {
  poamItemId: string;
  milestones: Milestone[];
  onUpdateMilestone?: (milestoneId: string, updates: any) => void;
  onUpdateTask?: (taskId: string, updates: any) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const riskColors = {
  low: 'bg-green-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

export function MilestoneGantt({ 
  poamItemId, 
  milestones, 
  onUpdateMilestone, 
  onUpdateTask 
}: MilestoneGanttProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'gantt' | 'list' | 'kanban'>('gantt');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  // Build hierarchical structure
  const hierarchicalMilestones = useMemo(() => {
    const milestoneMap = new Map<string, Milestone>();
    const rootMilestones: Milestone[] = [];

    // First pass: create map
    milestones.forEach(milestone => {
      milestoneMap.set(milestone.id, { ...milestone, children: [] });
    });

    // Second pass: build hierarchy
    milestones.forEach(milestone => {
      const milestoneWithChildren = milestoneMap.get(milestone.id)!;
      if (milestone.parentMilestoneId) {
        const parent = milestoneMap.get(milestone.parentMilestoneId);
        if (parent) {
          parent.children!.push(milestoneWithChildren);
        }
      } else {
        rootMilestones.push(milestoneWithChildren);
      }
    });

    return rootMilestones;
  }, [milestones]);

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    const dates: Date[] = [];
    
    milestones.forEach(milestone => {
      if (milestone.plannedStartDate) dates.push(new Date(milestone.plannedStartDate));
      if (milestone.plannedEndDate) dates.push(new Date(milestone.plannedEndDate));
    });

    if (dates.length === 0) {
      const now = new Date();
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 3, 0),
      };
    }

    const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add padding
    const padding = 7 * 24 * 60 * 60 * 1000; // 7 days
    return {
      start: new Date(minDate.getTime() - padding),
      end: new Date(maxDate.getTime() + padding),
    };
  }, [milestones]);

  const toggleMilestone = (milestoneId: string) => {
    const newExpanded = new Set(expandedMilestones);
    if (newExpanded.has(milestoneId)) {
      newExpanded.delete(milestoneId);
    } else {
      newExpanded.add(milestoneId);
    }
    setExpandedMilestones(newExpanded);
  };

  const calculateBarPosition = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDuration = timelineBounds.end.getTime() - timelineBounds.start.getTime();
    
    const leftPercent = ((start.getTime() - timelineBounds.start.getTime()) / totalDuration) * 100;
    const widthPercent = ((end.getTime() - start.getTime()) / totalDuration) * 100;
    
    return {
      left: Math.max(0, leftPercent),
      width: Math.max(1, widthPercent),
    };
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const isOverdue = (endDate?: string, status?: string) => {
    if (!endDate || status === 'completed') return false;
    return new Date(endDate) < new Date();
  };

  const renderMilestone = (milestone: Milestone, level: number = 0) => {
    const isExpanded = expandedMilestones.has(milestone.id);
    const hasChildren = milestone.children && milestone.children.length > 0;
    const barPosition = calculateBarPosition(milestone.plannedStartDate, milestone.plannedEndDate);
    const overdue = isOverdue(milestone.plannedEndDate, milestone.status);

    return (
      <div key={milestone.id} className="border-b border-gray-100">
        {/* Milestone Row */}
        <div className="flex items-center py-3 hover:bg-gray-50">
          {/* Hierarchy and Name */}
          <div className="flex-1 flex items-center" style={{ paddingLeft: `${level * 24}px` }}>
            {hasChildren ? (
              <Button
                variant="ghost"
                size="sm"
                className="p-1 h-6 w-6 mr-2"
                onClick={() => toggleMilestone(milestone.id)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            ) : (
              <div className="w-8" />
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium truncate">{milestone.name}</h4>
                {overdue && <AlertTriangle className="h-4 w-4 text-red-500" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={statusColors[milestone.status]} variant="outline">
                  {milestone.status.replace('_', ' ')}
                </Badge>
                <Badge className={priorityColors[milestone.priority]} variant="outline">
                  {milestone.priority}
                </Badge>
                <div className={`w-2 h-2 rounded-full ${riskColors[milestone.riskLevel]}`} />
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="w-24 px-2">
            <div className="text-xs text-gray-600 mb-1">
              {milestone.completedTaskCount}/{milestone.taskCount} tasks
            </div>
            <Progress value={milestone.progressPercentage} className="h-2" />
          </div>

          {/* Dates */}
          <div className="w-32 px-2 text-xs text-gray-600">
            <div>{formatDate(milestone.plannedStartDate)}</div>
            <div>{formatDate(milestone.plannedEndDate)}</div>
          </div>

          {/* Assignee */}
          <div className="w-24 px-2 text-xs text-gray-600">
            {milestone.assigneeName || 'Unassigned'}
          </div>

          {/* Gantt Bar */}
          <div className="flex-1 relative h-8 mx-2">
            {barPosition && (
              <div
                className={`absolute h-6 rounded ${
                  milestone.status === 'completed' 
                    ? 'bg-green-400' 
                    : milestone.status === 'in_progress'
                    ? 'bg-blue-400'
                    : overdue
                    ? 'bg-red-400'
                    : 'bg-gray-400'
                }`}
                style={{
                  left: `${barPosition.left}%`,
                  width: `${barPosition.width}%`,
                  top: '4px',
                }}
              >
                <div className="px-2 py-1 text-xs text-white truncate">
                  {milestone.progressPercentage}%
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Child Milestones */}
        {isExpanded && hasChildren && (
          <div>
            {milestone.children!.map(child => renderMilestone(child, level + 1))}
          </div>
        )}

        {/* Tasks */}
        {isExpanded && milestone.tasks && (
          <div className="bg-gray-50">
            {milestone.tasks.map(task => {
              const taskBarPosition = calculateBarPosition(task.plannedStartDate, task.plannedEndDate);
              const taskOverdue = isOverdue(task.plannedEndDate, task.status);

              return (
                <div key={task.id} className="flex items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div className="flex-1 flex items-center" style={{ paddingLeft: `${(level + 1) * 24 + 24}px` }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-medium truncate">{task.name}</h5>
                        {taskOverdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={statusColors[task.status]} variant="outline" size="sm">
                          {task.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={priorityColors[task.priority]} variant="outline" size="sm">
                          {task.priority}
                        </Badge>
                        {task.estimatedHours && (
                          <span className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {task.estimatedHours}h
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="w-24 px-2">
                    <div className="text-xs text-gray-600">
                      {task.status === 'completed' ? '100%' : '0%'}
                    </div>
                  </div>

                  <div className="w-32 px-2 text-xs text-gray-600">
                    <div>{formatDate(task.plannedStartDate)}</div>
                    <div>{formatDate(task.plannedEndDate)}</div>
                  </div>

                  <div className="w-24 px-2 text-xs text-gray-600">
                    {task.assigneeName || 'Unassigned'}
                  </div>

                  <div className="flex-1 relative h-6 mx-2">
                    {taskBarPosition && (
                      <div
                        className={`absolute h-4 rounded ${
                          task.status === 'completed' 
                            ? 'bg-green-300' 
                            : task.status === 'in_progress'
                            ? 'bg-blue-300'
                            : taskOverdue
                            ? 'bg-red-300'
                            : 'bg-gray-300'
                        }`}
                        style={{
                          left: `${taskBarPosition.left}%`,
                          width: `${taskBarPosition.width}%`,
                          top: '4px',
                        }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderTimelineHeader = () => {
    const totalDays = Math.ceil((timelineBounds.end.getTime() - timelineBounds.start.getTime()) / (24 * 60 * 60 * 1000));
    const intervals = [];
    
    if (timeRange === 'week') {
      // Show days
      for (let i = 0; i < totalDays; i += 7) {
        const date = new Date(timelineBounds.start.getTime() + i * 24 * 60 * 60 * 1000);
        intervals.push({
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          position: (i / totalDays) * 100,
        });
      }
    } else if (timeRange === 'month') {
      // Show weeks
      for (let i = 0; i < totalDays; i += 7) {
        const date = new Date(timelineBounds.start.getTime() + i * 24 * 60 * 60 * 1000);
        intervals.push({
          label: `W${Math.ceil(i / 7) + 1}`,
          position: (i / totalDays) * 100,
        });
      }
    } else {
      // Show months
      const startMonth = timelineBounds.start.getMonth();
      const startYear = timelineBounds.start.getFullYear();
      
      for (let i = 0; i < 12; i++) {
        const month = (startMonth + i) % 12;
        const year = startYear + Math.floor((startMonth + i) / 12);
        const monthDate = new Date(year, month, 1);
        
        if (monthDate > timelineBounds.end) break;
        
        const position = ((monthDate.getTime() - timelineBounds.start.getTime()) / 
                         (timelineBounds.end.getTime() - timelineBounds.start.getTime())) * 100;
        
        intervals.push({
          label: monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
          position,
        });
      }
    }

    return (
      <div className="flex items-center border-b border-gray-200 bg-gray-50">
        <div className="flex-1" />
        <div className="w-24 px-2 text-xs font-medium text-gray-600">Progress</div>
        <div className="w-32 px-2 text-xs font-medium text-gray-600">Dates</div>
        <div className="w-24 px-2 text-xs font-medium text-gray-600">Assignee</div>
        <div className="flex-1 relative h-8 mx-2 bg-white">
          {intervals.map((interval, index) => (
            <div
              key={index}
              className="absolute text-xs text-gray-600 border-l border-gray-200 pl-1"
              style={{ left: `${interval.position}%`, top: '4px' }}
            >
              {interval.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Milestone Timeline</CardTitle>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gantt">Gantt</SelectItem>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="kanban">Kanban</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {viewMode === 'gantt' && (
          <div className="overflow-x-auto">
            {renderTimelineHeader()}
            <div className="min-w-[800px]">
              {hierarchicalMilestones.map(milestone => renderMilestone(milestone))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}