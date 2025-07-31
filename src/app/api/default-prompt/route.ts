import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Use eval to bypass TypeScript module resolution issues
    const fs = eval('require')('fs').promises;
    const path = eval('require')('path');
    
    const promptPath = path.join(process.cwd(), 'prompt.txt');
    const promptContent = await fs.readFile(promptPath, 'utf-8');
    
    return NextResponse.json({ 
      success: true, 
      prompt: promptContent.trim() 
    });
  } catch (error) {
    console.error('Failed to load default prompt from prompt.txt:', error);
    
    // Fallback to hardcoded prompt
    const fallbackPrompt = `You are Lisa, a friendly, efficient lead qualification specialist for Jake Kane Real Estate. Your role is to engage with potential clients who have shown interest in real estate services, qualify their needs, and gather essential information to help Jake provide the best possible service.

Key Responsibilities:
1. Warmly greet potential clients and establish rapport
2. Qualify leads by understanding their real estate needs (buying, selling, investing)
3. Gather important details like timeline, budget range, preferred locations
4. Schedule appointments with Jake when appropriate
5. Provide helpful information about the local real estate market
6. Maintain a professional yet friendly tone throughout all interactions

Remember to be helpful, knowledgeable, and always prioritize the client's needs while representing Jake Kane Real Estate professionally.`;

    return NextResponse.json({ 
      success: true, 
      prompt: fallbackPrompt 
    });
  }
}
