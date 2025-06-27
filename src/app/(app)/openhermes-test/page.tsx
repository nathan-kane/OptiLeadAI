"use client";


import { useState } from 'react';
import { getAIResponse } from '@/utils/openHermesClient';

export default function OpenHermesChatPage() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendPrompt = async () => {
    setLoading(true);
    try {
      const aiResponse = await getAIResponse(prompt);
      setResponse(aiResponse);
    } catch (error) {
      console.error('Error fetching AI response:', error);
      setResponse('Error fetching response.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">OpenHermes Chat</h1>

      <div className="mb-4">
        <textarea
          className="w-full p-2 border border-gray-300 rounded-md"
          rows={6}
          placeholder="Enter your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
          onClick={handleSendPrompt}
          disabled={loading || prompt.trim() === ''}
        >
          {loading ? 'Sending...' : 'Send Prompt'}
        </button>
      </div>

      <div className="border border-gray-300 rounded-md p-4 bg-gray-100 whitespace-pre-wrap">
        <h2 className="text-xl font-semibold mb-2">AI Response:</h2>
        {response ? response : 'Response will appear here...'}
      </div>
    </div>
  );
}