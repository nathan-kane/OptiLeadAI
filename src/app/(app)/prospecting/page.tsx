"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import SystemPromptManager from './SystemPromptManager';

interface LeadList {
  id: string;
  name: string;
}

interface Lead {
  firstName: string;
  phone: string;
}

export default function ProspectingPage() {
  const [error, setError] = useState<string | null>(null);
  const [leadLists, setLeadLists] = useState<LeadList[]>([]);
  const [selectedLeadListId, setSelectedLeadListId] = useState<string>("");
  const [selectedPrompt, setSelectedPrompt] = useState<{ id: string; title: string; prompt: string } | null>(null);

  // CSV upload state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [singlePhone, setSinglePhone] = useState<string>("");
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
            const name = (row['FULL NAME'] || '').trim();
            const phone = (row['PHONE'] || '').trim();
            return { firstName: name.split(' ')[0] || '', phone };
          }).filter((lead: Lead) => lead.firstName && lead.phone);
          if (!parsedLeads.length) {
            setCsvError('No valid leads found. Ensure columns are named FULL NAME and PHONE.');
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
    
    // Set up SSE connection for call completion notifications
    const eventSource = new EventSource('/api/call-events');
    let callCompletionPromise: Promise<void> | null = null;
    let currentPhoneNumber: string | null = null;
    
    const waitForCallCompletion = (phoneNumber: string): Promise<void> => {
      return new Promise((resolve) => {
        currentPhoneNumber = phoneNumber;
        let resolved = false;
        
        // Set up SSE listener for call completion
        const handleMessage = (event: MessageEvent) => {
          try {
            const eventData = JSON.parse(event.data);
            if (eventData.type === 'call_ended' && eventData.data.phone_number === phoneNumber) {
              console.log(`[Campaign] Call completed for ${phoneNumber}:`, eventData.data);
              eventSource.removeEventListener('message', handleMessage);
              if (!resolved) {
                resolved = true;
                resolve();
              }
            }
          } catch (err) {
            console.error('[Campaign] Error parsing SSE event:', err);
          }
        };
        eventSource.addEventListener('message', handleMessage);
        
        // Fallback timeout (2 minutes) in case SSE events aren't working
        const timeoutId = setTimeout(() => {
          console.log(`[Campaign] Timeout waiting for call completion for ${phoneNumber}, proceeding to next call`);
          eventSource.removeEventListener('message', handleMessage);
          if (!resolved) {
            resolved = true;
            resolve();
          }
        }, 120000); // 2 minutes
        
        // Clean up timeout if SSE event arrives first
        const originalResolve = resolve;
        resolve = () => {
          clearTimeout(timeoutId);
          originalResolve();
        };
      });
    };
    
    try {
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        try {
          const requestBody = {
            phone_number: lead.phone,
            voice_id: selectedPrompt?.id || 'default-voice',
            system_prompt: selectedPrompt?.prompt || undefined,
            name: lead.firstName,
          };
          console.log(`[Campaign] Calling ${lead.firstName} at ${lead.phone}:`, requestBody);
          
          const res = await fetch('/api/start-call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
          });
          console.log(`[Campaign] Response status: ${res.status}`);
          
          let data;
          try {
            data = await res.json();
          } catch (jsonErr) {
            console.error(`[Campaign] Failed to parse JSON response:`, jsonErr);
            setCampaignStatus(`Failed to call ${lead.firstName} (${lead.phone}): Invalid response format`);
            break;
          }
          
          console.log(`[Campaign] Response data:`, data);
          
          if (!res.ok || !data.success) {
            setCampaignStatus(`Failed to call ${lead.firstName} (${lead.phone}): ${data.message || `HTTP ${res.status}`}`);
            break;
          }
          
          setCampaignStatus(`Call started for ${lead.firstName} (${lead.phone}). Waiting for completion...`);
          
          // Wait for call completion via SSE before proceeding to next call
          await waitForCallCompletion(lead.phone);
          
          setCampaignStatus(`Call completed for ${lead.firstName} (${lead.phone}).`);
          
        } catch (err: any) {
          console.error(`[Campaign] Network/fetch error:`, err);
          setCampaignStatus(`Error calling ${lead.firstName}: ${err.message}`);
          break;
        }
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
    if (!isValidE164(singlePhone.trim())) {
      setSingleCallStatus('Please enter a valid phone number in E.164 format (e.g., +15555555555)');
      return;
    }
    setSingleCallLoading(true);
    setSingleCallStatus(null);
    try {
      console.log('[SingleCall] Using endpoint:', apiEndpoint);
      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: singlePhone.trim(),
          voice_id: selectedPrompt.id,
          system_prompt: selectedPrompt.prompt || undefined,
          // Assuming you have a way to get the name for a single call, add it here
          // For now, we'll just pass an empty string or a placeholder
          name: '' 
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
          placeholder="Enter phone number"
          value={singlePhone}
          onChange={e => setSinglePhone(e.target.value)}
          style={{ marginRight: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button
          onClick={handleSingleCall}
          disabled={singleCallLoading || !selectedPrompt?.id || !singlePhone.trim()}
          style={{ padding: '8px 18px', background: (!selectedPrompt?.id || !singlePhone.trim()) ? '#ccc' : '#1c7c54', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
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
                  <th style={{ border: '1px solid #ddd', padding: 6 }}>First Name</th>
                  <th style={{ border: '1px solid #ddd', padding: 6 }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {leads.slice(0, 10).map((lead, idx) => (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #ddd', padding: 6 }}>{lead.firstName}</td>
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
