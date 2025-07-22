import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Incoming request body:', body);
    const { phone_number, voice_id, system_prompt, name } = body;
    if (!phone_number || !voice_id) {
      console.error('Missing required fields:', { phone_number, voice_id });
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number, voice_id, system_prompt, name }),
    });
    
    console.log('External API status:', externalRes.status);
    
    let data;
    const responseText = await externalRes.text();
    
    try {
      data = JSON.parse(responseText);
      console.log('External API response:', data);
    } catch (jsonError) {
      // External API returned non-JSON (likely HTML error page)
      console.error('External API returned non-JSON response:', responseText.substring(0, 200));
      return NextResponse.json(
        { success: false, message: `External API error: HTTP ${externalRes.status} - ${responseText.substring(0, 100)}` },
        { status: 502 }
      );
    }
    
    return NextResponse.json(data, { status: externalRes.status });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
