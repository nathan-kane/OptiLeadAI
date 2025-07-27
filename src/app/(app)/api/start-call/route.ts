import { NextRequest, NextResponse } from 'next/server';

// IMMEDIATE TEST: This should appear in Next.js terminal when route loads
console.log('🚨 [ROUTE_LOAD_TEST] start-call route.ts file is being loaded!');
console.log('🚨 [ROUTE_LOAD_TEST] Current timestamp:', new Date().toISOString());

// HARDCODED: Use the correct service URL to ensure calls go through our personalization logic
const baseUrl = process.env.NEXT_PUBLIC_CALL_SERVICE_URL || 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app';
const EXTERNAL_API_URL = `${baseUrl}/api/start-call`;

console.log('[CRITICAL_DEBUG] ==================== NEXT.JS API ROUTE CONFIGURATION ====================');
console.log('[CRITICAL_DEBUG] Environment variable NEXT_PUBLIC_CALL_SERVICE_URL:', process.env.NEXT_PUBLIC_CALL_SERVICE_URL);
console.log('[CRITICAL_DEBUG] Using baseUrl:', baseUrl);
console.log('[CRITICAL_DEBUG] Final EXTERNAL_API_URL:', EXTERNAL_API_URL);

export async function POST(req: NextRequest) {
  console.log('[API/start-call] Using backend URL:', EXTERNAL_API_URL);
  try {
    const body = await req.json();
    console.log('[API/start-call] Received body:', body);
    
    // Extract parameters (support both old and new parameter names)
    const phoneNumber = body.phoneNumber || body.phone_number;
    const prospectName = body.prospectName || body.name || '';
    const promptId = body.promptId || body.documentId || body.prompt_id;
    const voiceId = body.voiceId || body.voice_id || 'default';
    
    if (!phoneNumber) {
      console.warn('[API/start-call] Missing required field: phoneNumber');
      return NextResponse.json({ success: false, message: 'phoneNumber is required' }, { status: 400 });
    }
    
    if (!promptId) {
      console.warn('[API/start-call] Missing required field: promptId');
      return NextResponse.json({ success: false, message: 'promptId is required' }, { status: 400 });
    }
    
    console.log('[API/start-call] ==================== FORWARDING TO BACKEND ====================');
    console.log('[API/start-call] Forwarding to backend URL:', EXTERNAL_API_URL);
    console.log('[API/start-call] Forwarding parameters:', { phoneNumber, prospectName, promptId, voiceId });
    
    const startTime = Date.now();
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, prospectName, promptId, voiceId }),
    });
    const endTime = Date.now();
    
    console.log('[API/start-call] ==================== BACKEND RESPONSE ====================');
    console.log('[API/start-call] Response status:', externalRes.status);
    console.log('[API/start-call] Response headers:', Object.fromEntries(externalRes.headers.entries()));
    console.log('[API/start-call] Response time:', endTime - startTime, 'ms');
    
    let data;
    try {
      data = await externalRes.clone().json();
      console.log('[API/start-call] Backend response data:', data);
    } catch (parseErr) {
      const text = await externalRes.text();
      console.error('[API/start-call] Backend response not JSON:', text);
      console.error('[API/start-call] Parse error:', parseErr);
      return NextResponse.json({ success: false, message: 'Backend did not return JSON', raw: text }, { status: 502 });
    }
    return NextResponse.json(data, { status: externalRes.status });
  } catch (error: any) {
    console.error('[API/start-call] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
