export interface AIResponse {
  content: string;
  type: 'text' | 'image';
}

export async function generateAIAsset(prompt: string, type: 'text' | 'image'): Promise<AIResponse> {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt, type }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate AI asset');
  }

  return response.json();
}
