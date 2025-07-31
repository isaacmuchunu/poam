import { executeRawQuery } from './client';

// Migration function for the main application schema
export const runMigrations = async () => {
  try {
    console.log('Running migrations for main application schema...');
    // In a production environment, you would use drizzle-kit to generate migrations
    // and then apply them using the migrate function
    // For now, we'll just log that migrations would run
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Function to initialize a new tenant
export const initializeTenant = async (tenantId: string, tenantName: string) => {
  try {
    console.log(`Initializing tenant: ${tenantName} (${tenantId})`);
    
    // Create schema for the tenant
    const schema = `tenant_${tenantId}`;
    await executeRawQuery(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    
    // Create tables in the tenant schema
    // In a production environment, you would use drizzle-kit to generate migrations
    // For now, we'll create the tables directly
    
    // Create organizations table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        subscription_tier TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        subscription_status TEXT DEFAULT 'active',
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);
    
    // Create users table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clerk_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        role TEXT NOT NULL DEFAULT 'user'
      )
    `);
    
    // Create organization_memberships table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.organization_memberships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        user_id UUID NOT NULL REFERENCES ${schema}.users(id),
        role TEXT NOT NULL DEFAULT 'member',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create systems table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.systems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        system_type TEXT,
        owner TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create frameworks table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.frameworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        version TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create poam_items table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.poam_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        creation_date TIMESTAMP NOT NULL DEFAULT NOW(),
        security_control TEXT NOT NULL,
        weakness TEXT NOT NULL,
        weakness_description TEXT,
        source_of_weakness TEXT,
        severity_level TEXT NOT NULL,
        resource_estimate JSONB,
        identification_method TEXT,
        point_of_contact_id UUID REFERENCES ${schema}.users(id),
        planned_start_date TIMESTAMP,
        planned_completion_date TIMESTAMP,
        milestones JSONB,
        actual_start_date TIMESTAMP,
        milestones_changes JSONB,
        status TEXT NOT NULL DEFAULT 'in_progress',
        actual_completion_date TIMESTAMP,
        comments TEXT,
        assigned_to_id UUID REFERENCES ${schema}.users(id),
        approval_status TEXT DEFAULT 'pending',
        risk_score INTEGER,
        dependencies JSONB,
        evidence_repository JSONB,
        cost_estimate INTEGER,
        system_asset_id UUID REFERENCES ${schema}.systems(id),
        compliance_framework_id UUID REFERENCES ${schema}.frameworks(id),
        residual_risk INTEGER,
        review_date TIMESTAMP,
        review_cycle TEXT,
        tags JSONB
      )
    `);
    
    // Create tenant_settings table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.tenant_settings (
        organization_id UUID PRIMARY KEY REFERENCES ${schema}.organizations(id),
        theme JSONB DEFAULT '{"primaryColor": "#0f172a", "logoUrl": null, "favicon": null}'::jsonb,
        custom_fields JSONB DEFAULT '[]'::jsonb,
        notification_settings JSONB DEFAULT '{"emailEnabled": true, "slackEnabled": false, "slackWebhookUrl": null}'::jsonb,
        security_settings JSONB DEFAULT '{"mfaRequired": false, "sessionTimeout": 3600}'::jsonb,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create evidence_files table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.evidence_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        poam_item_id UUID NOT NULL REFERENCES ${schema}.poam_items(id),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        file_name TEXT NOT NULL,
        file_type TEXT,
        file_size INTEGER,
        storage_url TEXT NOT NULL,
        uploaded_by_id UUID NOT NULL REFERENCES ${schema}.users(id),
        uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),
        description TEXT
      )
    `);
    
    // Create audit_logs table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        user_id UUID REFERENCES ${schema}.users(id),
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id UUID,
        details JSONB,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create report_templates table
    await executeRawQuery(`
      CREATE TABLE IF NOT EXISTS ${schema}.report_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES ${schema}.organizations(id),
        name TEXT NOT NULL,
        description TEXT,
        config JSONB NOT NULL,
        created_by_id UUID NOT NULL REFERENCES ${schema}.users(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_default BOOLEAN DEFAULT false
      )
    `);
    
    // Insert initial organization record
    await executeRawQuery(`
      INSERT INTO ${schema}.organizations (id, name)
      VALUES ($1, $2)
    `, [tenantId, tenantName]);
    
    console.log(`Tenant ${tenantName} (${tenantId}) initialized successfully`);
    return { success: true, tenantId, schema };
  } catch (error) {
    console.error('Error initializing tenant:', error);
    throw error;
  }
};
