import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[API/start-call] Received body:', body);
    const { phone_number, voice_id, system_prompt } = body;
    if (!phone_number || !voice_id) {
      console.warn('[API/start-call] Missing required fields:', { phone_number, voice_id });
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, voice_id, system_prompt }),
    });
    let data;
    try {
      data = await externalRes.clone().json();
    } catch (parseErr) {
      const text = await externalRes.text();
      console.error('[API/start-call] Backend response not JSON:', text);
      return NextResponse.json({ success: false, message: 'Backend did not return JSON', raw: text }, { status: 502 });
    }
    console.log('[API/start-call] Backend response:', data);
    return NextResponse.json(data, { status: externalRes.status });
  } catch (error: any) {
    console.error('[API/start-call] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
