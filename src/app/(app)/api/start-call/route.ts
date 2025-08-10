import { NextRequest, NextResponse } from 'next/server';

// This is the URL of your external calling service (e.g., a Cloud Run service that bridges Twilio and ElevenLabs)
const EXTERNAL_API_URL = process.env.CALL_SERVICE_URL || 'https://your-calling-service-url.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phoneNumber, prospectName, promptId } = body;

    if (!phoneNumber || !prospectName || !promptId) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: phoneNumber, prospectName, promptId' },
        { status: 400 }
      );
    }

    // Forward the request to the external calling service
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber, prospectName, promptId }),
    });

    if (!externalRes.ok) {
        const errorData = await externalRes.text();
        console.error('External API Error:', errorData);
        return NextResponse.json(
            { success: false, message: 'Failed to initiate call via external service.', details: errorData },
            { status: externalRes.status }
        );
    }
    
    const data = await externalRes.json();

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('[API/start-call] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
