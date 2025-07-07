import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

export async function POST(req: NextRequest) {
  const { title, prompt } = await req.json();
  if (!title || !prompt) {
    return NextResponse.json({ error: 'Title and prompt are required' }, { status: 400 });
  }
  try {
    const docRef = await addDoc(collection(db, 'systemPrompts'), { title, prompt });
    return NextResponse.json({ id: docRef.id, title, prompt });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const querySnapshot = await getDocs(collection(db, 'systemPrompts'));
    const prompts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
  }
}
