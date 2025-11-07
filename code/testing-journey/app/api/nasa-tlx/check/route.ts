import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();
        
        if (!sessionId) {
            return Response.json({ success: false, exists: false }, { status: 400 });
        }

        const sql = getDb();
        const result = await sql.query(
            'SELECT id FROM nasa_tlx_responses WHERE session_id = $1',
            [sessionId]
        );
        
        const resultData = (result as any).rows || result;
        const rows = Array.isArray(resultData) ? resultData : [resultData];
        
        const exists = rows.length > 0 && rows[0] !== null && rows[0] !== undefined;
        
        return Response.json({ success: true, exists });
    } catch (error: any) {
        console.error('Error checking NASA TLX response:', error);
        return Response.json({ success: false, exists: false, error: error.message }, { status: 500 });
    }
}

