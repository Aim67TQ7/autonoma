import { NextRequest, NextResponse } from 'next/server';
import { processIntakeMessage, ConversationContext } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, context } = body as {
      message: string;
      context: ConversationContext;
    };

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const result = await processIntakeMessage(message, context);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Intake processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
