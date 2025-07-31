'use client';

import React, { useState, useEffect } from 'react';
import { SystemForm } from '@/components/systems/system-form';
import { SystemsTable } from '@/components/systems/systems-table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface System {
  id: string;
  name: string;
  description?: string;
  systemType?: string;
  owner?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function SystemsPage() {
  const [systems, setSystems] = useState<System[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSystem, setEditingSystem] = useState<System | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchSystems();
  }, []);

  const fetchSystems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/systems');
      if (response.ok) {
        const data = await response.json();
        setSystems(data);
      } else {
        console.error('Failed to fetch systems');
      }
    } catch (error) {
      console.error('Error fetching systems:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSystem(null);
    setShowForm(true);
  };

  const handleEdit = (system: System) => {
    setEditingSystem(system);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const url = editingSystem ? `/api/systems/${editingSystem.id}` : '/api/systems';
      const method = editingSystem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchSystems();
        setShowForm(false);
        setEditingSystem(null);
      } else {
        console.error('Failed to save system');
      }
    } catch (error) {
      console.error('Error saving system:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (systemId: string) => {
    if (confirm('Are you sure you want to delete this system?')) {
      try {
        const response = await fetch(`/api/systems/${systemId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchSystems();
        } else {
          console.error('Failed to delete system');
        }
      } catch (error) {
        console.error('Error deleting system:', error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingSystem(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Systems Management</h1>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        <SystemForm
          initialData={editingSystem || undefined}
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
        <h1 className="text-3xl font-bold">Systems Management</h1>
      </div>
      
      <SystemsTable
        systems={systems}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        isLoading={isLoading}
      />
    </div>
  );
}
