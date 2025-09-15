"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { WithPermission } from '@/components/auth/permission-guard';
import { 
  Shield, 
  Key, 
  Activity, 
  AlertTriangle, 
  Users, 
  Monitor,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Settings,
  Download,
  Search,
  Filter,
  Clock,
  MapPin,
  Smartphone,
  Globe,
  Ban,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  userId: string;
  userName: string;
  eventType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
}

interface ActiveSession {
  id: string;
  userId: string;
  userName: string;
  ipAddress: string;
  location?: string;
  device: string;
  browser: string;
  lastActivity: string;
  createdAt: string;
  isCurrentSession: boolean;
}

interface SecuritySettings {
  sessionTimeout: number;
  maxConcurrentSessions: number;
  ipWhitelistingEnabled: boolean;
  mfaRequired: boolean;
  passwordPolicyEnabled: boolean;
  auditLogRetention: number;
  allowedIPs: string[];
}

interface AuditLogEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress: string;
  timestamp: string;
  details?: any;
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [newAllowedIP, setNewAllowedIP] = useState('');

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      
      // Fetch security events
      const eventsResponse = await fetch('/api/security/events');
      const eventsData = await eventsResponse.json();
      setSecurityEvents(eventsData.events || []);

      // Fetch active sessions
      const sessionsResponse = await fetch('/api/security/sessions');
      const sessionsData = await sessionsResponse.json();
      setActiveSessions(sessionsData.sessions || []);

      // Fetch audit logs
      const auditResponse = await fetch('/api/security/audit-logs');
      const auditData = await auditResponse.json();
      setAuditLogs(auditData.logs || []);

      // Fetch security settings
      const settingsResponse = await fetch('/api/security/settings');
      const settingsData = await settingsResponse.json();
      setSecuritySettings(settingsData);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await fetch(`/api/security/sessions/${sessionId}`, {
        method: 'DELETE',
      });
      fetchSecurityData();
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  };

  const handleUpdateSecuritySettings = async (updates: Partial<SecuritySettings>) => {
    try {
      const response = await fetch('/api/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        setSecuritySettings(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating security settings:', error);
    }
  };

  const handleAddAllowedIP = async () => {
    if (!newAllowedIP.trim()) return;
    
    try {
      await fetch('/api/security/allowed-ips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipAddress: newAllowedIP }),
      });
      
      setNewAllowedIP('');
      fetchSecurityData();
    } catch (error) {
      console.error('Error adding allowed IP:', error);
    }
  };

  const handleRemoveAllowedIP = async (ipAddress: string) => {
    try {
      await fetch(`/api/security/allowed-ips/${encodeURIComponent(ipAddress)}`, {
        method: 'DELETE',
      });
      
      fetchSecurityData();
    } catch (error) {
      console.error('Error removing allowed IP:', error);
    }
  };

  const handleUpdateEventStatus = async (eventId: string, status: SecurityEvent['status']) => {
    try {
      await fetch(`/api/security/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      
      setSecurityEvents(events => 
        events.map(event => 
          event.id === eventId ? { ...event, status } : event
        )
      );
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string) => {
    const colors = {
      open: 'bg-red-100 text-red-800',
      investigating: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      false_positive: 'bg-gray-100 text-gray-800',
    };
    return colors[status as keyof typeof colors] || colors.open;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatLastActivity = (dateString: string) => {
    const diff = Date.now() - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const filteredEvents = securityEvents.filter(event => {
    if (searchTerm && !event.description.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !event.userName.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (eventFilter !== 'all' && event.eventType !== eventFilter) return false;
    if (severityFilter !== 'all' && event.severity !== severityFilter) return false;
    return true;
  });

  const criticalEvents = securityEvents.filter(e => e.severity === 'critical' && e.status === 'open').length;
  const highEvents = securityEvents.filter(e => e.severity === 'high' && e.status === 'open').length;
  const totalSessions = activeSessions.length;
  const suspiciousSessions = activeSessions.filter(s => 
    s.location && !s.location.includes('US') // Example suspicious location logic
  ).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor security events, manage sessions, and configure security policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
          <WithPermission permission="write:settings">
            <Button>
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </WithPermission>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalEvents}</div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{highEvents}</div>
            <p className="text-xs text-muted-foreground">
              High severity events
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activity</CardTitle>
            <Monitor className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{suspiciousSessions}</div>
            <p className="text-xs text-muted-foreground">
              Flagged sessions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="sessions">
            <Users className="h-4 w-4 mr-2" />
            Active Sessions
          </TabsTrigger>
          <TabsTrigger value="audit">
            <Activity className="h-4 w-4 mr-2" />
            Audit Logs
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search events..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="LOGIN_FAILURE">Login Failure</SelectItem>
                    <SelectItem value="IP_CHANGE">IP Change</SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">Suspicious Activity</SelectItem>
                    <SelectItem value="POLICY_VIOLATION">Policy Violation</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={setSeverityFilter}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severity</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Security Events List */}
          <Card>
            <CardHeader>
              <CardTitle>Security Events ({filteredEvents.length})</CardTitle>
              <CardDescription>Recent security events and threats</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(event.severity)} variant="outline">
                          {event.severity}
                        </Badge>
                        <Badge className={getStatusColor(event.status)} variant="outline">
                          {event.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">{event.eventType}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-1">{event.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          <span>{event.userName}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {event.status === 'open' && (
                        <Select
                          value={event.status}
                          onValueChange={(value) => handleUpdateEventStatus(event.id, value as SecurityEvent['status'])}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="investigating">Investigating</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="false_positive">False Positive</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                ))}
                
                {filteredEvents.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No security events found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions ({activeSessions.length})</CardTitle>
              <CardDescription>Currently active user sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">{session.userName}</span>
                        {session.isCurrentSession && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            Current Session
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{session.ipAddress}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          <span>{session.location || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Smartphone className="h-3 w-3" />
                          <span>{session.device}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Last active: {formatLastActivity(session.lastActivity)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!session.isCurrentSession && (
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleTerminateSession(session.id)}
                        >
                          <Ban className="h-3 w-3 mr-1" />
                          Terminate
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {activeSessions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No active sessions</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>System activity and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.slice(0, 50).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{log.action}</span>
                        <Badge variant="outline">{log.entityType}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{log.userName}</span>
                        <span>{log.ipAddress}</span>
                        <span>{formatDate(log.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <WithPermission permission="write:settings">
            {securitySettings && (
              <>
                {/* General Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>General Security Settings</CardTitle>
                    <CardDescription>Configure system-wide security policies</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Multi-Factor Authentication</label>
                        <p className="text-xs text-gray-500">Require MFA for all users</p>
                      </div>
                      <Switch
                        checked={securitySettings.mfaRequired}
                        onCheckedChange={(checked) => 
                          handleUpdateSecuritySettings({ mfaRequired: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">IP Whitelisting</label>
                        <p className="text-xs text-gray-500">Restrict access to allowed IP addresses</p>
                      </div>
                      <Switch
                        checked={securitySettings.ipWhitelistingEnabled}
                        onCheckedChange={(checked) => 
                          handleUpdateSecuritySettings({ ipWhitelistingEnabled: checked })
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium">Password Policy</label>
                        <p className="text-xs text-gray-500">Enforce strong password requirements</p>
                      </div>
                      <Switch
                        checked={securitySettings.passwordPolicyEnabled}
                        onCheckedChange={(checked) => 
                          handleUpdateSecuritySettings({ passwordPolicyEnabled: checked })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Session Timeout (minutes)</label>
                        <Input
                          type="number"
                          value={Math.floor(securitySettings.sessionTimeout / 60)}
                          onChange={(e) => 
                            handleUpdateSecuritySettings({ 
                              sessionTimeout: parseInt(e.target.value) * 60 
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Max Concurrent Sessions</label>
                        <Input
                          type="number"
                          value={securitySettings.maxConcurrentSessions}
                          onChange={(e) => 
                            handleUpdateSecuritySettings({ 
                              maxConcurrentSessions: parseInt(e.target.value) 
                            })
                          }
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IP Whitelist Management */}
                {securitySettings.ipWhitelistingEnabled && (
                  <Card>
                    <CardHeader>
                      <CardTitle>IP Whitelist</CardTitle>
                      <CardDescription>Manage allowed IP addresses and ranges</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter IP address or CIDR range (e.g., 192.168.1.0/24)"
                          value={newAllowedIP}
                          onChange={(e) => setNewAllowedIP(e.target.value)}
                        />
                        <Button onClick={handleAddAllowedIP}>
                          Add IP
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {securitySettings.allowedIPs.map((ip, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded">
                            <span className="font-mono text-sm">{ip}</span>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRemoveAllowedIP(ip)}
                            >
                              <Ban className="h-3 w-3 mr-1" />
                              Remove
                            </Button>
                          </div>
                        ))}
                        
                        {securitySettings.allowedIPs.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No IP restrictions configured
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </WithPermission>
        </TabsContent>
      </Tabs>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Security Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Event Type</label>
                  <p className="text-sm">{selectedEvent.eventType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Badge className={getSeverityColor(selectedEvent.severity)} variant="outline">
                    {selectedEvent.severity}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">User</label>
                  <p className="text-sm">{selectedEvent.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Badge className={getStatusColor(selectedEvent.status)} variant="outline">
                    {selectedEvent.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">IP Address</label>
                  <p className="text-sm font-mono">{selectedEvent.ipAddress}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Timestamp</label>
                  <p className="text-sm">{formatDate(selectedEvent.timestamp)}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Description</label>
                <p className="text-sm bg-gray-50 p-3 rounded mt-1">{selectedEvent.description}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">User Agent</label>
                <p className="text-xs font-mono bg-gray-50 p-2 rounded mt-1">{selectedEvent.userAgent}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}