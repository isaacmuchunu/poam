'use client';

import React, { useState, useEffect } from 'react';
import { FrameworkForm } from '@/components/frameworks/framework-form';
import { FrameworksTable } from '@/components/frameworks/frameworks-table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  description?: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function FrameworksPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFramework, setEditingFramework] = useState<Framework | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/frameworks');
      if (response.ok) {
        const data = await response.json();
        setFrameworks(data);
      } else {
        console.error('Failed to fetch frameworks');
      }
    } catch (error) {
      console.error('Error fetching frameworks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingFramework(null);
    setShowForm(true);
  };

  const handleEdit = (framework: Framework) => {
    setEditingFramework(framework);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const url = editingFramework ? `/api/frameworks/${editingFramework.id}` : '/api/frameworks';
      const method = editingFramework ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchFrameworks();
        setShowForm(false);
        setEditingFramework(null);
      } else {
        console.error('Failed to save framework');
      }
    } catch (error) {
      console.error('Error saving framework:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (frameworkId: string) => {
    if (confirm('Are you sure you want to delete this framework?')) {
      try {
        const response = await fetch(`/api/frameworks/${frameworkId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchFrameworks();
        } else {
          console.error('Failed to delete framework');
        }
      } catch (error) {
        console.error('Error deleting framework:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingFramework(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Frameworks Management</h1>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        <FrameworkForm
          initialData={editingFramework || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Frameworks Management</h1>
      </div>
      
      <FrameworksTable
        frameworks={frameworks}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
}
