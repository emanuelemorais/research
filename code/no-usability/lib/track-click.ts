export async function trackButtonClick(buttonId: number, sessionId: string | null) {
  if (!sessionId) {
    console.warn('sessionId não disponível, clique não será rastreado');
    return;
  }

  try {
    const response = await fetch('/api/button-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buttonId,
        sessionId,
      }),
    });

    if (!response.ok) {
      console.error('Erro ao rastrear clique:', await response.text());
    }
  } catch (error) {
    console.error('Erro ao rastrear clique:', error);
  }
}

