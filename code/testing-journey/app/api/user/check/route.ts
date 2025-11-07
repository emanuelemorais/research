import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';


const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    const { userId } = await req.json();
    const result = await sql.query('SELECT * FROM Users WHERE id = $1', [userId]);
    if (result.length > 0) {
        return Response.json({ success: true, userId: result[0].id });
    } else {
        return Response.json({ success: false, userId: null });
    }
}