import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import type { Invoice, InvoiceData, ApiResponse } from '@/lib/types';

const DATA_FILE = path.join(process.cwd(), 'src/data/invoices.json');

function readInvoices(): Record<string, Invoice> {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeInvoices(data: Record<string, Invoice>) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function buildInvoiceData(invoiceMap: Record<string, Invoice>): InvoiceData {
  const invoices = Object.values(invoiceMap).sort((a, b) => {
    // Sort by date descending (DD/MM/YYYY format)
    const parseDate = (d: string) => {
      const parts = d.split('/');
      if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]);
      return new Date(0);
    };
    return parseDate(b.invoiceDate).getTime() - parseDate(a.invoiceDate).getTime();
  });

  let totalAmount = 0;
  let totalRemaining = 0;
  let paidCount = 0;
  let unpaidCount = 0;

  for (const inv of invoices) {
    totalAmount += inv.amount;
    totalRemaining += inv.remainingAmount;
    if (inv.invoiceStatus === 'Paid') paidCount++;
    else unpaidCount++;
  }

  return { invoices, totalAmount, totalRemaining, paidCount, unpaidCount };
}

export async function GET(): Promise<NextResponse<ApiResponse<InvoiceData>>> {
  try {
    const invoiceMap = readInvoices();
    const data = buildInvoiceData(invoiceMap);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read invoices' },
      { status: 500 }
    );
  }
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<{ added: number; updated: number }>>> {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ success: false, error: 'Please upload a CSV file' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    // Find the header row containing "Invoice No"
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Invoice No')) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return NextResponse.json({ success: false, error: 'Could not find "Invoice No" header row in CSV' }, { status: 400 });
    }

    const dataLines = lines.slice(headerIndex + 1);
    const invoiceMap = readInvoices();
    let added = 0;
    let updated = 0;

    for (const line of dataLines) {
      const fields = parseCSVLine(line);
      if (fields.length < 11 || !fields[0]) continue;

      const invoiceNo = fields[0];
      const invoice: Invoice = {
        invoiceNo,
        invoiceDate: fields[1] || '',
        contactName: fields[2] || '',
        amount: parseFloat(fields[3]) || 0,
        remainingAmount: parseFloat(fields[4]) || 0,
        invoiceStatus: fields[5] || '',
        dueDate: fields[6] || '',
        invoiceLink: fields[7] || '',
        paymentType: fields[8] || '',
        partyCategory: fields[9] || '',
        createdBy: fields[10] || '',
      };

      if (invoiceMap[invoiceNo]) {
        updated++;
      } else {
        added++;
      }
      invoiceMap[invoiceNo] = invoice;
    }

    writeInvoices(invoiceMap);

    return NextResponse.json({ success: true, data: { added, updated } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process CSV' },
      { status: 500 }
    );
  }
}
