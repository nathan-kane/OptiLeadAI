import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Incoming request body:', body);
    const { phoneNumber, prospectName, promptId } = body;
    if (!phoneNumber || !prospectName) {
      console.error('Missing required fields:', { phoneNumber, prospectName });
      return NextResponse.json({ success: false, message: 'Missing required fields: phoneNumber and prospectName' }, { status: 400 });
    }
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, prospectName, promptId: promptId || 'rmtWIKWr8GMUGPkxlGDA' }),
    });
    const data = await externalRes.json();
    console.log('External API response:', data);
    return NextResponse.json(data, { status: externalRes.status });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
