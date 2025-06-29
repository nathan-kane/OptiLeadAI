import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for demo; replace with your DB logic
let scripts: any[] = [];

export async function GET() {
  return NextResponse.json(scripts);
}

export async function POST(req: NextRequest) {
  const { title, content } = await req.json();
  if (!title || !content) {
    return NextResponse.json({ error: 'Title and content are required.' }, { status: 400 });
  }
  const newScript = {
    id: uuidv4(),
    title,
    content,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scripts.push(newScript);
  return NextResponse.json(newScript);
}

export async function PUT(req: NextRequest) {
  const { id, title, content } = await req.json();
  if (!id || !title || !content) {
    return NextResponse.json({ error: 'ID, title, and content are required.' }, { status: 400 });
  }
  const scriptIdx = scripts.findIndex((s) => s.id === id);
  if (scriptIdx === -1) {
    return NextResponse.json({ error: 'Script not found.' }, { status: 404 });
  }
  scripts[scriptIdx] = {
    ...scripts[scriptIdx],
    title,
    content,
    updatedAt: new Date().toISOString(),
  };
  return NextResponse.json(scripts[scriptIdx]);
}
