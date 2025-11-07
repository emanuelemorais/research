import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';

const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json();
        
        if (!sessionId) {
            return Response.json({ success: false, session: null }, { status: 400 });
        }

        const result = await sql.query(
            'SELECT * FROM Sessions WHERE id = $1', 
            [sessionId]
        );
        
        const resultData = (result as any).rows || result;
        const sessions = Array.isArray(resultData) ? resultData : [resultData];
        
        if (sessions.length === 0 || !sessions[0]) {
            return Response.json({ success: false, session: null });
        }
        
        const session = sessions[0];
        
        return Response.json({ 
            success: true, 
            session: {
                id: session.id,
                userId: session.userid || session.userId,
                platformId: session.platformid || session.platformId,
                startDate: session.startdate || session.startDate,
                endDate: session.enddate || session.endDate
            }
        });
    } catch (error: any) {
        console.error('Error getting session:', error);
        return Response.json({ success: false, session: null, error: error.message }, { status: 500 });
    }
}

