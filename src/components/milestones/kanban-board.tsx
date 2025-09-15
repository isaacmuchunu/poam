"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, User, AlertTriangle, Plus, MoreHorizontal } from 'lucide-react';

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
  estimatedHours?: number;
  tags?: string[];
  milestoneId: string;
  milestoneName: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  status: Task['status'];
  tasks: Task[];
  color: string;
}

interface KanbanBoardProps {
  tasks: Task[];
  onUpdateTask: (taskId: string, updates: any) => void;
  onCreateTask: (task: Omit<Task, 'id'>) => void;
}

const priorityColors = {
  low: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

const columnConfigs: Omit<KanbanColumn, 'tasks'>[] = [
  { id: 'pending', title: 'To Do', status: 'pending', color: 'bg-gray-50 border-gray-200' },
  { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-blue-50 border-blue-200' },
  { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-green-50 border-green-200' },
  { id: 'cancelled', title: 'Cancelled', status: 'cancelled', color: 'bg-red-50 border-red-200' },
];

export function KanbanBoard({ tasks, onUpdateTask, onCreateTask }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTask, setNewTask] = useState({
    name: '',
    description: '',
    priority: 'medium' as Task['priority'],
    estimatedHours: '',
    milestoneId: '',
  });

  // Group tasks by status
  const columns: KanbanColumn[] = columnConfigs.map(config => ({
    ...config,
    tasks: tasks.filter(task => task.status === config.status),
  }));

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== targetStatus) {
      onUpdateTask(draggedTask.id, { status: targetStatus });
    }
    setDraggedTask(null);
  };

  const isOverdue = (endDate?: string, status?: string) => {
    if (!endDate || status === 'completed') return false;
    return new Date(endDate) < new Date();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleCreateTask = () => {
    if (!newTask.name.trim()) return;
    
    onCreateTask({
      ...newTask,
      status: 'pending',
      estimatedHours: newTask.estimatedHours ? parseInt(newTask.estimatedHours) : undefined,
    } as any);
    
    setNewTask({
      name: '',
      description: '',
      priority: 'medium',
      estimatedHours: '',
      milestoneId: '',
    });
    setIsCreating(false);
  };

  const renderTask = (task: Task) => {
    const overdue = isOverdue(task.plannedEndDate, task.status);
    
    return (
      <Card
        key={task.id}
        className={`mb-3 cursor-pointer hover:shadow-md transition-shadow ${
          draggedTask?.id === task.id ? 'opacity-50' : ''
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => setSelectedTask(task)}
      >
        <CardContent className="p-3">
          <div className="space-y-2">
            {/* Task Header */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm leading-tight">{task.name}</h4>
              <div className="flex items-center gap-1 ml-2">
                {overdue && <AlertTriangle className="h-3 w-3 text-red-500" />}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-xs text-gray-600 line-clamp-2">{task.description}</p>
            )}

            {/* Tags */}
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {task.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    +{task.tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Milestone */}
            <div className="text-xs text-gray-500">
              📁 {task.milestoneName}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Badge className={priorityColors[task.priority]} variant="outline">
                  {task.priority}
                </Badge>
                {task.estimatedHours && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {task.estimatedHours}h
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {task.plannedEndDate && (
                  <div className={`text-xs ${overdue ? 'text-red-500' : 'text-gray-500'}`}>
                    <Calendar className="h-3 w-3 inline mr-1" />
                    {formatDate(task.plannedEndDate)}
                  </div>
                )}
                {task.assigneeId && (
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={task.assigneeAvatar} />
                    <AvatarFallback className="text-xs">
                      {task.assigneeName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Task Board</h3>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`rounded-lg border-2 border-dashed p-4 min-h-[500px] ${column.color}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-sm">{column.title}</h4>
              <Badge variant="secondary" className="text-xs">
                {column.tasks.length}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {column.tasks.map(renderTask)}
            </div>
          </div>
        ))}
      </div>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTask?.name}</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={selectedTask.status}
                    onValueChange={(value) => {
                      onUpdateTask(selectedTask.id, { status: value });
                      setSelectedTask({ ...selectedTask, status: value as Task['status'] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={selectedTask.priority}
                    onValueChange={(value) => {
                      onUpdateTask(selectedTask.id, { priority: value });
                      setSelectedTask({ ...selectedTask, priority: value as Task['priority'] });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedTask.description && (
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Planned Start</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedTask.plannedStartDate) || 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Planned End</label>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedTask.plannedEndDate) || 'Not set'}
                  </p>
                </div>
              </div>

              {selectedTask.estimatedHours && (
                <div>
                  <label className="text-sm font-medium">Estimated Hours</label>
                  <p className="text-sm text-gray-600 mt-1">{selectedTask.estimatedHours} hours</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Milestone</label>
                <p className="text-sm text-gray-600 mt-1">{selectedTask.milestoneName}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Task Name</label>
              <Input
                value={newTask.name}
                onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                placeholder="Enter task name"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={newTask.priority}
                  onValueChange={(value) => setNewTask({ ...newTask, priority: value as Task['priority'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Estimated Hours</label>
                <Input
                  type="number"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateTask} disabled={!newTask.name.trim()}>
                Create Task
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}