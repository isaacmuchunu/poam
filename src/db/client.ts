import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Create a default database client with the public schema
export const db = drizzle(pool, { schema });

// Function to get a tenant-specific database client
export const getTenantDb = (tenantId: string) => {
  const schema = `tenant_${tenantId}`;
  return drizzle(pool, { schema });
};

// Function to execute raw SQL queries
export const executeRawQuery = async (sql: string, params: unknown[] = []) => {
  const client = await pool.connect();
  try {
    return await client.query(sql, params);
  } finally {
    client.release();
  }
};

// Function to create a new tenant schema
export const createTenantSchema = async (tenantId: string) => {
  const schema = `tenant_${tenantId}`;
  await executeRawQuery(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
  return schema;
};

// Function to run migrations for a specific tenant schema
export const runTenantMigrations = async (tenantId: string) => {
  const schema = `tenant_${tenantId}`;
  // This would be replaced with actual migration logic
  // For now, we'll just log that migrations would run
  console.log(`Running migrations for tenant schema: ${schema}`);
  return schema;
};
