import { NextRequest, NextResponse } from 'next/server';

const EXTERNAL_API_URL = 'https://twilio-elevenlabs-bridge-295347007268.us-central1.run.app/api/start-call';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('=== START CALL REQUEST ===');
    console.log('Incoming request body:', JSON.stringify(body, null, 2));
    
    const { phoneNumber, prospectName, promptId } = body;
    
    console.log('Extracted parameters:');
    console.log('- phoneNumber:', phoneNumber);
    console.log('- prospectName:', prospectName);
    console.log('- promptId:', promptId);
    console.log('- promptId type:', typeof promptId);
    
    if (!phoneNumber || !prospectName || !promptId) {
      console.error('❌ Missing required fields:', { phoneNumber, prospectName, promptId });
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields: phoneNumber, prospectName, and promptId are required' 
      }, { status: 400 });
    }
    
    // Map new parameters to external API format
    const externalApiBody = {
      phone_number: phoneNumber,
      name: prospectName,
      prompt_id: promptId,
      // Add any other required fields for the external API
      voice_id: 'default' // You may want to make this configurable
    };
    
    console.log('✅ Sending to external API:');
    console.log('- URL:', EXTERNAL_API_URL);
    console.log('- Body:', JSON.stringify(externalApiBody, null, 2));
    console.log('- promptId being sent:', externalApiBody.prompt_id);
    console.log('- IMPORTANT: This promptId should override the default ElevenLabs system prompt');
    
    const externalRes = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(externalApiBody),
    });
    
    console.log('External API status:', externalRes.status);
    
    let data;
    const responseText = await externalRes.text();
    
    try {
      data = JSON.parse(responseText);
      console.log('🔍 External API response:', JSON.stringify(data, null, 2));
      
      // Log specific details about prompt handling
      if (data.prompt_id || data.system_prompt) {
        console.log('📝 System Prompt Details:');
        console.log('- Response prompt_id:', data.prompt_id);
        console.log('- Response system_prompt:', data.system_prompt ? 'Present' : 'Not present');
        console.log('- Original promptId sent:', promptId);
        
        if (data.prompt_id !== promptId) {
          console.warn('⚠️  WARNING: Response prompt_id does not match sent promptId!');
          console.warn('- Sent:', promptId);
          console.warn('- Received:', data.prompt_id);
        }
      } else {
        console.warn('⚠️  WARNING: No prompt_id or system_prompt found in response!');
        console.warn('This might indicate the external API is not using the custom prompt.');
      }
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
