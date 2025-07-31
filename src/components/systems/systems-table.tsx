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
import { Edit, Trash2, Plus } from 'lucide-react';

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

interface SystemsTableProps {
  systems: System[];
  onEdit: (system: System) => void;
  onDelete: (systemId: string) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function SystemsTable({
  systems,
  onEdit,
  onDelete,
  onCreate,
  isLoading = false
}: SystemsTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-red-100 text-red-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Systems</CardTitle>
          <CardDescription>Loading systems...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Systems</CardTitle>
          <CardDescription>Manage your organization's systems and assets</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add System
        </Button>
      </CardHeader>
      <CardContent>
        {systems.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No systems found. Create your first system to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {systems.map((system) => (
                <TableRow key={system.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{system.name}</div>
                      {system.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {system.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{system.systemType || '-'}</TableCell>
                  <TableCell>{system.owner || '-'}</TableCell>
                  <TableCell>{getStatusBadge(system.status)}</TableCell>
                  <TableCell>{new Date(system.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(system)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(system.id)}
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
