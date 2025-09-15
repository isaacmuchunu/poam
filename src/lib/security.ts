import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import crypto from 'crypto';

// Initialize Redis for session management
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

// Security configuration
const SECURITY_CONFIG = {
  sessionTimeout: 3600, // 1 hour in seconds
  maxConcurrentSessions: 3,
  passwordMinLength: 12,
  passwordRequirements: {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  },
  ipWhitelisting: process.env.NODE_ENV === 'production',
  encryptionAlgorithm: 'aes-256-gcm',
  auditLogRetention: 90, // days
};

// Encryption utilities
export class EncryptionService {
  private static readonly algorithm = SECURITY_CONFIG.encryptionAlgorithm;
  private static readonly key = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);

  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = (cipher as any).getAuthTag?.()?.toString('hex') || '';
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  static decrypt(encryptedData: { encrypted: string; iv: string; tag?: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.key);
    
    if (encryptedData.tag && (decipher as any).setAuthTag) {
      (decipher as any).setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    }
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  static generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}

// Session management
export class SessionManager {
  private static getSessionKey(userId: string, sessionId: string): string {
    return `session:${userId}:${sessionId}`;
  }

  private static getUserSessionsKey(userId: string): string {
    return `user_sessions:${userId}`;
  }

  static async createSession(userId: string, ipAddress: string, userAgent: string): Promise<string> {
    const sessionId = EncryptionService.generateSecureToken();
    const sessionKey = this.getSessionKey(userId, sessionId);
    
    const sessionData = {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      isActive: true,
    };

    // Store session
    await redis.setex(sessionKey, SECURITY_CONFIG.sessionTimeout, JSON.stringify(sessionData));
    
    // Track user sessions
    const userSessionsKey = this.getUserSessionsKey(userId);
    await redis.sadd(userSessionsKey, sessionId);
    
    // Enforce concurrent session limit
    await this.enforceSessionLimit(userId);
    
    return sessionId;
  }

  static async validateSession(userId: string, sessionId: string, ipAddress: string): Promise<boolean> {
    const sessionKey = this.getSessionKey(userId, sessionId);
    const sessionData = await redis.get(sessionKey);
    
    if (!sessionData) {
      return false;
    }

    const session = JSON.parse(sessionData as string);
    
    // Check if session is active and IP matches (if IP validation is enabled)
    if (!session.isActive) {
      return false;
    }

    // Check for suspicious IP changes (optional)
    if (process.env.NODE_ENV === 'production' && session.ipAddress !== ipAddress) {
      await this.logSecurityEvent(userId, 'IP_CHANGE', {
        originalIP: session.ipAddress,
        newIP: ipAddress,
        sessionId,
      });
      
      // Optionally invalidate session on IP change
      if (process.env.STRICT_IP_VALIDATION === 'true') {
        await this.invalidateSession(userId, sessionId);
        return false;
      }
    }

    // Update last activity
    session.lastActivity = new Date().toISOString();
    await redis.setex(sessionKey, SECURITY_CONFIG.sessionTimeout, JSON.stringify(session));
    
    return true;
  }

  static async invalidateSession(userId: string, sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(userId, sessionId);
    const userSessionsKey = this.getUserSessionsKey(userId);
    
    await redis.del(sessionKey);
    await redis.srem(userSessionsKey, sessionId);
  }

  static async invalidateAllSessions(userId: string): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    const sessionIds = await redis.smembers(userSessionsKey);
    
    if (sessionIds && sessionIds.length > 0) {
      const sessionKeys = sessionIds.map(id => this.getSessionKey(userId, id));
      await redis.del(...sessionKeys);
      await redis.del(userSessionsKey);
    }
  }

  private static async enforceSessionLimit(userId: string): Promise<void> {
    const userSessionsKey = this.getUserSessionsKey(userId);
    const sessionIds = await redis.smembers(userSessionsKey);
    
    if (sessionIds && sessionIds.length > SECURITY_CONFIG.maxConcurrentSessions) {
      // Remove oldest sessions
      const sessionsToRemove = sessionIds.length - SECURITY_CONFIG.maxConcurrentSessions;
      const oldestSessions = sessionIds.slice(0, sessionsToRemove);
      
      for (const sessionId of oldestSessions) {
        await this.invalidateSession(userId, sessionId);
      }
    }
  }

  private static async logSecurityEvent(userId: string, eventType: string, details: any): Promise<void> {
    const eventData = {
      userId,
      eventType,
      details,
      timestamp: new Date().toISOString(),
      severity: 'medium',
    };

    await redis.lpush('security_events', JSON.stringify(eventData));
  }
}

