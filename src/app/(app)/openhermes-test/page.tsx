"use client";

import { useState } from 'react';
//import { getAIResponse } from '@/utils/openHermesClient';
import { triggerOutboundCall } from '@/utils/callServiceClient';

export default function OpenHermesChatPage() {
  const [phone, setPhone] = useState('');
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [summaryStatus, setSummaryStatus] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const handleCall = async () => {
    setLoading(true);
    setCallStatus(null);
    const result = await triggerOutboundCall(phone);
    setCallStatus(result.message);
    setLoading(false);
  };

  const handleSummaryTest = async () => {
    setSummaryLoading(true);
    setSummaryStatus(null);
    try {
      const res = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_sid: 'test_sid_123',
          summary: 'This is a test summary.',
          metadata: { phone }
        })
      });
      const data = await res.json();
      setSummaryStatus(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setSummaryStatus('Error: ' + e.message);
    }
    setSummaryLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '2rem auto', padding: 20, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Trigger Outbound Call</h2>
      <input
        type="tel"
        placeholder="Enter phone number (e.g. +1234567890)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        style={{ width: '100%', padding: 8, marginBottom: 12 }}
      />
      <button
        onClick={handleCall}
        disabled={loading || !phone}
        style={{ width: '100%', padding: 10, background: '#0070f3', color: '#fff', border: 'none', borderRadius: 4 }}
      >
        {loading ? 'Calling...' : 'Trigger Call'}
      </button>
      {callStatus && <div style={{ marginTop: 16 }}>{callStatus}</div>}

      <hr style={{ margin: '2rem 0' }} />
      <h2>Test Backend Outbound Call</h2>
      <button
        onClick={handleSummaryTest}
        disabled={summaryLoading}
        style={{ width: '100%', padding: 10, background: '#1c7c54', color: '#fff', border: 'none', borderRadius: 4 }}
      >
        {summaryLoading ? 'Testing...' : 'Test /api/summary Outbound'}
      </button>
      {summaryStatus && (
        <pre style={{ marginTop: 16, background: '#f6f8fa', padding: 10, borderRadius: 4, fontSize: 13 }}>
          {summaryStatus}
        </pre>
      )}
    </div>
  );
}
