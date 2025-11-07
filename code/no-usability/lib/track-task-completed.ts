/**
 * Função helper para rastrear tarefas completadas
 */
export async function trackTaskCompleted(taskId: number, sessionId: string | null) {
  if (!sessionId) {
    console.warn('sessionId não disponível, tarefa não será rastreada');
    return;
  }

  try {
    const response = await fetch('/api/task-completed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskId,
        sessionId,
      }),
    });

    if (!response.ok) {
      console.error('Erro ao rastrear tarefa completada:', await response.text());
    }
  } catch (error) {
    console.error('Erro ao rastrear tarefa completada:', error);
  }
}


