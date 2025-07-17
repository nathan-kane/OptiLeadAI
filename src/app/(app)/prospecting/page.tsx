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
      // Wait 3-5 seconds between calls
      const delay = 3000 + Math.floor(Math.random() * 2000);
      await new Promise(res => setTimeout(res, delay));
    }
    setCampaignLoading(false);
    setCampaignStatus('Campaign completed.');
  };

  // Handler for single outbound call
  function isValidE164(phone: string) {
    return /^\+\d{10,15}$/.test(phone);
  }

  // Determine the endpoint used for the call
  const apiEndpoint = '/api/start-call';

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
      if (!res.ok || !data.success) {
        setSingleCallStatus(`Failed to call ${singlePhone}: ${data.message}`);
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
      <div style={{ marginBottom: 8, color: '#888', fontSize: 13 }}>
        <strong>Endpoint used:</strong> {apiEndpoint}
      </div>
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
          disabled={campaignLoading || leads.length === 0 || !selectedPrompt?.id}
          style={{ padding: '12px 24px', background: leads.length === 0 || !selectedPrompt?.id ? '#ccc' : '#1c7c54', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
        >
          {campaignLoading ? 'Starting Campaign...' : 'Start Campaign'}
        </button>
        {campaignStatus && <div style={{ marginTop: 12 }}>{campaignStatus}</div>}
      </div>
    </div>
  );
}
