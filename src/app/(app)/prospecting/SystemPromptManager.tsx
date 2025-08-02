"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SystemPrompt {
  id?: string;                    // Document ID (auto-generated)
  title: string;                  // Required: Display name for selection
  prompt: string;                 // Required: The actual prompt content
  description?: string;           // Optional: Brief description
  createdAt: any;                // Required: Creation timestamp (Firestore Timestamp)
  updatedAt: any;                // Required: Last update timestamp (Firestore Timestamp)
  isDefault?: boolean;           // Optional: Set to true for fallback prompt
  tags?: string[];               // Optional: For categorization
}

interface SystemPromptManagerProps {
  onPromptSelected?: (prompt: SystemPrompt | null) => void;
}

export default function SystemPromptManager({ onPromptSelected }: SystemPromptManagerProps) {
  const { userId } = useAuth();
  const [prompts, setPrompts] = useState<SystemPrompt[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>("");
  const [promptName, setPromptName] = useState<string>("");
  const [promptText, setPromptText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch prompts when userId is available
    if (userId) {
      fetchPrompts();
    }
  }, [userId]); // Re-run when userId changes

  async function fetchPrompts() {
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      // Fetch prompts from user-scoped collection: users/{userId}/prompts
      const querySnapshot = await getDocs(collection(db, 'users', userId, 'prompts'));
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPrompts(data as SystemPrompt[]);
    } catch (err) {
      setError("Failed to load prompts");
      console.error('Error fetching user prompts:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectPrompt(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    setSelectedPromptId(id);
    const found = prompts.find(p => p.id === id);
    setPromptName(found ? found.title : "");
    // Handle backward compatibility: check for both 'prompt' (new) and 'content' (old) fields
    const promptContent = found ? (found.prompt || (found as any).content || "") : "";
    setPromptText(promptContent);
    setSuccess(null);
    setError(null);
    if (onPromptSelected) {
      onPromptSelected(found || null);
    }
  }

  async function handleSavePrompt() {
    if (!userId) {
      setError("User not authenticated");
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const promptData = {
        title: promptName,
        prompt: promptText,
        description: "", // Optional field, can be empty for now
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDefault: false, // Optional field, default to false
        tags: [] // Optional field, empty array for now
      };
      
      // Save to user-scoped collection: users/{userId}/prompts
      const docRef = await addDoc(collection(db, 'users', userId, 'prompts'), promptData);
      console.log('Prompt saved successfully for user:', userId, 'Document ID:', docRef.id);
      
      setPromptName("");
      setPromptText("");
      setSelectedPromptId("");
      setSuccess("Prompt saved successfully!");
      await fetchPrompts();
    } catch (err) {
      setError("Failed to save prompt");
      console.error('Error saving prompt for user:', userId, err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ marginBottom: 32, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h1><b>Prompts</b></h1>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="promptDropdown"></label>
        <select
          id="promptDropdown"
          value={selectedPromptId}
          onChange={handleSelectPrompt}
          style={{ marginLeft: 10, minWidth: 200 }}
        >
          <option value="">-- Select a prompt --</option>
          {prompts.map(p => (
            <option key={p.id} value={p.id}>
              {p.title ? p.title : ((p.prompt || (p as any).content) ? (p.prompt || (p as any).content).slice(0, 40) + ((p.prompt || (p as any).content).length > 40 ? "..." : "") : "Untitled Prompt")}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label htmlFor="systemPromptName"><b>Prompt Name:</b></label>
        <input
          id="systemPromptName"
          type="text"
          style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 8 }}
          value={promptName}
          onChange={e => setPromptName(e.target.value)}
          placeholder="Enter a name for your prompt..."
        />
        <label htmlFor="systemPromptText"><b>Prompt Body:</b></label>
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
                title: promptName,
                prompt: e.target.value,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            }
          }}
          placeholder="Enter or edit your prompt here..."
        />
      </div>
      <button
        onClick={async () => {
          if (!promptName?.trim() || !promptText?.trim()) {
            setError("Both name and prompt are required.");
            setSuccess(null);
            return;
          }
          await handleSavePrompt();
        }}
        disabled={loading || !promptName?.trim() || !promptText?.trim()}
        style={{ padding: '8px 16px', background: '#1c7c54', color: '#fff', border: 'none', borderRadius: 4 }}
      >
        {loading ? 'Saving...' : 'Save Prompt'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
    </div>
  );
}
