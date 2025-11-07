import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';


const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { userId, platformId } = await req.json();
        
        if (!userId || !platformId) {
            return Response.json({ success: false, error: 'Missing userId or platformId' }, { status: 400 });
        }

        // endDate será NULL inicialmente, será preenchido quando a sessão for finalizada
        // Se o schema não permitir NULL, precisará ser ajustado
        const result = await sql.query(
            'INSERT INTO Sessions (userId, platformId, startDate, endDate) VALUES ($1, $2, NOW(), NULL) RETURNING id', 
            [userId, platformId]
        );
        
        const resultData = (result as any).rows || result;
        const firstRow = Array.isArray(resultData) ? resultData[0] : resultData;
        const sessionId = firstRow?.id;
        
        if (!sessionId) {
            return Response.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
        return Response.json({ success: true, sessionId });
    } catch (error: any) {
        console.error('Error creating session:', error);
        return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}