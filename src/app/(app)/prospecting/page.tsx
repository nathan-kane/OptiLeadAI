"use client";

import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import SystemPromptManager from './SystemPromptManager';
import { Lead } from '../../../types/Lead';

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
          
          // Debug: log the first row to see column names
          console.log('CSV Headers:', Object.keys(data[0] || {}));
          console.log('First row:', data[0]);
          
          const parsedLeads: Lead[] = data.map((row: any) => {
            // Try different possible column name variations
            const nameField = row.Name || row.name || row.NAME || 
                             row['Full Name'] || row['full name'] || 
                             row.firstName || row.FirstName || 
                             row['First Name'] || row['first name'] || '';
            const phoneField = row.Phone || row.phone || row.PHONE || 
                              row['Phone Number'] || row['phone number'] || 
                              row.phoneNumber || row.PhoneNumber || '';
            
            const name = String(nameField).trim();
            const phone = String(phoneField).trim();
            
            return { 
              firstName: name.split(' ')[0] || name || '', 
              fullName: name || '',
              phone: phone 
            };
          }).filter((lead: Lead) => lead.firstName && lead.phone);
          
          if (!parsedLeads.length) {
            setCsvError(`No valid leads found. Found columns: ${Object.keys(data[0] || {}).join(', ')}. Expected: Name/name and Phone/phone columns.`);
            return;
          }
          setLeads(parsedLeads);
        } catch (error) {
          console.error('CSV parsing error:', error);
          setCsvError('Failed to parse CSV.');
        }
      },
      error: () => setCsvError('Failed to read CSV file.'),
    });
  };

  const handleStartCampaign = async () => {
    if (!selectedPrompt) {
      alert('Please select a prompt first.');
      return;
    }
    
    // Prevent multiple simultaneous campaigns
    if (campaignLoading) {
      console.log('[Campaign] Campaign already in progress, ignoring duplicate request');
      return;
    }
    
    setCampaignLoading(true);
    setCampaignStatus('🚀 Starting campaign...');
    
    console.log(`[Campaign] Starting sequential campaign with ${leads.length} prospects`);
    
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      
      try {
        console.log(`[Campaign] Processing prospect ${i + 1}/${leads.length}: ${lead.fullName}`);
        setCampaignStatus(`📞 Calling ${lead.fullName} (${lead.phone})... (${i + 1}/${leads.length})`);
        
        const res = await fetch('https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: lead.phone,
            prospectName: lead.fullName,
            promptId: selectedPrompt.id,
          }),
        });
        
        const data = await res.json();
        console.log(`[Campaign ${i + 1}/${leads.length}] API Response Status:`, res.status);
        console.log(`[Campaign ${i + 1}/${leads.length}] API Response Data:`, JSON.stringify(data, null, 2));
        
        if (!res.ok || !data.success) {
          const errorMsg = data.message || data.error || 'Unknown error';
          setCampaignStatus(`❌ Failed to call ${lead.fullName} (${lead.phone}): ${errorMsg}`);
          console.error(`[Campaign] Call failed for ${lead.fullName}:`, errorMsg);
          break;
        }
        
        console.log(`[Campaign] Call initiated successfully for ${lead.fullName}, Call ID: ${data.callId}`);
        setCampaignStatus(`✅ Call initiated for ${lead.fullName}. Waiting for call completion...`);
        
        // Only wait if there are more prospects to call
        if (i < leads.length - 1) {
          const callCompletionDelay = 120000; // 2 minutes - adjust as needed
          setCampaignStatus(`⏳ Call in progress for ${lead.fullName}. Next call starts in ${callCompletionDelay / 1000} seconds...`);
          
          console.log(`[Campaign] Waiting ${callCompletionDelay / 1000} seconds before next call...`);
          await new Promise(resolve => setTimeout(resolve, callCompletionDelay));
          
          setCampaignStatus(`✅ Call completed for ${lead.fullName}. Moving to next prospect...`);
          console.log(`[Campaign] Moving to next prospect after ${lead.fullName}`);
        } else {
          setCampaignStatus(`✅ Final call initiated for ${lead.fullName}. Campaign completing...`);
          console.log(`[Campaign] Final call initiated for ${lead.fullName}`);
        }
        
      } catch (err: any) {
        console.error(`[Campaign] Error calling ${lead.fullName}:`, err);
        setCampaignStatus(`❌ Error calling ${lead.fullName}: ${err.message}`);
        break;
      }
    }
    
    // Clean up after campaign completes
    setCampaignLoading(false);
    setCampaignStatus('🎉 Campaign completed successfully! All calls have been processed.');
    console.log('[Campaign] Campaign completed successfully');
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 24, border: "1px solid #eee", borderRadius: 10 }}>
      <SystemPromptManager onPromptSelected={setSelectedPrompt} />
      <h1>Prospecting Campaigns</h1>



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
