import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { userId } = await req.json();
        const sql = getDb();
        const result = await sql.query('SELECT * FROM Users WHERE id = $1', [userId]);
        
        const resultData = (result as any).rows || result;
        const rows = Array.isArray(resultData) ? resultData : [resultData];
        
        if (rows.length > 0 && rows[0]) {
            return Response.json({ success: true, userId: rows[0].id });
        } else {
            return Response.json({ success: false, userId: null });
        }
    } catch (error: any) {
        console.error('Error checking user:', error);
        return Response.json({ success: false, userId: null, error: error.message }, { status: 500 });
    }
}