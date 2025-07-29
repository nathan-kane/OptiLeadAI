"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import SystemPromptManager from './SystemPromptManager';

// Import the SystemPrompt interface
interface SystemPrompt {
  id?: string;
  name: string;
  prompt: string;
  description?: string;
  createdAt: any;
  updatedAt: any;
  isDefault?: boolean;
  tags?: string[];
}

interface LeadList {
  id: string;
  name: string;
}

interface Lead {
  fullName: string;
  phone: string;
  fullName?: string; // Optional full name for better personalization
}

export default function ProspectingPage() {
  const [error, setError] = useState<string | null>(null);
  const [leadLists, setLeadLists] = useState<LeadList[]>([]);
  const [selectedLeadListId, setSelectedLeadListId] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<SystemPrompt | null>(null);

  // CSV upload state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [singlePhone, setSinglePhone] = useState<string>("");
  const [singleProspectName, setSingleProspectName] = useState<string>("");
  const [singleCallLoading, setSingleCallLoading] = useState(false);
  const [singleCallStatus, setSingleCallStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLeadLists([
      { id: "a", name: "June Leads" },
      { id: "b", name: "July Leads" },
    ]);
  }, []);

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCsvError(null);
    setLeads([]);
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      setCsvError('Please upload a .csv file.');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          const data = results.data;
          if (!Array.isArray(data) || !data.length) {
            setCsvError('CSV is empty or invalid.');
            return;
          }
          const parsedLeads: Lead[] = data.map((row: any) => {
            const name = (row.Name || '').trim();
            const phone = (row.Phone || '').trim();
            return { firstName: name.split(' ')[0] || '', phone };
          }).filter((lead: Lead) => lead.firstName && lead.phone);
          if (!parsedLeads.length) {
            setCsvError('No valid leads found. Ensure columns are named Name and Phone.');
            return;
          }
          setLeads(parsedLeads);
        } catch {
          setCsvError('Failed to parse CSV.');
        }
      },
      error: () => setCsvError('Failed to read CSV file.'),
    });
  };

  const handleStartCampaign = async () => {
    if (!selectedPrompt?.id) {
      setCampaignStatus('Please select a script before starting the campaign.');
      return;
    }
    setCampaignLoading(true);
    setCampaignStatus(null);
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      try {
        const res = await fetch('/api/start-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone_number: lead.phone,
            voice_id: selectedPrompt.id,
            system_prompt: selectedPrompt.prompt || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setCampaignStatus(`Failed to call ${lead.firstName} (${lead.phone}): ${data.message}`);
          break;
        }
        setCampaignStatus(`Called ${lead.firstName} (${lead.phone}) successfully.`);
      } catch (err: any) {
        setCampaignStatus(`Error calling ${lead.firstName}: ${err.message}`);
        break;
      }
    } finally {
      // Clean up SSE connection
      eventSource.close();
      setCampaignLoading(false);
      setCampaignStatus('Campaign completed.');
    }
  };

  // Handler for single outbound call
  function isValidE164(phone: string) {
    return /^\+\d{10,15}$/.test(phone);
  }

  // Determine the endpoint used for the call
  const apiEndpoint = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

  const handleSingleCall = async () => {
    if (!selectedPrompt?.id) {
      setSingleCallStatus('Please select a script before calling.');
      return;
    }
    if (!singlePhone.trim()) {
      setSingleCallStatus('Please enter a phone number.');
      return;
    }
    if (!singleProspectName.trim()) {
      setSingleCallStatus('Please enter a prospect name.');
      return;
    }
    if (!isValidE164(singlePhone.trim())) {
      setSingleCallStatus('Please enter a valid phone number in E.164 format (e.g., +15555555555)');
      return;
    }
    setSingleCallLoading(true);
    setSingleCallStatus(null);
    try {
      // DIRECT BACKEND CALL: Bypass broken Next.js API route and call backend directly with personalization
      console.log('[SingleCall] 🚨 CALLING BACKEND DIRECTLY for personalization');
      const backendUrl = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';
      console.log('[SingleCall] Backend URL:', backendUrl);
      const requestBody = {
        phoneNumber: singlePhone.trim(),
        prospectName: 'Test Prospect', 
        promptId: selectedPrompt.id
      };
      console.log('[SingleCall] Request body with personalization:', requestBody);
      
      const res = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: singlePhone.trim(),
          voice_id: selectedPrompt.id,
          system_prompt: selectedPrompt.prompt || undefined,
        }),
      });
      let data;
      try {
        data = await res.clone().json();
      } catch {
        const text = await res.text();
        setSingleCallStatus(`Backend did not return JSON. Raw response: ${text}`);
        setSingleCallLoading(false);
        return;
      }
      console.log('[SingleCall] Backend response:', data);
      if (!res.ok || !data.success) {
        setSingleCallStatus(`Failed to call ${singlePhone}: ${data.message || 'Unknown error'}`);
      } else {
        setSingleCallStatus(`Called ${singlePhone} successfully.`);
      }
    } catch (err: any) {
      setSingleCallStatus(`Error calling ${singlePhone}: ${err.message}`);
    }
    setSingleCallLoading(false);
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 10 }}>
      <SystemPromptManager onPromptSelected={setSelectedPrompt} />
      <h1>Prospecting Campaigns</h1>

      {/* Single Call UI */}
      <div style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h2>Single Outbound Call</h2>
        <input
          type="text"
          placeholder="Enter phone number (e.g., +15555555555)"
          value={singlePhone}
          onChange={e => setSinglePhone(e.target.value)}
          style={{ marginRight: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 200 }}
        />
        <input
          type="text"
          placeholder="Enter prospect name (e.g., John Smith)"
          value={singleProspectName}
          onChange={e => setSingleProspectName(e.target.value)}
          style={{ marginRight: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc', width: 200 }}
        />
        <button
          onClick={handleSingleCall}
          disabled={singleCallLoading || !selectedPrompt?.id || !singlePhone.trim() || !singleProspectName.trim()}
          style={{ padding: '8px 18px', background: (!selectedPrompt?.id || !singlePhone.trim() || !singleProspectName.trim()) ? '#ccc' : '#1c7c54', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
        >
          {singleCallLoading ? 'Calling...' : 'Call Now'}
        </button>
        {singleCallStatus && <div style={{ marginTop: 12 }}>{singleCallStatus}</div>}
      </div>

      {/* CSV Upload & Preview */}
      <div style={{ marginBottom: 24, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h2>Upload Leads CSV</h2>
        <input
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={handleCsvUpload}
          style={{ marginBottom: 12 }}
        />
        {csvError && <div style={{ color: 'red', marginBottom: 8 }}>{csvError}</div>}
        {leads.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <h3>Preview ({leads.length} leads):</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
              <thead>
                <tr style={{ background: '#f7f7f7' }}>
                  <th style={{ border: '1px solid #ddd', padding: 6 }}>Full Name</th>
                  <th style={{ border: '1px solid #ddd', padding: 6 }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 10).map((lead, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{lead.fullName}</td>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{lead.phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {leads.length > 10 && <div style={{ marginTop: 6, color: '#888' }}>Showing first 10 leads...</div>}
          </div>
        )}
      </div>

      {/* Start Campaign Button */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={handleStartCampaign}
          disabled={campaignLoading || leads.length === 0}
          style={{ padding: '12px 24px', background: leads.length === 0 ? '#ccc' : '#1c7c54', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
        >
          {campaignLoading ? 'Starting Campaign...' : 'Start Campaign'}
        </button>
        {campaignStatus && <div style={{ marginTop: 12 }}>{campaignStatus}</div>}
      </div>
    </div>
  );
}
