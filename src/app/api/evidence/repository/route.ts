import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db/client';
import { evidenceRepository } from '@/db/schema';
import { eq, and, desc, like, or } from 'drizzle-orm';
import { z } from 'zod';
import crypto from 'crypto';

const evidenceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  category: z.enum(['policy', 'procedure', 'evidence', 'screenshot', 'document', 'other']),
  poamItemId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  taskId: z.string().uuid().optional(),
  fileType: z.string().optional(),
  fileName: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  storageUrl: z.string().url().optional(),
  version: z.string().default('1.0'),
  parentVersionId: z.string().uuid().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional(),
  retentionDate: z.string().datetime().optional(),
});

// GET /api/evidence/repository - List evidence items
export async function GET(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const poamItemId = url.searchParams.get('poamItemId');
    const milestoneId = url.searchParams.get('milestoneId');
    const taskId = url.searchParams.get('taskId');
    const search = url.searchParams.get('search');
    const reviewStatus = url.searchParams.get('reviewStatus');
    const tags = url.searchParams.get('tags')?.split(',');
    const includeArchived = url.searchParams.get('includeArchived') === 'true';

    let conditions = [eq(evidenceRepository.organizationId, orgId)];
    
    if (!includeArchived) {
      conditions.push(eq(evidenceRepository.isArchived, false));
    }
    
    if (category) {
      conditions.push(eq(evidenceRepository.category, category));
    }
    
    if (poamItemId) {
      conditions.push(eq(evidenceRepository.poamItemId, poamItemId));
    }
    
    if (milestoneId) {
      conditions.push(eq(evidenceRepository.milestoneId, milestoneId));
    }
    
    if (taskId) {
      conditions.push(eq(evidenceRepository.taskId, taskId));
    }
    
    if (reviewStatus) {
      conditions.push(eq(evidenceRepository.reviewStatus, reviewStatus));
    }
    
    if (search) {
      conditions.push(
        or(
          like(evidenceRepository.name, `%${search}%`),
          like(evidenceRepository.description, `%${search}%`),
          like(evidenceRepository.fileName, `%${search}%`)
        )
      );
    }

    let query = db.select().from(evidenceRepository)
      .where(and(...conditions))
      .orderBy(desc(evidenceRepository.createdAt));

    const evidence = await query;

    // Filter by tags if specified
    let filteredEvidence = evidence;
    if (tags && tags.length > 0) {
      filteredEvidence = evidence.filter(item => {
        const itemTags = item.tags as string[] || [];
        return tags.some(tag => itemTags.includes(tag));
      });
    }

    // Group by version history
    const evidenceWithVersions = filteredEvidence.map(item => {
      const versions = evidence.filter(e => 
        e.parentVersionId === item.id || e.id === item.id
      ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return {
        ...item,
        versions: versions.length > 1 ? versions : undefined,
        isLatestVersion: !item.parentVersionId,
      };
    });

    return NextResponse.json({
      evidence: evidenceWithVersions,
      count: filteredEvidence.length,
      categories: ['policy', 'procedure', 'evidence', 'screenshot', 'document', 'other'],
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
}

// POST /api/evidence/repository - Create evidence item
export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = evidenceSchema.parse(body);

    // Generate checksum for file integrity if file data is provided
    let checksum;
    if (validatedData.storageUrl && validatedData.fileName) {
      // In production, this would be calculated from the actual file content
      checksum = crypto.createHash('sha256').update(`${validatedData.fileName}-${Date.now()}`).digest('hex');
    }

    const newEvidence = await db.insert(evidenceRepository).values({
      organizationId: orgId,
      uploadedById: userId,
      checksum,
      ...validatedData,
      retentionDate: validatedData.retentionDate ? new Date(validatedData.retentionDate) : null,
    }).returning();

    return NextResponse.json(newEvidence[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 });
    }
    
    console.error('Error creating evidence:', error);
    return NextResponse.json({ error: 'Failed to create evidence' }, { status: 500 });
  }
}

// PUT /api/evidence/repository - Create new version of evidence
export async function PUT(req: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    
    if (!userId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { parentId, ...updateData } = body;

    // Get parent evidence item
    const parentEvidence = await db.select().from(evidenceRepository)
      .where(
        and(
          eq(evidenceRepository.id, parentId),
          eq(evidenceRepository.organizationId, orgId)
        )
      )
      .limit(1);

    if (parentEvidence.length === 0) {
      return NextResponse.json({ error: 'Parent evidence not found' }, { status: 404 });
    }

    const parent = parentEvidence[0];

    // Generate new version number
    const currentVersion = parent.version;
    const versionParts = currentVersion.split('.');
    const newVersionNumber = `${versionParts[0]}.${parseInt(versionParts[1]) + 1}`;

    // Generate checksum for new version
    let checksum;
    if (updateData.storageUrl && updateData.fileName) {
      checksum = crypto.createHash('sha256').update(`${updateData.fileName}-${Date.now()}`).digest('hex');
    }

    const newVersionRecord = await db.insert(evidenceRepository).values({
      organizationId: orgId,
      uploadedById: userId,
      parentVersionId: parentId,
      version: newVersionNumber,
      checksum,
      // Copy parent data and override with updates
      name: updateData.name || parent.name,
      description: updateData.description || parent.description,
      category: updateData.category || parent.category,
      poamItemId: parent.poamItemId,
      milestoneId: parent.milestoneId,
      taskId: parent.taskId,
      ...updateData,
    }).returning();

    return NextResponse.json(newVersionRecord[0], { status: 201 });
  } catch (error) {
    console.error('Error creating evidence version:', error);
    return NextResponse.json({ error: 'Failed to create evidence version' }, { status: 500 });
  }
}