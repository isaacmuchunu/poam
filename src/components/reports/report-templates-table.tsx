import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Edit, Trash2, Plus, FileText, Download } from 'lucide-react';

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

interface ReportTemplatesTableProps {
  templates: ReportTemplate[];
  onEdit: (template: ReportTemplate) => void;
  onDelete: (templateId: string) => void;
  onCreate: () => void;
  onGenerate: (template: ReportTemplate) => void;
  isLoading?: boolean;
}

export function ReportTemplatesTable({
  templates,
  onEdit,
  onDelete,
  onCreate,
  onGenerate,
  isLoading = false
}: ReportTemplatesTableProps) {
  const getDateRangeLabel = (dateRange: string) => {
    const labels = {
      last_30_days: 'Last 30 Days',
      last_90_days: 'Last 90 Days', 
      last_year: 'Last Year',
      all_time: 'All Time',
    };
    return labels[dateRange as keyof typeof labels] || dateRange;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Loading report templates...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Report Templates</CardTitle>
          <CardDescription>Manage and generate reports from templates</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No report templates found. Create your first template to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Configuration</TableHead>
                <TableHead>Date Range</TableHead>
                <TableHead>Default</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      {template.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {template.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        {template.config.includeCharts && (
                          <Badge variant="outline" className="text-xs">Charts</Badge>
                        )}
                        {template.config.includeSummary && (
                          <Badge variant="outline" className="text-xs">Summary</Badge>
                        )}
                        {template.config.includeDetails && (
                          <Badge variant="outline" className="text-xs">Details</Badge>
                        )}
                      </div>
                      {template.config.filterBySeverity.length > 0 && (
                        <div className="text-xs text-gray-500">
                          Severity: {template.config.filterBySeverity.join(', ')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getDateRangeLabel(template.config.dateRange)}</TableCell>
                  <TableCell>
                    {template.isDefault && (
                      <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                    )}
                  </TableCell>
                  <TableCell>{new Date(template.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onGenerate(template)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
