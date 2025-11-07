import { getDb } from '@/lib/db';

export async function GET() {
  const sql = getDb();
  const result = await sql.query('SELECT * FROM educationlevels');
  return Response.json(result);
}