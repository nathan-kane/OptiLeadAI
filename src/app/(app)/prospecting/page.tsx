"use client";

import { useState, useEffect } from "react";
import { triggerOutboundCall } from '@/utils/callServiceClient';

// Placeholder type for leads
interface LeadList {
  id: string;
  name: string;
}

export default function ProspectingPage() {
  const [error, setError] = useState<string | null>(null);
  // State for leads
  const [leadLists, setLeadLists] = useState<LeadList[]>([]);
  const [selectedLeadListId, setSelectedLeadListId] = useState<string>("");

  // State for outbound call
  const [phone, setPhone] = useState("");
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // TODO: Fetch from /api/leads
    setLeadLists([
      { id: "a", name: "June Leads" },
      { id: "b", name: "July Leads" },
    ]);
  }, []);

  const handleStartCampaign = () => {
    // TODO: POST to /api/campaigns/launch with selectedLeadListId
    alert(`Campaign started for lead list ${selectedLeadListId}`);
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


      {/* Trigger Outbound Call */}
      <div style={{ marginBottom: 20, border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
        <h2>Trigger Outbound Call</h2>
        <input
          type="tel"
          placeholder="Enter phone number (e.g. +1234567890)"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12 }}
        />
        <button
          onClick={async () => {
            setLoading(true);
            setCallStatus(null);
            const result = await triggerOutboundCall({ to_phone: phone, script_id: '' });
            setCallStatus(result.message);
            setLoading(false);
          }}
          disabled={loading || !phone}
          style={{ width: '100%', padding: 10, background: '#1c7c54', color: '#fff', border: 'none', borderRadius: 4 }}
        >
          {loading ? 'Calling...' : 'Trigger Call'}
        </button>
        {callStatus && <div style={{ marginTop: 16 }}>{callStatus}</div>}
      </div>
    </div>
  );
}
