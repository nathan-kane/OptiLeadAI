// utils/openHermesClient.ts
export async function getAIResponse(prompt: string) {
  try {
    const response = await fetch('/api/openhermes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error fetching AI response:', error);
    throw error; // Re-throw the error or handle it as needed
  }
}