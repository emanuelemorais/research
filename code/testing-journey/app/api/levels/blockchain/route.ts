import { neon } from '@neondatabase/serverless';


const sql = neon(process.env.DATABASE_URL as string);

export async function GET() {
  const result = await sql.query('SELECT * FROM blockchainknowledgelevels');
  return Response.json(result);
}