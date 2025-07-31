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
import { Edit, Trash2, Plus, Download, FileText } from 'lucide-react';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  description?: string;
  uploadedAt: Date;
  storageUrl: string;
  poamItemId: string;
}

interface EvidenceTableProps {
  evidenceFiles: EvidenceFile[];
  onEdit: (evidence: EvidenceFile) => void;
  onDelete: (evidenceId: string) => void;
  onCreate: () => void;
  onDownload: (evidence: EvidenceFile) => void;
  isLoading?: boolean;
}

export function EvidenceTable({
  evidenceFiles,
  onEdit,
  onDelete,
  onCreate,
  onDownload,
  isLoading = false
}: EvidenceTableProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    const kb = bytes / 1024;
    const mb = kb / 1024;
    
    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    } else {
      return `${kb.toFixed(2)} KB`;
    }
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileText className="h-4 w-4" />;
    
    if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (fileType.includes('image')) {
      return <FileText className="h-4 w-4 text-green-500" />;
    } else if (fileType.includes('document') || fileType.includes('word')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    }
    
    return <FileText className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evidence Files</CardTitle>
          <CardDescription>Loading evidence files...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Evidence Files</CardTitle>
          <CardDescription>Manage evidence files for POA&M items</CardDescription>
        </div>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Upload Evidence
        </Button>
      </CardHeader>
      <CardContent>
        {evidenceFiles.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No evidence files found. Upload your first evidence file to get started.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Uploaded</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {evidenceFiles.map((evidence) => (
                <TableRow key={evidence.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getFileIcon(evidence.fileType)}
                      <div className="font-medium">{evidence.fileName}</div>
                    </div>
                  </TableCell>
                  <TableCell>{evidence.fileType || '-'}</TableCell>
                  <TableCell>{formatFileSize(evidence.fileSize)}</TableCell>
                  <TableCell>
                    {evidence.description ? (
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {evidence.description}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>{new Date(evidence.uploadedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDownload(evidence)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(evidence)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(evidence.id)}
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
