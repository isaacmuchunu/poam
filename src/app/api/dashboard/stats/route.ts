import { NextRequest, NextResponse } from 'next/server';
import { rateLimitMiddleware, cacheMiddleware } from '@/lib/middleware';
import { getTenantDbFromRequest } from '@/middleware/tenant';
import { poamItems, systems, frameworks } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';

// GET /api/dashboard/stats - Get dashboard statistics
export async function GET(req: NextRequest) {
  return rateLimitMiddleware(req, async (req) => {
    return cacheMiddleware(req, async (req) => {
      try {
        const tenantId = req.headers.get('x-tenant-id');
        
        if (!tenantId) {
          return NextResponse.json({ error: 'No tenant context' }, { status: 403 });
        }
        
        const db = getTenantDbFromRequest(req);
        
        // Get counts by status
        const statusCounts = await db
          .select({
            status: poamItems.status,
            count: sql<number>`count(*)`,
          })
          .from(poamItems)
          .where(eq(poamItems.organizationId, tenantId))
          .groupBy(poamItems.status);
        
        // Get counts by severity
        const severityCounts = await db
          .select({
            severity: poamItems.severityLevel,
            count: sql<number>`count(*)`,
          })
          .from(poamItems)
          .where(eq(poamItems.organizationId, tenantId))
          .groupBy(poamItems.severityLevel);
        
        // Get counts by system
        const systemCounts = await db
          .select({
            systemId: poamItems.systemAssetId,
            count: sql<number>`count(*)`,
          })
          .from(poamItems)
          .where(
            and(
              eq(poamItems.organizationId, tenantId),
              sql`${poamItems.systemAssetId} is not null`
            )
          )
          .groupBy(poamItems.systemAssetId);
        
        // Get system names
        const systemsData = await db
          .select({
            id: systems.id,
            name: systems.name,
          })
          .from(systems)
          .where(eq(systems.organizationId, tenantId));
        
        // Map system IDs to names
        const systemsMap = Object.fromEntries(
          systemsData.map(system => [system.id, system.name])
        );
        
        // Get counts by framework
        const frameworkCounts = await db
          .select({
            frameworkId: poamItems.complianceFrameworkId,
            count: sql<number>`count(*)`,
          })
          .from(poamItems)
          .where(
            and(
              eq(poamItems.organizationId, tenantId),
              sql`${poamItems.complianceFrameworkId} is not null`
            )
          )
          .groupBy(poamItems.complianceFrameworkId);
        
        // Get framework names
        const frameworksData = await db
          .select({
            id: frameworks.id,
            name: frameworks.name,
          })
          .from(frameworks)
          .where(eq(frameworks.organizationId, tenantId));
        
        // Map framework IDs to names
        const frameworksMap = Object.fromEntries(
          frameworksData.map(framework => [framework.id, framework.name])
        );
        
        // Get upcoming milestones
        const today = new Date();
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        
        const upcomingItems = await db
          .select({
            id: poamItems.id,
            weakness: poamItems.weakness,
            plannedCompletionDate: poamItems.plannedCompletionDate,
            severityLevel: poamItems.severityLevel,
          })
          .from(poamItems)
          .where(
            and(
              eq(poamItems.organizationId, tenantId),
              eq(poamItems.status, 'in_progress'),
              sql`${poamItems.plannedCompletionDate} <= ${thirtyDaysFromNow}`
            )
          )
          .limit(5);
        
        return NextResponse.json({
          statusCounts,
          severityCounts,
          systemCounts: systemCounts.map(item => ({
            ...item,
            systemName: systemsMap[item.systemId as string] || 'Unknown',
          })),
          frameworkCounts: frameworkCounts.map(item => ({
            ...item,
            frameworkName: frameworksMap[item.frameworkId as string] || 'Unknown',
          })),
          upcomingItems,
          totalItems: statusCounts.reduce((sum, item) => sum + item.count, 0),
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
      }
    }, {
      ttl: 300, // Cache for 5 minutes
      cacheKey: 'dashboard-stats',
    });
  });
}
