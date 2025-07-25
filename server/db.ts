import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as pgDrizzle } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using Neon (for cloud deployment) or local PostgreSQL
const isNeonDatabase = process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('neondb.net');

let pool: Pool | PgPool;
let db: any;

if (isNeonDatabase) {
  // Use Neon serverless for cloud deployment
  neonConfig.webSocketConstructor = ws;
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  // Use regular PostgreSQL for local development
  pool = new PgPool({ connectionString: process.env.DATABASE_URL });
  db = pgDrizzle({ client: pool, schema });
}

export { pool, db };