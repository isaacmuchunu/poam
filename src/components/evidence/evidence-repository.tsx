"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WithPermission } from '@/components/auth/permission-guard';
import { 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Archive, 
  History, 
  Search, 
  Filter,
  FileText,
  Image,
  Video,
  FileIcon,
  Shield,
  Clock,
  User,
  Tag,
  Plus
} from 'lucide-react';

interface EvidenceItem {
  id: string;
  name: string;
  description?: string;
  category: 'policy' | 'procedure' | 'evidence' | 'screenshot' | 'document' | 'other';
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  storageUrl?: string;
  version: string;
  parentVersionId?: string;
  checksum?: string;
  uploadedById: string;
  uploadedByName?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewComments?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  retentionDate?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  versions?: EvidenceItem[];
  isLatestVersion?: boolean;
}

interface EvidenceRepositoryProps {
  poamItemId?: string;
  milestoneId?: string;
  taskId?: string;
}

const categoryIcons = {
  policy: FileText,
  procedure: FileText,
  evidence: Shield,
  screenshot: Image,
  document: FileIcon,
  other: FileIcon,
};

const categoryColors = {
  policy: 'bg-blue-100 text-blue-800',
  procedure: 'bg-green-100 text-green-800',
  evidence: 'bg-purple-100 text-purple-800',
  screenshot: 'bg-yellow-100 text-yellow-800',
  document: 'bg-gray-100 text-gray-800',
  other: 'bg-orange-100 text-orange-800',
};

const reviewStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export function EvidenceRepository({ poamItemId, milestoneId, taskId }: EvidenceRepositoryProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingVersion, setIsCreatingVersion] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [newEvidence, setNewEvidence] = useState({
    name: '',
    description: '',
    category: 'document' as EvidenceItem['category'],
    tags: [] as string[],
    retentionDate: '',
  });

  const [newVersion, setNewVersion] = useState({
    name: '',
    description: '',
    file: null as File | null,
  });

  useEffect(() => {
    fetchEvidence();
  }, [selectedCategory, selectedReviewStatus, selectedTags, includeArchived, poamItemId, milestoneId, taskId]);

  const fetchEvidence = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedReviewStatus !== 'all') params.set('reviewStatus', selectedReviewStatus);
      if (selectedTags.length > 0) params.set('tags', selectedTags.join(','));
      if (includeArchived) params.set('includeArchived', 'true');
      if (poamItemId) params.set('poamItemId', poamItemId);
      if (milestoneId) params.set('milestoneId', milestoneId);
      if (taskId) params.set('taskId', taskId);
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/evidence/repository?${params}`);
      const data = await response.json();
      
      setEvidence(data.evidence || []);
    } catch (error) {
      console.error('Error fetching evidence:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setIsUploading(true);
      
      const response = await fetch('/api/evidence/repository', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newEvidence,
          poamItemId,
          milestoneId,
          taskId,
          retentionDate: newEvidence.retentionDate || undefined,
        }),
      });

      if (response.ok) {
        setNewEvidence({
          name: '',
          description: '',
          category: 'document',
          tags: [],
          retentionDate: '',
        });
        fetchEvidence();
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!selectedEvidence) return;
    
    try {
      setIsCreatingVersion(true);
      
      const response = await fetch('/api/evidence/repository', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: selectedEvidence.id,
          name: newVersion.name || selectedEvidence.name,
          description: newVersion.description || selectedEvidence.description,
          // In production, handle file upload here
        }),
      });

      if (response.ok) {
        setNewVersion({ name: '', description: '', file: null });
        setIsCreatingVersion(false);
        fetchEvidence();
      }
    } catch (error) {
      console.error('Error creating version:', error);
    } finally {
      setIsCreatingVersion(false);
    }
  };

  const handleReview = async (evidenceId: string, status: 'approved' | 'rejected', comments?: string) => {
    try {
      const response = await fetch(`/api/evidence/repository/${evidenceId}/review`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewStatus: status, reviewComments: comments }),
      });

      if (response.ok) {
        fetchEvidence();
      }
    } catch (error) {
      console.error('Error reviewing evidence:', error);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return FileIcon;
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return Video;
    return FileIcon;
  };

  const filteredEvidence = evidence.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allTags = Array.from(new Set(evidence.flatMap(item => item.tags || [])));

  const renderEvidenceCard = (item: EvidenceItem) => {
    const CategoryIcon = categoryIcons[item.category];
    const FileIcon = getFileIcon(item.fileType);
    
    return (
      <Card key={item.id} className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-5 w-5 text-gray-500" />
              <div>
                <h4 className="font-medium text-sm">{item.name}</h4>
                <p className="text-xs text-gray-500">v{item.version}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Badge className={reviewStatusColors[item.reviewStatus]} variant="outline">
                {item.reviewStatus}
              </Badge>
              {item.versions && item.versions.length > 1 && (
                <Badge variant="outline" className="text-xs">
                  <History className="h-3 w-3 mr-1" />
                  {item.versions.length}
                </Badge>
              )}
            </div>
          </div>

          {item.description && (
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center justify-between mb-3">
            <Badge className={categoryColors[item.category]} variant="outline">
              {item.category}
            </Badge>
            {item.fileName && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <FileIcon className="h-3 w-3" />
                <span className="truncate max-w-24">{item.fileName}</span>
                {item.fileSize && <span>({formatFileSize(item.fileSize)})</span>}
              </div>
            )}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{item.uploadedByName || 'Unknown'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatDate(item.createdAt)}</span>
            </div>
          </div>

          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setSelectedEvidence(item)}>
              <Eye className="h-3 w-3 mr-1" />
              View
            </Button>
            {item.storageUrl && (
              <Button size="sm" variant="outline">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            )}
            <WithPermission permission="version:evidence">
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  setSelectedEvidence(item);
                  setIsCreatingVersion(true);
                }}
              >
                <History className="h-3 w-3 mr-1" />
                Version
              </Button>
            </WithPermission>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Evidence Repository</h2>
          <p className="text-muted-foreground">
            Centralized document management with version control
          </p>
        </div>
        <div className="flex gap-2">
          <WithPermission permission="write:evidence">
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Evidence
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload New Evidence</DialogTitle>
                  <DialogDescription>
                    Add a new document or evidence item to the repository
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={newEvidence.name}
                      onChange={(e) => setNewEvidence({ ...newEvidence, name: e.target.value })}
                      placeholder="Enter evidence name"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={newEvidence.description}
                      onChange={(e) => setNewEvidence({ ...newEvidence, description: e.target.value })}
                      placeholder="Enter description"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category</label>
                    <Select 
                      value={newEvidence.category} 
                      onValueChange={(value: any) => setNewEvidence({ ...newEvidence, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="policy">Policy</SelectItem>
                        <SelectItem value="procedure">Procedure</SelectItem>
                        <SelectItem value="evidence">Evidence</SelectItem>
                        <SelectItem value="screenshot">Screenshot</SelectItem>
                        <SelectItem value="document">Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Retention Date (Optional)</label>
                    <Input
                      type="date"
                      value={newEvidence.retentionDate}
                      onChange={(e) => setNewEvidence({ ...newEvidence, retentionDate: e.target.value })}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline">Cancel</Button>
                    <Button onClick={handleUpload} disabled={isUploading || !newEvidence.name}>
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </WithPermission>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search evidence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
                <SelectItem value="evidence">Evidence</SelectItem>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedReviewStatus} onValueChange={setSelectedReviewStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Review Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setIncludeArchived(!includeArchived)}
              className={includeArchived ? 'bg-primary text-primary-foreground' : ''}
            >
              <Archive className="h-4 w-4 mr-2" />
              Archived
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evidence Grid */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvidence.map(renderEvidenceCard)}
        </div>
      )}

      {/* Evidence Detail Dialog */}
      <Dialog open={!!selectedEvidence} onOpenChange={() => setSelectedEvidence(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedEvidence && React.createElement(categoryIcons[selectedEvidence.category], { className: "h-5 w-5" })}
              {selectedEvidence?.name}
              <Badge variant="outline">v{selectedEvidence?.version}</Badge>
            </DialogTitle>
            <DialogDescription>{selectedEvidence?.description}</DialogDescription>
          </DialogHeader>
          {selectedEvidence && (
            <div className="space-y-6">
              <Tabs defaultValue="details">
                <TabsList>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="versions">Version History</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Badge className={categoryColors[selectedEvidence.category]} variant="outline">
                        {selectedEvidence.category}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Review Status</label>
                      <Badge className={reviewStatusColors[selectedEvidence.reviewStatus]} variant="outline">
                        {selectedEvidence.reviewStatus}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Uploaded By</label>
                      <p className="text-sm">{selectedEvidence.uploadedByName || 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Upload Date</label>
                      <p className="text-sm">{formatDate(selectedEvidence.createdAt)}</p>
                    </div>
                  </div>

                  {selectedEvidence.tags && selectedEvidence.tags.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Tags</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEvidence.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedEvidence.checksum && (
                    <div>
                      <label className="text-sm font-medium">Checksum</label>
                      <p className="text-xs font-mono bg-gray-100 p-2 rounded">{selectedEvidence.checksum}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="versions">
                  {selectedEvidence.versions && selectedEvidence.versions.length > 1 ? (
                    <div className="space-y-2">
                      {selectedEvidence.versions.map((version, index) => (
                        <Card key={version.id}>
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">v{version.version}</span>
                                <span className="text-sm text-gray-500 ml-2">
                                  {formatDate(version.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {index === 0 && (
                                  <Badge variant="outline">Current</Badge>
                                )}
                                <Button size="sm" variant="outline">
                                  <Download className="h-3 w-3 mr-1" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No version history available</p>
                  )}
                </TabsContent>
                
                <TabsContent value="review">
                  <WithPermission permission="approve:evidence">
                    <div className="space-y-4">
                      {selectedEvidence.reviewStatus === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleReview(selectedEvidence.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Approve
                          </Button>
                          <Button 
                            onClick={() => handleReview(selectedEvidence.id, 'rejected')}
                            variant="destructive"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      {selectedEvidence.reviewComments && (
                        <div>
                          <label className="text-sm font-medium">Review Comments</label>
                          <p className="text-sm bg-gray-50 p-3 rounded mt-1">
                            {selectedEvidence.reviewComments}
                          </p>
                        </div>
                      )}
                    </div>
                  </WithPermission>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Version Dialog */}
      <Dialog open={isCreatingVersion} onOpenChange={setIsCreatingVersion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Version</DialogTitle>
            <DialogDescription>
              Create a new version of {selectedEvidence?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name (Optional)</label>
              <Input
                value={newVersion.name}
                onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                placeholder={selectedEvidence?.name}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                placeholder={selectedEvidence?.description}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">File</label>
              <Input
                type="file"
                onChange={(e) => setNewVersion({ ...newVersion, file: e.target.files?.[0] || null })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreatingVersion(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateVersion} disabled={isCreatingVersion}>
                {isCreatingVersion ? 'Creating...' : 'Create Version'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}