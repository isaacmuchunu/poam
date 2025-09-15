import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_TOKEN || '',
});

// Define rate limits based on subscription tier
const rateLimits = {
  free: { points: 50, duration: 60 }, // 50 requests per minute
  professional: { points: 200, duration: 60 }, // 200 requests per minute
  enterprise: { points: 1000, duration: 60 } // 1000 requests per minute
};

// Get tenant-specific Redis client
const getTenantRedisClient = (tenantId: string) => {
  return {
    get: async (key: string) => redis.get(`tenant:${tenantId}:${key}`),
    set: async (key: string, value: unknown, options?: { ex?: number }) => 
      redis.set(`tenant:${tenantId}:${key}`, value, options),
    del: async (key: string) => redis.del(`tenant:${tenantId}:${key}`),
    // Add other methods as needed
  };
};

// Rate limiting middleware
export async function rateLimitMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const tenantId = req.headers.get('x-tenant-id');
  
  if (!tenantId) {
    return handler(req);
  }
  
  // Default to free tier limits
  const tier = 'free'; // In production, fetch from database
  const limits = rateLimits[tier as keyof typeof rateLimits];
  
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limits.points, `${limits.duration} s`),
    analytics: true,
    prefix: `ratelimit:${tenantId}`
  });
  
  const identifier = `${tenantId}:${req.ip || 'unknown'}`;
  const { success, limit, reset, remaining } = await ratelimit.limit(identifier);
  
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests', limit, reset },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      }
    );
  }
  
  const response = await handler(req);
  
  // Add rate limit headers to response
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', reset.toString());
  
  return response;
}

// Cache middleware
export async function cacheMiddleware(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    ttl: number; // Time to live in seconds
    cacheKey: string;
  }
) {
  const tenantId = req.headers.get('x-tenant-id');
  
  if (!tenantId || req.method !== 'GET') {
    return handler(req);
  }
  
  const redis = getTenantRedisClient(tenantId);
  const cacheKey = options.cacheKey;
  
  // Try to get from cache
  const cachedData = await redis.get(cacheKey);
  
  if (cachedData) {
    return NextResponse.json(JSON.parse(cachedData as string));
  }
  
  // If not in cache, execute handler
  const response = await handler(req);
  
  // Only cache successful responses
  if (response.status === 200) {
    const responseData = await response.json();
    await redis.set(cacheKey, JSON.stringify(responseData), { ex: options.ttl });
    return NextResponse.json(responseData);
  }
  
  return response;
}
