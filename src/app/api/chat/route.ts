import { streamText, type UIMessage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { fetchSalesData } from '@/lib/google-sheets';
import { STORES, PRODUCTS } from '@/lib/types';
import type { Invoice } from '@/lib/types';
import fs from 'fs';
import path from 'path';

function readInvoices(): Record<string, Invoice> {
  try {
    const raw = fs.readFileSync(
      path.join(process.cwd(), 'src/data/invoices.json'),
      'utf-8'
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function buildSystemPrompt(
  salesData: Awaited<ReturnType<typeof fetchSalesData>>,
  invoiceMap: Record<string, Invoice>
): string {
  const invoices = Object.values(invoiceMap);
  const totalInvoiceAmount = invoices.reduce((s, i) => s + i.amount, 0);
  const totalRemaining = invoices.reduce((s, i) => s + i.remainingAmount, 0);
  const paidCount = invoices.filter((i) => i.invoiceStatus === 'Paid').length;
  const unpaidCount = invoices.length - paidCount;
  const recentUnpaid = invoices
    .filter((i) => i.invoiceStatus !== 'Paid' && i.remainingAmount > 0)
    .slice(0, 10)
    .map(
      (i) =>
        `  - ${i.invoiceNo}: ${i.contactName} | ₹${i.amount} (remaining: ₹${i.remainingAmount}) | Due: ${i.dueDate}`
    )
    .join('\n');

  const storeSummaryText = salesData.storeSummaries
    .map(
      (s) =>
        `  - ${s.storeName} (${s.storeCode}): Revenue ₹${s.totalRevenue.toLocaleString('en-IN')}, Collection ₹${s.totalCollection.toLocaleString('en-IN')}, Units ${s.totalUnits}, Outstanding ₹${s.outstanding.toLocaleString('en-IN')}`
    )
    .join('\n');

  const productSummaryText = salesData.productSummaries
    .map((p) => `  - ${p.productName}: ${p.totalUnits} units`)
    .join('\n');

  const recentDays = salesData.dailySummaries.slice(-7);
  const dailySummaryText = recentDays
    .map(
      (d) =>
        `  - ${d.date}: Revenue ₹${d.totalRevenue.toLocaleString('en-IN')}, Units ${d.totalUnits}, Stores ${d.storeCount}`
    )
    .join('\n');

  const storeList = STORES.map((s) => `${s.name} (${s.code})`).join(', ');
  const productList = PRODUCTS.map((p) => p.name).join(', ');

  return `You are the Kashi Kravings AI assistant — a helpful business analytics chatbot for the Kashi Kravings dashboard.

About Kashi Kravings:
- A premium Indian sweets & snacks brand based in Varanasi (Kashi)
- Products: ${productList}
- Stores: ${storeList}
- Flavors come in Large (L) and Small (S) sizes
- Heritage Boxes are gift sets (9-piece and 15-piece)

CURRENT SALES DATA (as of ${salesData.lastUpdated}):
- Total Revenue: ₹${salesData.totalRevenue.toLocaleString('en-IN')}
- Total Collection: ₹${salesData.totalCollection.toLocaleString('en-IN')}
- Total Outstanding: ₹${salesData.totalOutstanding.toLocaleString('en-IN')}
- Collection Rate: ${salesData.collectionRate.toFixed(1)}%
- Total Units Sold: ${salesData.totalUnits.toLocaleString('en-IN')}
- Stores Active Today: ${salesData.storesActiveToday}

STORE PERFORMANCE:
${storeSummaryText}

PRODUCT PERFORMANCE:
${productSummaryText}

RECENT DAILY SUMMARIES (last 7 days):
${dailySummaryText}

INVOICE SUMMARY:
- Total Invoices: ${invoices.length}
- Total Amount: ₹${totalInvoiceAmount.toLocaleString('en-IN')}
- Total Remaining: ₹${totalRemaining.toLocaleString('en-IN')}
- Paid: ${paidCount} | Unpaid: ${unpaidCount}

RECENT UNPAID INVOICES:
${recentUnpaid || '  None'}

Guidelines:
- Format currency in Indian Rupees (₹) with Indian number formatting
- Be concise but informative
- When comparing stores or products, use the data above
- If asked about something not in the data, say so honestly
- Use markdown formatting for tables and lists when helpful`;
}

function convertUIMessages(uiMessages: UIMessage[]) {
  return uiMessages.map((msg) => ({
    role: msg.role as 'user' | 'assistant',
    content:
      msg.parts
        ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join('') ?? '',
  }));
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const [salesData, invoiceMap] = await Promise.all([
    fetchSalesData(),
    Promise.resolve(readInvoices()),
  ]);

  const systemPrompt = buildSystemPrompt(salesData, invoiceMap);

  const result = streamText({
    model: openai('gpt-4o-mini'),
    system: systemPrompt,
    messages: convertUIMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
