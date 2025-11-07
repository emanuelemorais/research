import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        console.log('POST /api/user/session - Recebendo requisição');
        
        const body = await req.json();
        console.log('Body recebido:', body);
        
        const { userId, platformId } = body;
        console.log('userId:', userId, 'platformId:', platformId);
        
        if (!userId || !platformId) {
            console.log('Erro: userId ou platformId faltando');
            return NextResponse.json({ success: false, error: 'Missing userId or platformId' }, { status: 400 });
        }
        
        const sql = getDb();
        const checkResult = await sql.query(
            `SELECT id FROM Sessions 
             WHERE userId = $1 
             AND platformId = $2 
             AND endDate IS NULL
             ORDER BY startDate DESC 
             LIMIT 1`,
            [userId, platformId]
        );
        
        const checkData = (checkResult as any).rows || checkResult;
        const sessions = Array.isArray(checkData) ? checkData : [checkData];
        
        console.log('Resultado da query:', checkResult);
        console.log('Sessions encontradas:', sessions);
        
        if (sessions.length === 0 || !sessions[0]) {
            console.log('Nenhuma sessão encontrada para userId:', userId, 'platformId:', platformId);
            return NextResponse.json({ success: false, error: 'Session not found or already completed' }, { status: 404 });
        }

        const sessionId = sessions[0].id;
        console.log('sessionId encontrado:', sessionId);
        
        // Se a sessão existe, atualiza endDate e is_finalized
        const updateResult = await sql.query(
            `UPDATE Sessions 
             SET endDate = NOW(), 
                 is_finalized = true
             WHERE id = $1
             RETURNING id`,
            [sessionId]
        );
        
        console.log('Sessão atualizada:', updateResult);
        
        return NextResponse.json({ success: true, sessionId });
    } catch (error: any) {
        console.error('Error updating session:', error);
        return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}