// Audit logging
export class AuditLogger {
  static async logAction(
    userId: string,
    organizationId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const logEntry = {
      userId,
      organizationId,
      action,
      entityType,
      entityId,
      details: details ? EncryptionService.encrypt(JSON.stringify(details)) : null,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
    };

    // Store in Redis for immediate access
    const logKey = `audit_log:${organizationId}:${Date.now()}:${crypto.randomUUID()}`;
    await redis.setex(logKey, 86400 * SECURITY_CONFIG.auditLogRetention, JSON.stringify(logEntry));

    // Also store in database for long-term retention
    try {
      await fetch('/api/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry),
      });
    } catch (error) {
      console.error('Failed to store audit log in database:', error);
    }
  }

  static async getAuditLogs(
    organizationId: string,
    filters: {
      userId?: string;
      action?: string;
      entityType?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
    }
  ): Promise<any[]> {
    // In production, this would query both Redis and database
    const pattern = `audit_log:${organizationId}:*`;
    const keys = await redis.keys(pattern);
    
    const logs = await Promise.all(
      keys.map(async (key) => {
        const data = await redis.get(key);
        return data ? JSON.parse(data as string) : null;
      })
    );

    return logs
      .filter(log => log !== null)
      .filter(log => {
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.action && log.action !== filters.action) return false;
        if (filters.entityType && log.entityType !== filters.entityType) return false;
        if (filters.startDate && new Date(log.timestamp) < new Date(filters.startDate)) return false;
        if (filters.endDate && new Date(log.timestamp) > new Date(filters.endDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, filters.limit || 100);
  }
}

// Security middleware
export async function securityMiddleware(req: NextRequest): Promise<NextResponse | null> {
  const { userId, orgId } = await auth();
  
  if (!userId || !orgId) {
    return null; // Let authentication middleware handle this
  }

  const ipAddress = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = req.headers.get('user-agent') || 'unknown';
  
  // Rate limiting is handled by existing middleware
  
  // Session validation for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    const sessionId = req.headers.get('x-session-id');
    
    if (sessionId) {
      const isValidSession = await SessionManager.validateSession(userId, sessionId, ipAddress);
      if (!isValidSession) {
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
      }
    }
  }

  // Log API access
  if (req.method !== 'GET' && req.nextUrl.pathname.startsWith('/api/')) {
    await AuditLogger.logAction(
      userId,
      orgId,
      `API_${req.method}`,
      'api_endpoint',
      req.nextUrl.pathname,
      {
        method: req.method,
        path: req.nextUrl.pathname,
        query: Object.fromEntries(req.nextUrl.searchParams),
      },
      ipAddress,
      userAgent
    );
  }

  return null;
}

// Data sanitization
export class DataSanitizer {
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      // Remove potentially dangerous characters
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>?/gm, '')
        .trim();
    }
    
    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        sanitized[this.sanitizeInput(key)] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return input;
  }

  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePassword(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      errors.push(`Password must be at least ${SECURITY_CONFIG.passwordMinLength} characters long`);
    }
    
    if (SECURITY_CONFIG.passwordRequirements.uppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (SECURITY_CONFIG.passwordRequirements.lowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (SECURITY_CONFIG.passwordRequirements.numbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (SECURITY_CONFIG.passwordRequirements.symbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// IP filtering
export class IPFilter {
  private static async getAllowedIPs(organizationId: string): Promise<string[]> {
    const allowedIPs = await redis.get(`allowed_ips:${organizationId}`);
    return allowedIPs ? JSON.parse(allowedIPs as string) : [];
  }

  static async isIPAllowed(organizationId: string, ipAddress: string): Promise<boolean> {
    if (!SECURITY_CONFIG.ipWhitelisting) {
      return true; // IP filtering disabled
    }

    const allowedIPs = await this.getAllowedIPs(organizationId);
    
    if (allowedIPs.length === 0) {
      return true; // No restrictions if no IPs are configured
    }

    // Check for exact match or CIDR range match
    return allowedIPs.some(allowedIP => {
      if (allowedIP.includes('/')) {
        // CIDR range check (simplified)
        const [network, prefixLength] = allowedIP.split('/');
        // In production, use a proper CIDR matching library
        return ipAddress.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
      }
      return allowedIP === ipAddress;
    });
  }

  static async addAllowedIP(organizationId: string, ipAddress: string): Promise<void> {
    const allowedIPs = await this.getAllowedIPs(organizationId);
    if (!allowedIPs.includes(ipAddress)) {
      allowedIPs.push(ipAddress);
      await redis.set(`allowed_ips:${organizationId}`, JSON.stringify(allowedIPs));
    }
  }

  static async removeAllowedIP(organizationId: string, ipAddress: string): Promise<void> {
    const allowedIPs = await this.getAllowedIPs(organizationId);
    const filtered = allowedIPs.filter(ip => ip !== ipAddress);
    await redis.set(`allowed_ips:${organizationId}`, JSON.stringify(filtered));
  }
}

export { SECURITY_CONFIG };