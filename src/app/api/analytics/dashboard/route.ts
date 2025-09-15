import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { poamItems, milestones, tasks, evidenceRepository, auditLogs, frameworks, systems } from '@/db/schema';
import { eq, and, gte, lte, count, sql, desc } from 'drizzle-orm';

// GET /api/analytics/dashboard - Get comprehensive analytics data
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const timeframe = url.searchParams.get('timeframe') || '30d';
    const framework = url.searchParams.get('framework') || 'all';

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch POA&M analytics
    const poamData = await db
      .select({
        id: poamItems.id,
        status: poamItems.status,
        severityLevel: poamItems.severityLevel,
        creationDate: poamItems.creationDate,
        plannedCompletionDate: poamItems.plannedCompletionDate,
        actualCompletionDate: poamItems.actualCompletionDate,
        riskScore: poamItems.riskScore,
      })
      .from(poamItems)
      .where(
        and(
          eq(poamItems.organizationId, orgId),
          gte(poamItems.creationDate, startDate)
        )
      );

    // Calculate POA&M statistics
    const totalPoam = poamData.length;
    const poamByStatus = poamData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const poamBySeverity = poamData.reduce((acc, item) => {
      if (!acc[item.severityLevel]) {
        acc[item.severityLevel] = { count: 0, totalDays: 0 };
      }
      acc[item.severityLevel].count++;
      
      if (item.actualCompletionDate && item.creationDate) {
        const days = Math.ceil(
          (new Date(item.actualCompletionDate).getTime() - new Date(item.creationDate).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        acc[item.severityLevel].totalDays += days;
      }
      
      return acc;
    }, {} as Record<string, { count: number; totalDays: number }>);

    const overduePoam = poamData.filter(item => 
      item.plannedCompletionDate && 
      new Date(item.plannedCompletionDate) < now && 
      item.status !== 'completed'
    ).length;

    const completedPoam = poamData.filter(item => item.status === 'completed').length;
    const completionRate = totalPoam > 0 ? Math.round((completedPoam / totalPoam) * 100) : 0;

    // Fetch evidence data
    const evidenceData = await db
      .select({
        id: evidenceRepository.id,
        category: evidenceRepository.category,
        reviewStatus: evidenceRepository.reviewStatus,
        createdAt: evidenceRepository.createdAt,
      })
      .from(evidenceRepository)
      .where(
        and(
          eq(evidenceRepository.organizationId, orgId),
          gte(evidenceRepository.createdAt, startDate)
        )
      );

    // Fetch frameworks data
    const frameworksData = await db
      .select()
      .from(frameworks)
      .where(eq(frameworks.organizationId, orgId));

    // Fetch systems data
    const systemsData = await db
      .select()
      .from(systems)
      .where(eq(systems.organizationId, orgId));

    // Mock compliance data (in production, this would be calculated from actual assessments)
    const complianceByFramework = frameworksData.map(fw => ({
      framework: fw.name,
      percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
      trend: Math.floor(Math.random() * 10) - 5, // -5 to +5
      controls: Math.floor(Math.random() * 50) + 20, // 20-70 controls
    }));

    const complianceByCategory = [
      { category: 'Access Control', compliant: 15, partiallyCompliant: 3, nonCompliant: 2 },
      { category: 'Audit and Accountability', compliant: 12, partiallyCompliant: 2, nonCompliant: 1 },
      { category: 'Configuration Management', compliant: 18, partiallyCompliant: 4, nonCompliant: 3 },
      { category: 'Incident Response', compliant: 8, partiallyCompliant: 2, nonCompliant: 1 },
      { category: 'Risk Assessment', compliant: 10, partiallyCompliant: 3, nonCompliant: 2 },
    ];

    // Generate timeline data
    const complianceTimeline = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      complianceTimeline.push({
        date: date.toISOString().split('T')[0],
        compliance: Math.floor(Math.random() * 10) + 75, // 75-85%
        assessments: Math.floor(Math.random() * 5) + 1,
      });
    }

    const poamTimeline = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      poamTimeline.push({
        date: date.toISOString().split('T')[0],
        created: Math.floor(Math.random() * 5),
        completed: Math.floor(Math.random() * 3),
        overdue: Math.floor(Math.random() * 2),
      });
    }

    // Risk analysis
    const riskDistribution = [
      { level: 'Low', count: 45, percentage: 45 },
      { level: 'Medium', count: 35, percentage: 35 },
      { level: 'High', count: 15, percentage: 15 },
      { level: 'Critical', count: 5, percentage: 5 },
    ];

    const riskTrends = [];
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      riskTrends.push({
        date: date.toISOString().split('T')[0],
        high: Math.floor(Math.random() * 5) + 10,
        medium: Math.floor(Math.random() * 10) + 20,
        low: Math.floor(Math.random() * 15) + 30,
      });
    }

    const topRisks = [
      {
        id: '1',
        description: 'Inadequate access controls for privileged accounts',
        score: 85,
        category: 'Access Control',
        status: 'open',
      },
      {
        id: '2',
        description: 'Missing encryption for data in transit',
        score: 78,
        category: 'Data Protection',
        status: 'in_progress',
      },
      {
        id: '3',
        description: 'Outdated security patches on critical systems',
        score: 72,
        category: 'System Maintenance',
        status: 'open',
      },
    ];

    // Performance metrics
    const userActivity = [
      { user: 'John Smith', assessments: 15, poamItems: 8, evidenceUploads: 12 },
      { user: 'Sarah Johnson', assessments: 12, poamItems: 6, evidenceUploads: 9 },
      { user: 'Mike Wilson', assessments: 10, poamItems: 5, evidenceUploads: 7 },
    ];

    const systemPerformance = systemsData.map(system => ({
      system: system.name,
      complianceScore: Math.floor(Math.random() * 30) + 70, // 70-100%
      poamCount: Math.floor(Math.random() * 10),
      lastAssessed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    }));

    // Build response
    const analyticsData = {
      compliance: {
        overall: Math.round(complianceByFramework.reduce((sum, fw) => sum + fw.percentage, 0) / complianceByFramework.length),
        byFramework: complianceByFramework,
        byCategory: complianceByCategory,
        timeline: complianceTimeline,
      },
      poam: {
        total: totalPoam,
        byStatus: Object.entries(poamByStatus).map(([status, count]) => ({
          status,
          count,
          percentage: Math.round((count / totalPoam) * 100),
        })),
        bySeverity: Object.entries(poamBySeverity).map(([severity, data]) => ({
          severity,
          count: data.count,
          avgDaysToResolve: data.count > 0 ? Math.round(data.totalDays / data.count) : 0,
        })),
        overdue: overduePoam,
        completionRate,
        timeline: poamTimeline,
      },
      risk: {
        totalRiskScore: Math.round(poamData.reduce((sum, item) => sum + (item.riskScore || 0), 0) / Math.max(poamData.length, 1)),
        distribution: riskDistribution,
        trends: riskTrends,
        topRisks,
      },
      performance: {
        assessmentVelocity: Math.round(evidenceData.length / 30), // per day
        avgResolutionTime: Math.round(
          Object.values(poamBySeverity).reduce((sum, data) => sum + (data.totalDays / Math.max(data.count, 1)), 0) / 
          Math.max(Object.keys(poamBySeverity).length, 1)
        ),
        userActivity,
        systemPerformance,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}