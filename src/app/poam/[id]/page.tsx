'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EvidenceTable } from '@/components/evidence/evidence-table';
import { Edit, ArrowLeft, Calendar, User, AlertTriangle, Building, Shield } from 'lucide-react';
import Link from 'next/link';

interface PoamItem {
  id: string;
  creationDate: Date;
  securityControl: string;
  weakness: string;
  weaknessDescription?: string;
  sourceOfWeakness?: string;
  severityLevel: string;
  identificationMethod?: string;
  plannedStartDate?: Date;
  plannedCompletionDate?: Date;
  actualStartDate?: Date;
  actualCompletionDate?: Date;
  status: string;
  comments?: string;
  riskScore?: number;
  residualRisk?: number;
  tags?: string[];
  milestones?: any[];
  dependencies?: any[];
  costEstimate?: number;
}

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

export default function PoamDetailPage() {
  const params = useParams();
  const [poamItem, setPoamItem] = useState<PoamItem | null>(null);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPoamItem(params.id as string);
      fetchEvidenceFiles(params.id as string);
    }
  }, [params.id]);

  const fetchPoamItem = async (id: string) => {
    try {
      const response = await fetch(`/api/poam/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPoamItem(data);
      } else {
        console.error('Failed to fetch POA&M item');
      }
    } catch (error) {
      console.error('Error fetching POA&M item:', error);
    }
  };

  const fetchEvidenceFiles = async (poamItemId: string) => {
    try {
      const response = await fetch(`/api/evidence?poamItemId=${poamItemId}`);
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

  const getSeverityBadge = (severity: string) => {
    const variants = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Moderate: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-green-100 text-green-800 border-green-200',
    };
    
    return (
      <Badge className={variants[severity as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {severity}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'in_progress': 'bg-blue-100 text-blue-800',
      'completed': 'bg-green-100 text-green-800',
      'overdue': 'bg-red-100 text-red-800',
      'pending': 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleDownload = (evidence: EvidenceFile) => {
    window.open(evidence.storageUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/poam">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POA&M
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <p>Loading POA&M details...</p>
        </div>
      </div>
    );
  }

  if (!poamItem) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Link href="/poam">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POA&M
            </Button>
          </Link>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">POA&M item not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link href="/poam">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POA&M
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{poamItem.weakness}</h1>
            <p className="text-gray-600">{poamItem.securityControl}</p>
          </div>
        </div>
        <Button>
          <Edit className="h-4 w-4 mr-2" />
          Edit POA&M
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Severity Level</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{getSeverityBadge(poamItem.severityLevel)}</div>
            {poamItem.riskScore && (
              <p className="text-xs text-muted-foreground">Risk Score: {poamItem.riskScore}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{getStatusBadge(poamItem.status)}</div>
            <p className="text-xs text-muted-foreground">
              Created: {new Date(poamItem.creationDate).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Date</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {poamItem.plannedCompletionDate
                ? new Date(poamItem.plannedCompletionDate).toLocaleDateString()
                : 'Not Set'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {poamItem.actualCompletionDate
                ? `Completed: ${new Date(poamItem.actualCompletionDate).toLocaleDateString()}`
                : 'In Progress'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="evidence">Evidence ({evidenceFiles.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weakness Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Weakness</label>
                  <p className="mt-1">{poamItem.weakness}</p>
                </div>
                
                {poamItem.weaknessDescription && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-600">{poamItem.weaknessDescription}</p>
                  </div>
                )}
                
                {poamItem.sourceOfWeakness && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Source of Weakness</label>
                    <p className="mt-1">{poamItem.sourceOfWeakness}</p>
                  </div>
                )}
                
                {poamItem.identificationMethod && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Identification Method</label>
                    <p className="mt-1">{poamItem.identificationMethod}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Timeline & Dates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Creation Date</label>
                  <p className="mt-1">{new Date(poamItem.creationDate).toLocaleDateString()}</p>
                </div>
                
                {poamItem.plannedStartDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Planned Start Date</label>
                    <p className="mt-1">{new Date(poamItem.plannedStartDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {poamItem.plannedCompletionDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Planned Completion Date</label>
                    <p className="mt-1">{new Date(poamItem.plannedCompletionDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {poamItem.actualStartDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Actual Start Date</label>
                    <p className="mt-1">{new Date(poamItem.actualStartDate).toLocaleDateString()}</p>
                  </div>
                )}
                
                {poamItem.actualCompletionDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Actual Completion Date</label>
                    <p className="mt-1">{new Date(poamItem.actualCompletionDate).toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {poamItem.comments && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{poamItem.comments}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="evidence">
          <EvidenceTable
            evidenceFiles={evidenceFiles}
            onEdit={() => {}}
            onDelete={() => {}}
            onCreate={() => {}}
            onDownload={handleDownload}
            isLoading={false}
          />
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Timeline & Milestones</CardTitle>
              <CardDescription>Track progress and key milestones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {poamItem.milestones && poamItem.milestones.length > 0 ? (
                  poamItem.milestones.map((milestone, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div>
                        <h4 className="font-medium">{milestone.title || `Milestone ${index + 1}`}</h4>
                        <p className="text-sm text-gray-600">{milestone.description}</p>
                        {milestone.dueDate && (
                          <p className="text-xs text-gray-500">Due: {new Date(milestone.dueDate).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No milestones defined.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dependencies">
          <Card>
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
              <CardDescription>Items that this POA&M depends on or that depend on this item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {poamItem.dependencies && poamItem.dependencies.length > 0 ? (
                  poamItem.dependencies.map((dependency, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{dependency.title || `Dependency ${index + 1}`}</h4>
                      <p className="text-sm text-gray-600">{dependency.description}</p>
                      <p className="text-xs text-gray-500">Type: {dependency.type || 'Unknown'}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No dependencies defined.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
