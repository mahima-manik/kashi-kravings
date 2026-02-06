import { NextResponse } from 'next/server';
import { fetchSalesData } from '@/lib/google-sheets';
import { sendTelegramMessage, formatDailySummaryMessage } from '@/lib/telegram';

// This endpoint is designed to be called by Vercel Cron
// Configure in vercel.json with schedule: "0 21 * * *" for 9 PM IST daily

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron (in production)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In production, verify the cron secret
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch latest sales data
    const data = await fetchSalesData(true); // Force refresh

    // Format and send the daily summary
    const message = formatDailySummaryMessage(data);
    const sent = await sendTelegramMessage(message);

    if (!sent) {
      return NextResponse.json(
        { success: false, error: 'Failed to send Telegram message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Daily summary sent successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in daily summary cron:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send daily summary',
      },
      { status: 500 }
    );
  }
}
