import { NextRequest, NextResponse } from 'next/server';

// Optionally set your API key here or load from env
const CALL_SERVICE_API_KEY = process.env.CALL_SERVICE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    // Optionally enforce API key authentication
    const apiKey = req.headers.get('x-api-key');
    if (CALL_SERVICE_API_KEY && apiKey !== CALL_SERVICE_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { call_sid, summary, metadata } = body;

    // Outbound HTTP request to httpbin.org/post
    const outboundRes = await fetch('https://httpbin.org/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ call_sid, summary, metadata })
    });
    const outboundData = await outboundRes.json();

    // Respond with the outbound call's response
    return NextResponse.json({ received: true, outbound: outboundData }, { status: 200 });
  } catch (err: any) {
    console.error('Error processing summary:', err);
    return NextResponse.json({ error: 'Invalid request', details: err.message }, { status: 400 });
  }
}
