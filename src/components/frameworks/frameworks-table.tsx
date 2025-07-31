import React from 'react';
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
import { Edit, Trash2, Plus } from 'lucide-react';

interface Framework {
  id: string;
  name: string;
  description?: string;
  version?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FrameworksTableProps {
  frameworks: Framework[];
  onEdit: (framework: Framework) => void;
  onDelete: (frameworkId: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function FrameworksTable({
  frameworks,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false
}: FrameworksTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Frameworks</CardTitle>
          <CardDescription>Loading frameworks...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Compliance Frameworks</CardTitle>
          <CardDescription>Manage your organization's compliance frameworks</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Framework
        </Button>
      </CardHeader>
      <CardContent>
        {frameworks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No frameworks found. Create your first framework to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {frameworks.map((framework) => (
                <TableRow key={framework.id}>
                  <TableCell>
                    <div className="font-medium">{framework.name}</div>
                  </TableCell>
                  <TableCell>{framework.version || '-'}</TableCell>
                  <TableCell>
                    {framework.description ? (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {framework.description}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{new Date(framework.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(framework)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(framework.id)}
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
