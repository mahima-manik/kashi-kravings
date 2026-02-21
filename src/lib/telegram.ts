import { DashboardData } from './types';

const TELEGRAM_API_URL = 'https://api.telegram.org/bot';

interface TelegramResponse {
  ok: boolean;
  result?: unknown;
  description?: string;
}

export async function sendTelegramMessage(message: string): Promise<boolean> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.error('Telegram credentials not configured');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });

    const data: TelegramResponse = await response.json();

    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDailySummaryMessage(data: DashboardData): string {
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Get today's data
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = data.salesRecords.filter((r) => r.date === todayStr);

  const todayRevenue = todayRecords.reduce((sum, r) => sum + r.saleValue, 0);
  const todayUnits = todayRecords.reduce(
    (sum, r) =>
      sum +
      r.paanL +
      r.thandaiL +
      r.giloriL +
      r.paanS +
      r.thandaiS +
      r.giloriS +
      r.heritageBox9 +
      r.heritageBox15,
    0
  );

  const storesSummary = data.storeSummaries
    .filter((s) => todayRecords.some((r) => r.location === s.storeCode))
    .map((s) => {
      const storeToday = todayRecords.filter((r) => r.location === s.storeCode);
      const revenue = storeToday.reduce((sum, r) => sum + r.saleValue, 0);
      return `  • ${s.storeName}: ${formatCurrency(revenue)}`;
    })
    .join('\n');

  const message = `
<b>🍫 Kashi Kravings Daily Report</b>
<i>${today}</i>

<b>📊 Today's Summary</b>
━━━━━━━━━━━━━━━━━━
💰 Revenue: ${formatCurrency(todayRevenue)}
📦 Units Sold: ${todayUnits.toLocaleString('en-IN')}
🏪 Active Stores: ${data.storesActiveToday}/6

<b>🏪 Store Performance</b>
━━━━━━━━━━━━━━━━━━
${storesSummary || '  No sales recorded today'}

<b>📈 Overall Stats</b>
━━━━━━━━━━━━━━━━━━
Total Revenue: ${formatCurrency(data.totalRevenue)}

<i>Generated at ${new Date().toLocaleTimeString('en-IN')}</i>
`;

  return message.trim();
}

export function formatAlertMessage(type: string, details: string): string {
  const icons: Record<string, string> = {
    low_stock: '⚠️',
    high_outstanding: '💳',
    target_achieved: '🎯',
    new_sale: '🛒',
  };

  const icon = icons[type] || '📢';

  return `
${icon} <b>Kashi Kravings Alert</b>

${details}

<i>${new Date().toLocaleString('en-IN')}</i>
`.trim();
}
