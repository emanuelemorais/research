import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';

const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { buttonId, sessionId } = await req.json();
        
        if (!buttonId || !sessionId) {
            return Response.json({ success: false, error: 'Missing buttonId or sessionId' }, { status: 400 });
        }
        
        // Insere o clique do botão na tabela
        const result = await sql.query(
            `INSERT INTO buttonclicks (buttonid, sessionid, timestamp)
             VALUES ($1, $2, NOW())
             RETURNING id`,
            [buttonId, sessionId]
        );
        
        const resultData = (result as any).rows || result;
        const clicks = Array.isArray(resultData) ? resultData : [resultData];
        
        if (clicks.length === 0 || !clicks[0]) {
            return Response.json({ success: false, error: 'Failed to save button click' }, { status: 500 });
        }
        
        return Response.json({ success: true, clickId: clicks[0].id });
    } catch (error: any) {
        console.error('Error saving button click:', error);
        return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

