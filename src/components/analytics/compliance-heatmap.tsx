"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Download,
  Filter
} from 'lucide-react';

interface ComplianceData {
  controlId: string;
  controlName: string;
  framework: string;
  category: string;
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_assessed';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  completionPercentage: number;
  lastAssessed: string;
  assignee?: string;
  poamCount: number;
  evidenceCount: number;
  trend: 'improving' | 'declining' | 'stable';
  trendPercentage: number;
}

interface HeatmapProps {
  data: ComplianceData[];
  framework?: string;
  onControlClick?: (control: ComplianceData) => void;
}

const statusColors = {
  compliant: 'bg-green-500',
  partially_compliant: 'bg-yellow-500',
  non_compliant: 'bg-red-500',
  not_assessed: 'bg-gray-300',
};

const statusLabels = {
  compliant: 'Compliant',
  partially_compliant: 'Partially Compliant',
  non_compliant: 'Non-Compliant',
  not_assessed: 'Not Assessed',
};

const riskColors = {
  low: 'border-green-200',
  medium: 'border-yellow-200',
  high: 'border-orange-200',
  critical: 'border-red-200',
};

export function ComplianceHeatmap({ data, framework, onControlClick }: HeatmapProps) {
  const [selectedFramework, setSelectedFramework] = useState<string>(framework || 'all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'matrix'>('grid');

  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (selectedFramework !== 'all' && item.framework !== selectedFramework) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      return true;
    });
  }, [data, selectedFramework, selectedCategory]);

  const frameworks = useMemo(() => {
    return Array.from(new Set(data.map(item => item.framework)));
  }, [data]);

  const categories = useMemo(() => {
    return Array.from(new Set(data.map(item => item.category)));
  }, [data]);

  const complianceStats = useMemo(() => {
    const total = filteredData.length;
    const compliant = filteredData.filter(item => item.status === 'compliant').length;
    const partiallyCompliant = filteredData.filter(item => item.status === 'partially_compliant').length;
    const nonCompliant = filteredData.filter(item => item.status === 'non_compliant').length;
    const notAssessed = filteredData.filter(item => item.status === 'not_assessed').length;

    return {
      total,
      compliant,
      partiallyCompliant,
      nonCompliant,
      notAssessed,
      complianceRate: total > 0 ? Math.round(((compliant + partiallyCompliant * 0.5) / total) * 100) : 0,
    };
  }, [filteredData]);

  const riskDistribution = useMemo(() => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    filteredData.forEach(item => {
      if (item.status !== 'compliant') {
        distribution[item.riskLevel]++;
      }
    });
    return distribution;
  }, [filteredData]);

  const getTrendIcon = (trend: string, percentage: number) => {
    if (trend === 'improving') {
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    } else if (trend === 'declining') {
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    }
    return <Minus className="h-3 w-3 text-gray-400" />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'non_compliant':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'partially_compliant':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Control ID', 'Control Name', 'Framework', 'Category', 'Status', 'Risk Level', 'Completion %', 'POA&M Count', 'Evidence Count', 'Last Assessed'].join(','),
      ...filteredData.map(item => [
        item.controlId,
        `"${item.controlName}"`,
        item.framework,
        item.category,
        item.status,
        item.riskLevel,
        item.completionPercentage,
        item.poamCount,
        item.evidenceCount,
        item.lastAssessed
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-heatmap-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-4">
          <Select value={selectedFramework} onValueChange={setSelectedFramework}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Frameworks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frameworks</SelectItem>
              {frameworks.map(fw => (
                <SelectItem key={fw} value={fw}>{fw}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="matrix">Matrix</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceStats.complianceRate}%</div>
            <div className="text-xs text-muted-foreground">
              {complianceStats.compliant} of {complianceStats.total} controls
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High Risk Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {riskDistribution.high + riskDistribution.critical}
            </div>
            <div className="text-xs text-muted-foreground">
              {riskDistribution.critical} critical, {riskDistribution.high} high
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{complianceStats.nonCompliant}</div>
            <div className="text-xs text-muted-foreground">
              Require immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Not Assessed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{complianceStats.notAssessed}</div>
            <div className="text-xs text-muted-foreground">
              Pending assessment
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Heatmap</CardTitle>
          <CardDescription>
            Visual representation of compliance status across all controls
          </CardDescription>
        </CardHeader>
        <CardContent>
          {viewMode === 'grid' ? (
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {filteredData.map((item) => (
                <TooltipProvider key={item.controlId}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          relative p-3 rounded border-2 cursor-pointer transition-all hover:scale-105 hover:shadow-md
                          ${statusColors[item.status]} ${riskColors[item.riskLevel]}
                        `}
                        onClick={() => onControlClick?.(item)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-white font-bold">
                            {item.controlId}
                          </span>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(item.trend, item.trendPercentage)}
                            {item.poamCount > 0 && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {item.poamCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-white opacity-90 truncate">
                          {item.controlName}
                        </div>
                        <div className="absolute bottom-1 right-1">
                          <div className="text-xs text-white font-bold">
                            {item.completionPercentage}%
                          </div>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-2">
                        <div className="font-medium">{item.controlName}</div>
                        <div className="text-sm">
                          <div>Status: {statusLabels[item.status]}</div>
                          <div>Risk: {item.riskLevel}</div>
                          <div>Completion: {item.completionPercentage}%</div>
                          <div>POA&M Items: {item.poamCount}</div>
                          <div>Evidence: {item.evidenceCount}</div>
                          <div>Last Assessed: {new Date(item.lastAssessed).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            // Matrix view - organized by framework and category
            <div className="space-y-6">
              {frameworks.filter(fw => selectedFramework === 'all' || selectedFramework === fw).map(fw => (
                <div key={fw}>
                  <h3 className="font-medium mb-3">{fw}</h3>
                  <div className="space-y-2">
                    {categories.filter(cat => 
                      filteredData.some(item => item.framework === fw && item.category === cat)
                    ).map(category => (
                      <div key={category} className="flex items-center gap-2">
                        <div className="w-32 text-sm font-medium truncate">{category}</div>
                        <div className="flex gap-1 flex-wrap">
                          {filteredData
                            .filter(item => item.framework === fw && item.category === category)
                            .map(item => (
                              <TooltipProvider key={item.controlId}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div
                                      className={`
                                        w-8 h-8 rounded cursor-pointer transition-all hover:scale-110
                                        ${statusColors[item.status]} border-2 ${riskColors[item.riskLevel]}
                                        flex items-center justify-center
                                      `}
                                      onClick={() => onControlClick?.(item)}
                                    >
                                      <span className="text-xs text-white font-bold">
                                        {item.controlId.slice(-2)}
                                      </span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <div className="space-y-1">
                                      <div className="font-medium">{item.controlId}</div>
                                      <div className="text-sm">{item.controlName}</div>
                                      <div className="text-xs">
                                        {statusLabels[item.status]} - {item.completionPercentage}%
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2 text-sm">Compliance Status</h4>
              <div className="space-y-2">
                {Object.entries(statusColors).map(([status, color]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded ${color}`} />
                    <span className="text-sm">{statusLabels[status as keyof typeof statusLabels]}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-sm">Risk Level (Border)</h4>
              <div className="space-y-2">
                {Object.entries(riskColors).map(([risk, borderClass]) => (
                  <div key={risk} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded bg-gray-200 border-2 ${borderClass}`} />
                    <span className="text-sm capitalize">{risk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}