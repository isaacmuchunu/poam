'use client';

import React, { useState, useEffect } from 'react';
import { ReportTemplateForm } from '@/components/reports/report-template-form';
import { ReportTemplatesTable } from '@/components/reports/report-templates-table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  config: {
    includeCharts: boolean;
    includeSummary: boolean;
    includeDetails: boolean;
    filterBySeverity: string[];
    filterByStatus: string[];
    dateRange: string;
  };
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/report-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      } else {
        console.error('Failed to fetch report templates');
      }
    } catch (error) {
      console.error('Error fetching report templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template: ReportTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const url = editingTemplate ? `/api/report-templates/${editingTemplate.id}` : '/api/report-templates';
      const method = editingTemplate ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await fetchTemplates();
        setShowForm(false);
        setEditingTemplate(null);
      } else {
        console.error('Failed to save report template');
      }
    } catch (error) {
      console.error('Error saving report template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this report template?')) {
      try {
        const response = await fetch(`/api/report-templates/${templateId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchTemplates();
        } else {
          console.error('Failed to delete report template');
        }
      } catch (error) {
        console.error('Error deleting report template:', error);
      }
    }
  };

  const handleGenerate = async (template: ReportTemplate) => {
    // In a real implementation, this would generate and download a report
    console.log('Generating report with template:', template);
    alert('Report generation started. You will receive an email when it\'s ready.');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Report Templates</h1>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        <ReportTemplateForm
          initialData={editingTemplate || undefined}
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
        <h1 className="text-3xl font-bold">Report Templates</h1>
      </div>
      
      <ReportTemplatesTable
        templates={templates}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />
    </div>
  );
}
