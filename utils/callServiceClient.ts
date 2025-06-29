// Utility to trigger outbound calls via Call Service

export async function triggerOutboundCall(to_phone: string): Promise<{ success: boolean; message: string }> {
  const CALL_SERVICE_URL = process.env.NEXT_PUBLIC_CALL_SERVICE_URL || '';
  const CALL_SERVICE_API_KEY = process.env.NEXT_PUBLIC_CALL_SERVICE_API_KEY || '';
  if (!CALL_SERVICE_URL || !CALL_SERVICE_API_KEY) {
    return { success: false, message: 'Call Service URL or API Key not set' };
  }
  try {
    const res = await fetch(`${CALL_SERVICE_URL}/twilio/call?to_phone=${encodeURIComponent(to_phone)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': CALL_SERVICE_API_KEY,
      },
      body: JSON.stringify({}), // send empty body or remove if not needed
    });
    if (!res.ok) {
      const error = await res.text();
      return { success: false, message: `Call failed: ${error}` };
    }
    return { success: true, message: 'Call initiated successfully!' };
  } catch (err: any) {
    return { success: false, message: `Error: ${err.message}` };
  }
}

