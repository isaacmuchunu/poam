"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { WithPermission } from '@/components/auth/permission-guard';
import { Plus, Search, Filter, Download, Eye, Edit, Trash2, FileText, CheckSquare } from 'lucide-react';

interface AuditTemplate {
  id: string;
  name: string;
  description: string;
  frameworkType: 'ISO27001' | 'NIST' | 'SOC2' | 'PCI_DSS' | 'GDPR';
  version: string;
  controls: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  industryVertical?: string;
  isGlobal: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ActionPlanTemplate {
  id: string;
  name: string;
  description: string;
  industryVertical: string;
  frameworkType?: string;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  estimatedDuration?: number;
  complexity?: 'low' | 'medium' | 'high';
  isGlobal: boolean;
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
}

const frameworkColors = {
  ISO27001: 'bg-blue-100 text-blue-800',
  NIST: 'bg-green-100 text-green-800',
  SOC2: 'bg-purple-100 text-purple-800',
  PCI_DSS: 'bg-orange-100 text-orange-800',
  GDPR: 'bg-red-100 text-red-800',
};

const complexityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function TemplatesPage() {
  const [auditTemplates, setAuditTemplates] = useState<AuditTemplate[]>([]);
  const [actionPlanTemplates, setActionPlanTemplates] = useState<ActionPlanTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [includeGlobal, setIncludeGlobal] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<AuditTemplate | ActionPlanTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, [selectedFramework, selectedIndustry, includeGlobal]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      
      // Fetch audit templates
      const auditParams = new URLSearchParams();
      if (selectedFramework !== 'all') auditParams.set('framework', selectedFramework);
      if (selectedIndustry !== 'all') auditParams.set('industry', selectedIndustry);
      if (includeGlobal) auditParams.set('includeGlobal', 'true');

      const auditResponse = await fetch(`/api/templates/audit?${auditParams}`);
      const auditData = await auditResponse.json();
      
      // Fetch action plan templates
      const actionParams = new URLSearchParams();
      if (selectedIndustry !== 'all') actionParams.set('industry', selectedIndustry);
      if (selectedFramework !== 'all') actionParams.set('framework', selectedFramework);
      if (includeGlobal) actionParams.set('includeGlobal', 'true');

      const actionResponse = await fetch(`/api/templates/action-plans?${actionParams}`);
      const actionData = await actionResponse.json();

      setAuditTemplates(auditData.templates || []);
      setActionPlanTemplates(actionData.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAuditTemplates = auditTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.frameworkType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredActionPlanTemplates = actionPlanTemplates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.industryVertical.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUseTemplate = async (template: AuditTemplate | ActionPlanTemplate, type: 'audit' | 'action-plan') => {
    // TODO: Implement template usage logic
    console.log('Using template:', template, 'Type:', type);
  };

  const handleEditTemplate = (template: AuditTemplate | ActionPlanTemplate) => {
    // TODO: Implement template editing
    console.log('Editing template:', template);
  };

  const handleDeleteTemplate = async (templateId: string, type: 'audit' | 'action-plan') => {
    // TODO: Implement template deletion
    console.log('Deleting template:', templateId, 'Type:', type);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-muted-foreground">
            Pre-built audit and action plan templates for compliance frameworks
          </p>
        </div>
        <div className="flex gap-2">
          <WithPermission permission="write:templates">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
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
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedFramework} onValueChange={setSelectedFramework}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="ISO27001">ISO 27001</SelectItem>
                <SelectItem value="NIST">NIST</SelectItem>
                <SelectItem value="SOC2">SOC 2</SelectItem>
                <SelectItem value="PCI_DSS">PCI DSS</SelectItem>
                <SelectItem value="GDPR">GDPR</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="healthcare">Healthcare</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="manufacturing">Manufacturing</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setIncludeGlobal(!includeGlobal)}
              className={includeGlobal ? 'bg-primary text-primary-foreground' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Global Templates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Templates Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit">
            <FileText className="h-4 w-4 mr-2" />
            Audit Templates ({filteredAuditTemplates.length})
          </TabsTrigger>
          <TabsTrigger value="action-plans">
            <CheckSquare className="h-4 w-4 mr-2" />
            Action Plan Templates ({filteredActionPlanTemplates.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAuditTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge className={frameworkColors[template.frameworkType]}>
                            {template.frameworkType}
                          </Badge>
                          <Badge variant="outline">v{template.version}</Badge>
                          {template.isGlobal && <Badge variant="secondary">Global</Badge>}
                          {template.isCustom && <Badge variant="outline">Custom</Badge>}
                        </div>
                      </div>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {template.controls.length} controls
                        {template.industryVertical && ` • ${template.industryVertical}`}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template, 'audit')}
                        >
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <WithPermission permission="write:templates">
                          {template.isCustom && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTemplate(template.id, 'audit')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </WithPermission>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="action-plans" className="space-y-4">
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActionPlanTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex gap-2">
                          <Badge variant="outline">{template.industryVertical}</Badge>
                          {template.complexity && (
                            <Badge className={complexityColors[template.complexity]}>
                              {template.complexity}
                            </Badge>
                          )}
                          {template.isGlobal && <Badge variant="secondary">Global</Badge>}
                          {template.isCustom && <Badge variant="outline">Custom</Badge>}
                        </div>
                      </div>
                    </div>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        {template.tasks.length} tasks
                        {template.estimatedDuration && ` • ${template.estimatedDuration} days`}
                        {template.frameworkType && ` • ${template.frameworkType}`}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleUseTemplate(template, 'action-plan')}
                        >
                          Use Template
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedTemplate(template)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </Button>
                        <WithPermission permission="write:templates">
                          {template.isCustom && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditTemplate(template)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteTemplate(template.id, 'action-plan')}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </WithPermission>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Template Preview Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              {'controls' in selectedTemplate ? (
                // Audit template preview
                <div>
                  <h3 className="font-semibold mb-2">Controls ({selectedTemplate.controls.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedTemplate.controls.map((control) => (
                      <Card key={control.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium">{control.name}</h4>
                              <p className="text-sm text-muted-foreground">{control.description}</p>
                              <div className="flex gap-2">
                                <Badge variant="outline">{control.category}</Badge>
                                <Badge variant={control.priority === 'critical' ? 'destructive' : 'secondary'}>
                                  {control.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // Action plan template preview
                <div>
                  <h3 className="font-semibold mb-2">Tasks ({selectedTemplate.tasks.length})</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedTemplate.tasks.map((task) => (
                      <Card key={task.id}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-medium">{task.name}</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                              <div className="flex gap-2">
                                <Badge variant="outline">{task.category}</Badge>
                                <Badge variant={task.priority === 'critical' ? 'destructive' : 'secondary'}>
                                  {task.priority}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}