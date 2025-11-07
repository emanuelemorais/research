/**
 * Função helper para finalizar uma sessão no banco de dados
 */
export async function finalizeSession(sessionId: string | null) {
  if (!sessionId) {
    console.warn('sessionId não disponível, sessão não será finalizada');
    return;
  }

  try {
    const response = await fetch('/api/session/finalize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro ao finalizar sessão:', error);
    } else {
      const result = await response.json();
      console.log('Sessão finalizada com sucesso:', result);
    }
  } catch (error) {
    console.error('Erro ao finalizar sessão:', error);
  }
}


