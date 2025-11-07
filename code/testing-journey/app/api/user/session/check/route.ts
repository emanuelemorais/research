import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';


const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { userId, platformId } = await req.json();
        
        if (!userId || !platformId) {
            return Response.json({ success: false, session: null, completed: false }, { status: 400 });
        }

        const result = await sql.query(
            'SELECT * FROM Sessions WHERE userId = $1 AND platformId = $2 ORDER BY startDate DESC LIMIT 1', 
            [userId, platformId]
        );
        
        const resultData = (result as any).rows || result;
        const sessions = Array.isArray(resultData) ? resultData : [resultData];
        
        if (sessions.length === 0 || !sessions[0]) {
            return Response.json({ success: false, session: null, completed: false });
        }
        
        const session = sessions[0];
        // Neon retorna colunas em lowercase
        // Sessão está completa se endDate não for NULL
        const endDate = session.enddate || session.endDate;
        const completed = endDate !== null && endDate !== undefined;
        
        return Response.json({ 
            success: true, 
            session: {
                id: session.id,
                userId: session.userid || session.userId,
                platformId: session.platformid || session.platformId,
                startDate: session.startdate || session.startDate,
                endDate: endDate
            },
            completed 
        });
    } catch (error: any) {
        console.error('Error checking session:', error);
        return Response.json({ success: false, session: null, completed: false, error: error.message }, { status: 500 });
    }
}