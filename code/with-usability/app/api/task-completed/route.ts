import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';

const sql = neon(process.env.DATABASE_URL as string);

export async function POST(req: NextRequest) {
    try {
        const { taskId, sessionId } = await req.json();
        
        if (!taskId || !sessionId) {
            return Response.json({ success: false, error: 'Missing taskId or sessionId' }, { status: 400 });
        }
        
        // Insere a tarefa concluída na tabela
        const result = await sql.query(
            `INSERT INTO taskscompleted (taskid, sessionid, timestamp)
             VALUES ($1, $2, NOW())
             RETURNING id`,
            [taskId, sessionId]
        );
        
        const resultData = (result as any).rows || result;
        const tasks = Array.isArray(resultData) ? resultData : [resultData];
        
        if (tasks.length === 0 || !tasks[0]) {
            return Response.json({ success: false, error: 'Failed to save completed task' }, { status: 500 });
        }
        
        return Response.json({ success: true, taskCompletedId: tasks[0].id });
    } catch (error: any) {
        console.error('Error saving completed task:', error);
        return Response.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
    }
}

