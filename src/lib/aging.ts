import type { Invoice } from '@/lib/types';

export const BUCKET_KEYS = ['current', '1-30', '31-60', '61-90', '90+'] as const;
export type BucketKey = (typeof BUCKET_KEYS)[number];

export interface BucketTotals {
  current: number;
  '1-30': number;
  '31-60': number;
  '61-90': number;
  '90+': number;
  total: number;
}

export interface StoreBuckets extends BucketTotals {
  contactName: string;
}

export const BUCKET_LABELS: Record<BucketKey, string> = {
  current: 'Current',
  '1-30': '1-30 Days',
  '31-60': '31-60 Days',
  '61-90': '61-90 Days',
  '90+': '90+ Days',
};

export const BUCKET_COLORS: Record<BucketKey, { bg: string; text: string; bar: string }> = {
  current: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  '1-30': { bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-500' },
  '31-60': { bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', bar: 'bg-orange-500' },
  '61-90': { bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', bar: 'bg-red-500' },
  '90+': { bg: 'bg-red-100 dark:bg-red-900/50', text: 'text-red-800 dark:text-red-300', bar: 'bg-red-700' },
};

export function parseDate(d: string): number {
  const parts = d.split('/');
  if (parts.length === 3) return new Date(+parts[2], +parts[1] - 1, +parts[0]).getTime();
  return 0;
}

export function getDaysOverdue(dueDate: string): number {
  const due = parseDate(dueDate);
  if (due === 0) return 999;
  return Math.floor((Date.now() - due) / (1000 * 60 * 60 * 24));
}

export function getBucket(dueDate: string): BucketKey {
  const daysOverdue = getDaysOverdue(dueDate);
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '90+';
}

export function emptyBuckets(): BucketTotals {
  return { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0, total: 0 };
}

export function getUnpaidInvoices(invoices: Invoice[]): Invoice[] {
  return invoices.filter((inv) => inv.invoiceStatus !== 'Paid' && inv.remainingAmount > 0);
}

export function computeAgingBuckets(unpaidInvoices: Invoice[]): {
  buckets: BucketTotals;
  oldestDaysOverdue: number;
} {
  const buckets = emptyBuckets();
  let oldestDaysOverdue = 0;

  for (const inv of unpaidInvoices) {
    const bucket = getBucket(inv.dueDate);
    const days = getDaysOverdue(inv.dueDate);
    buckets[bucket] += inv.remainingAmount;
    buckets.total += inv.remainingAmount;
    if (days > oldestDaysOverdue) oldestDaysOverdue = days;
  }

  return { buckets, oldestDaysOverdue };
}

export function computeStoreAgingRows(unpaidInvoices: Invoice[]): StoreBuckets[] {
  const map = new Map<string, StoreBuckets>();
  for (const inv of unpaidInvoices) {
    const bucket = getBucket(inv.dueDate);
    let row = map.get(inv.contactName);
    if (!row) {
      row = { contactName: inv.contactName, ...emptyBuckets() };
      map.set(inv.contactName, row);
    }
    row[bucket] += inv.remainingAmount;
    row.total += inv.remainingAmount;
  }
  return Array.from(map.values());
}
