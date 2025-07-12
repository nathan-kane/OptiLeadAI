import { NextRequest, NextResponse } from 'next/server';
import { triggerOutboundCall } from '@/utils/callServiceClient';

export async function POST(req: NextRequest) {
  try {
    const { name, phoneNumber, scriptId } = await req.json();
    if (!name || !phoneNumber || !scriptId) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }
    const result = await triggerOutboundCall({ to_phone: phoneNumber, script_id: scriptId });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 });
  }
}
