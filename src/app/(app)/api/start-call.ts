import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone_number, voice_id, system_prompt } = body;
    if (!phone_number || !voice_id) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, voice_id, system_prompt }),
    });
    const data = await externalRes.json();
    return NextResponse.json(data, { status: externalRes.status });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
