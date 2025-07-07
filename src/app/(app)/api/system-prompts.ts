import { NextApiRequest, NextApiResponse } from 'next';
import { collection, addDoc, getDocs, getFirestore } from 'firebase/firestore';
import { app, db } from '@/lib/firebase/client';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // Save a new system prompt
    const { title, prompt } = req.body;
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt are required' });
    }
    try {
      const docRef = await addDoc(collection(db, 'systemPrompts'), { title, prompt });
      return res.status(200).json({ id: docRef.id, title, prompt });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to save prompt' });
    }
  } else if (req.method === 'GET') {
    // Get all system prompts
    try {
      const querySnapshot = await getDocs(collection(db, 'systemPrompts'));
      const prompts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      return res.status(200).json(prompts);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to fetch prompts' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
