import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { findStoreCode } from '@/lib/stores';
import type { Invoice, InvoiceData, ApiResponse } from '@/lib/types';

function isoToDDMMYYYY(iso: string | null): string {
  if (!iso) return '';
  const [yyyy, mm, dd] = iso.split('-');
  return `${dd}/${mm}/${yyyy}`;
}

function ddmmyyyyToISO(dateStr: string): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
}

function buildInvoiceData(invoices: Invoice[]): InvoiceData {
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
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_date', { ascending: false });

    if (error) throw error;

    const invoices: Invoice[] = (data ?? []).map(row => ({
      invoiceNo: row.invoice_no,
      invoiceDate: isoToDDMMYYYY(row.invoice_date),
      contactName: row.contact_name,
      amount: row.amount,
      remainingAmount: row.remaining_amount,
      invoiceStatus: row.status,
      dueDate: isoToDDMMYYYY(row.due_date),
      invoiceLink: row.invoice_link ?? '',
      paymentType: row.payment_type ?? '',
      partyCategory: row.party_category ?? '',
      createdBy: row.created_by ?? '',
    }));

    return NextResponse.json({ success: true, data: buildInvoiceData(invoices) });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to read invoices' },
      { status: 500 },
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

    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Invoice No')) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Could not find "Invoice No" header row in CSV' },
        { status: 400 },
      );
    }

    // Fetch stores for contact_name -> store_id mapping
    const { data: storeRows, error: storesError } = await supabase
      .from('stores')
      .select('id, code, name, aliases');
    if (storesError) throw storesError;

    const stores = storeRows ?? [];
    const storeCodeToId: Record<string, string> = Object.fromEntries(
      stores.map(s => [s.code, s.id])
    );

    const dataLines = lines.slice(headerIndex + 1);
    const rows: object[] = [];
    const invoiceNos: string[] = [];

    for (const line of dataLines) {
      const fields = parseCSVLine(line);
      if (fields.length < 11 || !fields[0]) continue;

      const invoiceNo = fields[0];
      const contactName = fields[2] || '';
      const storeCode = findStoreCode(contactName, stores);

      rows.push({
        invoice_no: invoiceNo,
        invoice_date: ddmmyyyyToISO(fields[1]),
        contact_name: contactName,
        store_id: storeCode ? (storeCodeToId[storeCode] ?? null) : null,
        amount: parseFloat(fields[3]) || 0,
        remaining_amount: parseFloat(fields[4]) || 0,
        status: fields[5] || '',
        due_date: ddmmyyyyToISO(fields[6]),
        invoice_link: fields[7] || '',
        payment_type: fields[8] || '',
        party_category: fields[9] || '',
        created_by: fields[10] || '',
      });
      invoiceNos.push(invoiceNo);
    }

    // Determine added vs updated counts
    const { data: existing } = await supabase
      .from('invoices')
      .select('invoice_no')
      .in('invoice_no', invoiceNos);

    const existingSet = new Set((existing ?? []).map(r => r.invoice_no));
    const added = invoiceNos.filter(no => !existingSet.has(no)).length;
    const updated = invoiceNos.length - added;

    const { error: upsertError } = await supabase
      .from('invoices')
      .upsert(rows, { onConflict: 'invoice_no' });

    if (upsertError) throw upsertError;

    return NextResponse.json({ success: true, data: { added, updated } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process CSV' },
      { status: 500 },
    );
  }
}
