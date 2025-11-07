import { getDb } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Verificar se há conteúdo no corpo da requisição
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type deve ser application/json' },
        { status: 400 }
      );
    }

    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Corpo da requisição está vazio' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'JSON inválido no corpo da requisição' },
        { status: 400 }
      );
    }

    const { buttonId, sessionId } = body;

    // Validar parâmetros
    if (!buttonId || !sessionId) {
      return NextResponse.json(
        { error: 'buttonId e sessionId são obrigatórios' },
        { status: 400 }
      );
    }

    // Inserir o clique no banco de dados
    const sql = getDb();
    const result = await sql`
      INSERT INTO buttonclicks (buttonid, sessionid, timestamp)
      VALUES (${buttonId}, ${sessionId}, NOW())
      RETURNING id, buttonid, sessionid, timestamp
    `;

    return NextResponse.json(
      { 
        success: true, 
        data: result[0] 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao salvar clique:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar clique no banco de dados' },
      { status: 500 }
    );
  }
}

