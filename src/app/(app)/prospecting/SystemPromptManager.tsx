"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import { db } from '@/lib/firebase/client';

interface SystemPrompt {
  id: string;
  title: string;
  prompt: string;
}

interface SystemPromptManagerProps {
  onPromptSelected?: (prompt: SystemPrompt | null) => void;
}

export default function SystemPromptManager({ onPromptSelected }: SystemPromptManagerProps) {
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [promptTitle, setPromptTitle] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  async function fetchPrompts() {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, 'systemPrompts'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrompts(data as SystemPrompt[]);
    } catch (err) {
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPrompt(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedPromptId(id);
    const found = prompts.find(p => p.id === id);
    setPromptTitle(found ? found.title : "");
    setPromptText(found ? found.prompt : "");
    setSuccess(null);
    setError(null);
    if (onPromptSelected) {
      onPromptSelected(found || null);
    }
  }

  async function handleSavePrompt() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const docRef = await addDoc(collection(db, 'systemPrompts'), { title: promptTitle, prompt: promptText });
      setPromptTitle("");
      setPromptText("");
      setSelectedPromptId("");
      setSuccess("Prompt saved!");
      await fetchPrompts();
    } catch (err) {
      setError("Failed to save prompt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 32, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h2>System Prompts</h2>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="promptDropdown">Saved Prompts:</label>
        <select
          id="promptDropdown"
          value={selectedPromptId}
          onChange={handleSelectPrompt}
          style={{ marginLeft: 10, minWidth: 200 }}
        >
          <option value="">-- Select a prompt --</option>
          {prompts.map(p => (
            <option key={p.id} value={p.id}>{p.title ? p.title : p.prompt.slice(0, 40) + (p.prompt.length > 40 ? "..." : "")}</option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="systemPromptTitle">Prompt Title:</label>
        <input
          id="systemPromptTitle"
          type="text"
          style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 8 }}
          value={promptTitle}
          onChange={e => setPromptTitle(e.target.value)}
          placeholder="Enter a title for your system prompt..."
        />
        <label htmlFor="systemPromptText">System Prompt:</label>
        <textarea
          id="systemPromptText"
          rows={4}
          style={{ width: '100%', padding: 8, marginTop: 4, resize: 'vertical' }}
          value={promptText}
          onChange={e => {
            setPromptText(e.target.value);
            if (onPromptSelected) {
              onPromptSelected({
                id: selectedPromptId,
                title: promptTitle,
                prompt: e.target.value
              });
            }
          }}
          placeholder="Enter or edit your system prompt here..."
        />
      </div>
      <button
        onClick={async () => {
          if (!promptTitle.trim() || !promptText.trim()) {
            setError("Both title and prompt are required.");
            setSuccess(null);
            return;
          }
          await handleSavePrompt();
        }}
        disabled={loading || !promptTitle?.trim() || !promptText?.trim()}
        style={{ padding: '8px 16px', background: '#1c7c54', color: '#fff', border: 'none', borderRadius: 4 }}
      >
        {loading ? 'Saving...' : 'Save Prompt'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
    </div>
  );
}
