"use client";

import { useState, useEffect } from "react";
import { db } from '@/lib/firebase/client';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

// Placeholder types for scripts and leads
interface Script {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface LeadList {
  id: string;
  name: string;
}

export default function ProspectingPage() {
  const [error, setError] = useState<string | null>(null);
  // State for scripts
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [isNew, setIsNew] = useState(false);

  // State for leads
  const [leadLists, setLeadLists] = useState<LeadList[]>([]);
  const [selectedLeadListId, setSelectedLeadListId] = useState<string>("");

  // Fetch scripts from Firestore
  useEffect(() => {
    async function fetchScripts() {
      const querySnapshot = await getDocs(collection(db, 'scripts'));
      const data: Script[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Script[];
      setScripts(data);
    }
    fetchScripts();
    // TODO: Fetch from /api/leads
    setLeadLists([
      { id: "a", name: "June Leads" },
      { id: "b", name: "July Leads" },
    ]);
  }, []);

  // Handlers
  const handleScriptSelect = (id: string) => {
    setSelectedScriptId(id);
    setIsEditing(false);
    setIsNew(false);
    const script = scripts.find((s) => s.id === id);
    if (script) {
      setEditorTitle(script.title);
      setEditorContent(script.content);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsNew(false);
  };

  const handleNew = () => {
    setIsEditing(true);
    setIsNew(true);
    setEditorTitle("");
    setEditorContent("");
  };

  const handleSave = async () => {
    setError(null);
    if (!editorTitle.trim() || !editorContent.trim()) return;
    let savedScript: Script;
    try {
      if (isNew) {
        // Create new script in Firestore
        const docRef = await addDoc(collection(db, 'scripts'), {
          title: editorTitle,
          content: editorContent,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        savedScript = {
          id: docRef.id,
          title: editorTitle,
          content: editorContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setScripts(prev => [...prev, savedScript]);
        setSelectedScriptId(savedScript.id);
      } else {
        // Update existing script in Firestore
        const docRef = doc(collection(db, 'scripts'), selectedScriptId);
        await updateDoc(docRef, {
          title: editorTitle,
          content: editorContent,
          updatedAt: serverTimestamp(),
        });
        savedScript = {
          id: selectedScriptId,
          title: editorTitle,
          content: editorContent,
          createdAt: scripts.find(s => s.id === selectedScriptId)?.createdAt || '',
          updatedAt: new Date().toISOString(),
        };
        setScripts(prev => prev.map(s => s.id === savedScript.id ? savedScript : s));
        setSelectedScriptId(savedScript.id);
      }
      setIsEditing(false);
      setIsNew(false);
    } catch (e: any) {
      setError(e.message || 'Failed to save script. Check console for details.');
      console.error('Error saving script to Firestore:', e);
    }
  };


  const handleStartCampaign = () => {
    // TODO: POST to /api/campaigns/launch with selectedLeadListId and selectedScriptId
    alert(`Campaign started with script ${selectedScriptId} for lead list ${selectedLeadListId}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 10 }}>
      <h1>Prospecting Campaigns</h1>

      {/* Lead List Selector */}
      <div style={{ marginBottom: 20 }}>
        <label>Lead List:</label>
        <select
          value={selectedLeadListId}
          onChange={(e) => setSelectedLeadListId(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="">Select a lead list</option>
          {leadLists.map((lead) => (
            <option key={lead.id} value={lead.id}>{lead.name}</option>
          ))}
        </select>
      </div>

      {/* Script Selector */}
      <div style={{ marginBottom: 20 }}>
        <label>Script:</label>
        <select
          value={selectedScriptId}
          onChange={(e) => handleScriptSelect(e.target.value)}
          style={{ marginLeft: 10 }}
        >
          <option value="">Select a script</option>
          {scripts.map((script) => (
            <option key={script.id} value={script.id}>
              {script.title} - {script.content.slice(0, 30)}...
            </option>
          ))}
        </select>
        <button onClick={handleEdit} disabled={!selectedScriptId} style={{ marginLeft: 10 }}>Edit</button>
        <button onClick={handleNew} style={{ marginLeft: 6 }}>New Script</button>
      </div>

      {/* Script Editor Modal (inline for now) */}
      {isEditing && (
        <div style={{ border: "1px solid #ccc", borderRadius: 6, padding: 16, marginBottom: 20, background: "#fafbfc" }}>
          <h3>{isNew ? "New Script" : "Edit Script"}</h3>
          {error && (
            <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>
          )}
          <input
            type="text"
            placeholder="Script Title"
            value={editorTitle}
            onChange={(e) => setEditorTitle(e.target.value)}
            style={{ width: "100%", marginBottom: 8, padding: 6 }}
          />
          <textarea
            placeholder="Script Content"
            value={editorContent}
            onChange={(e) => setEditorContent(e.target.value)}
            style={{ width: "100%", minHeight: 80, marginBottom: 8, padding: 6 }}
          />
          <button onClick={handleSave} style={{ marginRight: 10 }}>Save</button>
          <button onClick={() => setIsEditing(false)}>Cancel</button>
        </div>
      )}

      {/* Start Campaign Button */}
      <button
        onClick={handleStartCampaign}
        disabled={!selectedLeadListId || !selectedScriptId}
        style={{ width: "100%", padding: 12, background: "#1c7c54", color: "#fff", border: "none", borderRadius: 4, fontSize: 16 }}
      >
        Start Campaign
      </button>
    </div>
  );
}
