import { sql } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskId, sessionId } = body;

    // Validar parâmetros
    if (!taskId || !sessionId) {
      return NextResponse.json(
        { error: 'taskId e sessionId são obrigatórios' },
        { status: 400 }
      );
    }

    // Inserir a tarefa concluída no banco de dados
    const result = await sql`
      INSERT INTO taskscompleted (taskid, sessionid, timestamp)
      VALUES (${taskId}, ${sessionId}, NOW())
      RETURNING id, taskid, sessionid, timestamp
    `;

    return NextResponse.json(
      { 
        success: true, 
        data: result[0] 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao salvar tarefa concluída:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar tarefa concluída no banco de dados' },
      { status: 500 }
    );
  }
}


