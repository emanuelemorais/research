import { neon } from '@neondatabase/serverless';

let sql: ReturnType<typeof neon> | null = null;

export function getDb() {
  if (!sql) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL environment variable is not set. Please set it in your .env.local file.'
      );
    }
    sql = neon(databaseUrl);
  }
  return sql;
}

