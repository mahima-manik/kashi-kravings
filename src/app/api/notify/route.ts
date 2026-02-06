import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, formatAlertMessage } from '@/lib/telegram';
import { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, message } = body;

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const formattedMessage = type
      ? formatAlertMessage(type, message)
      : message;

    const sent = await sendTelegramMessage(formattedMessage);

    const response: ApiResponse<{ sent: boolean }> = {
      success: sent,
      data: { sent },
      error: sent ? undefined : 'Failed to send notification',
    };

    return NextResponse.json(response, { status: sent ? 200 : 500 });
  } catch (error) {
    console.error('Error sending notification:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}
