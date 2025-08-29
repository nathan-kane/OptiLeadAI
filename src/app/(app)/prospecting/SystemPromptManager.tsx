"use client";
import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
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
  const [originalPromptName, setOriginalPromptName] = useState<string>("");
  const [originalPromptText, setOriginalPromptText] = useState<string>("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
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
    const title = found ? found.title : "";
    // Handle backward compatibility: check for both 'prompt' (new) and 'content' (old) fields
    const promptContent = found ? (found.prompt || (found as any).content || "") : "";
    
    setPromptName(title);
    setPromptText(promptContent);
    setOriginalPromptName(title);
    setOriginalPromptText(promptContent);
    setIsCreatingNew(false);
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
      if (isCreatingNew || !selectedPromptId) {
        // Create new prompt
        const promptData = {
          title: promptName,
          prompt: promptText,
          description: "",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          isDefault: false,
          tags: []
        };
        
        const docRef = await addDoc(collection(db, 'users', userId, 'prompts'), promptData);
        console.log('New prompt created for user:', userId, 'Document ID:', docRef.id);
        setSuccess("New prompt created successfully!");
        
        // Select the newly created prompt
        setSelectedPromptId(docRef.id);
        setOriginalPromptName(promptName);
        setOriginalPromptText(promptText);
        setIsCreatingNew(false);
      } else {
        // Update existing prompt
        const promptRef = doc(db, 'users', userId, 'prompts', selectedPromptId);
        const updateData = {
          title: promptName,
          prompt: promptText,
          updatedAt: serverTimestamp()
        };
        
        await updateDoc(promptRef, updateData);
        console.log('Prompt updated for user:', userId, 'Document ID:', selectedPromptId);
        setSuccess("Prompt updated successfully!");
        
        // Update original values to reflect the save
        setOriginalPromptName(promptName);
        setOriginalPromptText(promptText);
        
        // Update the selected prompt in parent component
        if (onPromptSelected) {
          const updatedPrompt = {
            id: selectedPromptId,
            title: promptName,
            prompt: promptText,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          onPromptSelected(updatedPrompt);
        }
      }
      
      await fetchPrompts();
    } catch (err) {
      setError("Failed to save prompt");
      console.error('Error saving prompt for user:', userId, err);
    } finally {
      setLoading(false);
    }
  }
  
  function handleNewPrompt() {
    setSelectedPromptId("");
    setPromptName("");
    setPromptText("");
    setOriginalPromptName("");
    setOriginalPromptText("");
    setIsCreatingNew(true);
    setSuccess(null);
    setError(null);
    
    if (onPromptSelected) {
      onPromptSelected(null);
    }
  }
  
  // Check if current prompt has changes
  const hasChanges = () => {
    return promptName !== originalPromptName || promptText !== originalPromptText;
  };

  return (
    <div style={{ marginBottom: 32, border: '1px solid #ddd', borderRadius: 8, padding: 16 }}>
      <h1><b>Prompts</b></h1>
      <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <label htmlFor="promptDropdown"></label>
        <select
          id="promptDropdown"
          value={selectedPromptId}
          onChange={handleSelectPrompt}
          style={{ minWidth: 200 }}
        >
          <option value="">-- Select a prompt --</option>
          {prompts.map(p => (
            <option key={p.id} value={p.id}>
              {p.title ? p.title : ((p.prompt || (p as any).content) ? (p.prompt || (p as any).content).slice(0, 40) + ((p.prompt || (p as any).content).length > 40 ? "..." : "") : "Untitled Prompt")}
            </option>
          ))}
        </select>
        {/* <button
          onClick={handleNewPrompt}
          style={{ 
            padding: '8px 16px', 
            background: '#0066cc', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          New Prompt
        </button> */}
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
        disabled={loading || !promptName?.trim() || !promptText?.trim() || (!isCreatingNew && !hasChanges())}
        style={{ 
          padding: '8px 16px', 
          background: (loading || !promptName?.trim() || !promptText?.trim() || (!isCreatingNew && !hasChanges())) ? '#ccc' : '#1c7c54', 
          color: '#fff', 
          border: 'none', 
          borderRadius: 4,
          cursor: (loading || !promptName?.trim() || !promptText?.trim() || (!isCreatingNew && !hasChanges())) ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Saving...' : (isCreatingNew ? 'Create Prompt' : 'Update Prompt')}
      </button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
    </div>
  );
}
