import React from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { formatDate, getSeverityColor, getStatusColor } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash, FileText } from 'lucide-react';

interface PoamItem {
  id: string;
  securityControl: string;
  weakness: string;
  severityLevel: string;
  status: string;
  plannedCompletionDate: string;
  systemAssetId?: string;
  systemName?: string;
}

interface PoamTableProps {
  data: PoamItem[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function PoamTable({ data, onEdit, onDelete, onView }: PoamTableProps) {
  const columns: ColumnDef<PoamItem>[] = [
    {
      accessorKey: 'weakness',
      header: 'Weakness',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('weakness')}</div>
      ),
    },
    {
      accessorKey: 'securityControl',
      header: 'Security Control',
    },
    {
      accessorKey: 'severityLevel',
      header: 'Severity',
      cell: ({ row }) => {
        const severity = row.getValue('severityLevel') as string;
        return (
          <Badge className={getSeverityColor(severity)}>
            {severity}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge className={getStatusColor(status)}>
            {status.replace('_', ' ')}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'plannedCompletionDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const date = row.getValue('plannedCompletionDate') as string;
        return date ? formatDate(date) : 'N/A';
      },
    },
    {
      accessorKey: 'systemName',
      header: 'System',
      cell: ({ row }) => {
        return row.original.systemName || 'N/A';
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const item = row.original;
        
        return (
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onView(item.id)}>
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(item.id)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="weakness"
    />
  );
}
