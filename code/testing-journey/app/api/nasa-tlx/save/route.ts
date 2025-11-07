import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { sessionId, mentalDemand, physicalDemand, temporalDemand, performance, effort, frustration } = await req.json();
        
        if (!sessionId || mentalDemand === undefined || physicalDemand === undefined || 
            temporalDemand === undefined || performance === undefined || 
            effort === undefined || frustration === undefined) {
            return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        const sql = getDb();
        // Verificar se já existe uma resposta para esta sessão
        const existing = await sql.query(
            'SELECT id FROM nasa_tlx_responses WHERE session_id = $1',
            [sessionId]
        );

        const resultData = (existing as any).rows || existing;
        const existingRows = Array.isArray(resultData) ? resultData : [resultData];

        if (existingRows.length > 0 && existingRows[0]) {
            // Atualizar resposta existente
            const updateResult = await sql.query(
                `UPDATE nasa_tlx_responses 
                 SET mental_demand = $1, physical_demand = $2, temporal_demand = $3, 
                     performance = $4, effort = $5, frustration = $6
                 WHERE session_id = $7
                 RETURNING id`,
                [mentalDemand, physicalDemand, temporalDemand, performance, effort, frustration, sessionId]
            );
            
            const updateData = (updateResult as any).rows || updateResult;
            const updateRows = Array.isArray(updateData) ? updateData : [updateData];
            
            if (updateRows.length > 0 && updateRows[0]) {
                return Response.json({ success: true, id: updateRows[0].id });
            }
        } else {
            // Inserir nova resposta
            const insertResult = await sql.query(
                `INSERT INTO nasa_tlx_responses 
                 (session_id, mental_demand, physical_demand, temporal_demand, performance, effort, frustration)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 RETURNING id`,
                [sessionId, mentalDemand, physicalDemand, temporalDemand, performance, effort, frustration]
            );
            
            const insertData = (insertResult as any).rows || insertResult;
            const insertRows = Array.isArray(insertData) ? insertData : [insertData];
            
            if (insertRows.length > 0 && insertRows[0]) {
                return Response.json({ success: true, id: insertRows[0].id });
            }
        }

        return Response.json({ success: false, error: 'Failed to save response' }, { status: 500 });
    } catch (error: any) {
        console.error('Error saving NASA TLX response:', error);
        return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

