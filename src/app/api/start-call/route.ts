import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('POST /api/start-call - Request received');
  
  try {
    const body = await req.json();
    console.log('Request body:', body);
    
    const { phoneNumber, prospectName, promptId } = body;

    if (!phoneNumber || !prospectName || !promptId) {
      console.log('Missing required parameters:', { phoneNumber: !!phoneNumber, prospectName: !!prospectName, promptId: !!promptId });
      const missing = [];
      if (!phoneNumber) missing.push('phoneNumber');
      if (!prospectName) missing.push('prospectName');
      if (!promptId) missing.push('promptId');
      
      return NextResponse.json(
        { success: false, message: `Missing required parameters: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    // External calling service URL
    const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';
    console.log('Forwarding to:', EXTERNAL_API_URL);

    // Get userId from request headers
    const userId = req.headers.get('X-User-ID');
    console.log('User ID from headers:', userId);

    // Forward the request to the external calling service
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-ID': userId || ''
      },
      body: JSON.stringify({ phoneNumber, prospectName, promptId, userId }),
    });

    console.log('External API response status:', externalRes.status);

    if (!externalRes.ok) {
        const errorData = await externalRes.text();
        console.error('External API Error:', errorData);
        return NextResponse.json(
            { success: false, message: 'Failed to initiate call via external service.', details: errorData },
            { status: externalRes.status }
        );
    }
    
    const data = await externalRes.json();
    console.log('External API success:', data);

    return NextResponse.json({ success: true, ...data });
  } catch (error: any) {
    console.error('[API/start-call] Error:', error);
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'start-call API route is working - use POST method' });
}
