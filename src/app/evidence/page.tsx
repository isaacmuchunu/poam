'use client';

import React, { useState, useEffect } from 'react';
import { EvidenceForm } from '@/components/evidence/evidence-form';
import { EvidenceTable } from '@/components/evidence/evidence-table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

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

interface PoamItem {
  id: string;
  weakness: string;
}

export default function EvidencePage() {
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [poamItems, setPoamItems] = useState<PoamItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState<EvidenceFile | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEvidenceFiles();
    fetchPoamItems();
  }, []);

  const fetchEvidenceFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/evidence');
      if (response.ok) {
        const data = await response.json();
        setEvidenceFiles(data);
      } else {
        console.error('Failed to fetch evidence files');
      }
    } catch (error) {
      console.error('Error fetching evidence files:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPoamItems = async () => {
    try {
      const response = await fetch('/api/poam');
      if (response.ok) {
        const data = await response.json();
        setPoamItems(data.map((item: any) => ({ id: item.id, weakness: item.weakness })));
      }
    } catch (error) {
      console.error('Error fetching POA&M items:', error);
    }
  };

  const handleCreate = () => {
    setEditingEvidence(null);
    setShowForm(true);
  };

  const handleEdit = (evidence: EvidenceFile) => {
    setEditingEvidence(evidence);
    setShowForm(true);
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      
      if (editingEvidence) {
        // Update existing evidence file metadata
        const response = await fetch(`/api/evidence/${editingEvidence.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: data.fileName,
            description: data.description,
          }),
        });

        if (response.ok) {
          await fetchEvidenceFiles();
          setShowForm(false);
          setEditingEvidence(null);
        } else {
          console.error('Failed to update evidence file');
        }
      } else {
        // Create new evidence file
        // In a real implementation, you would upload the file to storage first
        const mockStorageUrl = `https://storage.example.com/evidence/${Date.now()}-${data.fileName}`;
        
        const response = await fetch('/api/evidence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: data.fileName,
            fileType: data.file?.type,
            fileSize: data.file?.size,
            description: data.description,
            poamItemId: data.poamItemId,
            storageUrl: mockStorageUrl,
          }),
        });

        if (response.ok) {
          await fetchEvidenceFiles();
          setShowForm(false);
        } else {
          console.error('Failed to create evidence file');
        }
      }
    } catch (error) {
      console.error('Error saving evidence file:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (confirm('Are you sure you want to delete this evidence file?')) {
      try {
        const response = await fetch(`/api/evidence/${evidenceId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchEvidenceFiles();
        } else {
          console.error('Failed to delete evidence file');
        }
      } catch (error) {
        console.error('Error deleting evidence file:', error);
      }
    }
  };

  const handleDownload = (evidence: EvidenceFile) => {
    // In a real implementation, this would download the file
    window.open(evidence.storageUrl, '_blank');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvidence(null);
  };

  if (showForm) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Evidence Management</h1>
          <Button variant="outline" onClick={handleCancel}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
        
        <EvidenceForm
          initialData={editingEvidence || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
          poamItems={poamItems}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Evidence Management</h1>
      </div>
      
      <EvidenceTable
        evidenceFiles={evidenceFiles}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={handleCreate}
        onDownload={handleDownload}
        isLoading={isLoading}
      />
    </div>
  );
}
