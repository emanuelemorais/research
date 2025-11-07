import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';


const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { userId, platformId } = await req.json();
        
        if (!userId || !platformId) {
            return Response.json({ success: false, error: 'Missing userId or platformId' }, { status: 400 });
        }
        
        const result = await sql.query(
            `UPDATE Sessions 
             SET endDate = NOW() 
             WHERE userId = $1 
             AND platformId = $2 
             AND endDate IS NULL
             AND id = (
                 SELECT id FROM Sessions 
                 WHERE userId = $1 
                 AND platformId = $2 
                 AND endDate IS NULL
                 ORDER BY startDate DESC 
                 LIMIT 1
             )
             RETURNING id`,
            [userId, platformId]
        );
        
        const resultData = (result as any).rows || result;
        const sessions = Array.isArray(resultData) ? resultData : [resultData];
        
        if (sessions.length === 0 || !sessions[0]) {
            return Response.json({ success: false, error: 'Session not found or already completed' }, { status: 404 });
        }
        
        const sessionId = sessions[0].id;
        return Response.json({ success: true, sessionId });
    } catch (error: any) {
        console.error('Error updating session:', error);
        return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

