import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    console.log('req', req);
    const { sessionId } = await req.json();
    console.log('sessionId', sessionId);
    
    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId é obrigatório' },
        { status: 400 }
      );
    }
    
    // Verifica se a sessão existe e ainda não está finalizada
    const checkResult = await sql`
      SELECT id FROM Sessions 
      WHERE id = ${sessionId}
      AND is_finalized = false
      LIMIT 1
    `;

    console.log('checkResult', checkResult);
    
    if (!checkResult || checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sessão não encontrada ou já finalizada' },
        { status: 404 }
      );
    }
    
    // Atualiza a sessão marcando como finalizada
    const updateResult = await sql`
      UPDATE Sessions 
      SET endDate = NOW(), 
          is_finalized = true
      WHERE id = ${sessionId}
      RETURNING id, endDate, is_finalized
    `;
    console.log('updateResult', updateResult);
    
    return NextResponse.json(
      { success: true, data: updateResult[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Erro ao finalizar sessão:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

