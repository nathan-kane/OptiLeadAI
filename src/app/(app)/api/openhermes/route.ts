import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log("API route hit");
  const { prompt } = await req.json();

  try {
    const aiRes = await axios.post('http://localhost:11434/api/generate', {
      model: 'openhermes',
      prompt,
      stream: false
    });
    return NextResponse.json(aiRes.data);
  } catch (err: any) {
    console.log(err);
    console.error(err.message);
    return new NextResponse(JSON.stringify({ error: 'Error communicating with OpenHermes' }), { status: 500 });
  }
}