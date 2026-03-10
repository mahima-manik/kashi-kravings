import type { Invoice } from '@/lib/types';
import { parseDate } from '@/lib/aging';

export interface StoreIntelligence {
  contactName: string;
  lastOrderDaysAgo: number | null;
  avgFrequencyDays: number | null;
  isOverdueForOrder: boolean;
  aov: number;
  trend: 'up' | 'flat' | 'down' | null;
  paidPct: number;
  outstandingRatio: number;
  healthScore: number;
}

const NOW = Date.now();
const DAY_MS = 1000 * 60 * 60 * 24;

function daysBetween(a: number, b: number): number {
  return Math.abs(Math.floor((a - b) / DAY_MS));
}

function getOrderFrequency(dates: number[]): number | null {
  if (dates.length < 2) return null;
  const sorted = [...dates].sort((a, b) => a - b);
  let totalGap = 0;
  for (let i = 1; i < sorted.length; i++) {
    totalGap += sorted[i] - sorted[i - 1];
  }
  return Math.round(totalGap / DAY_MS / (sorted.length - 1));
}

function getRevenueTrend(invoices: Invoice[]): 'up' | 'flat' | 'down' | null {
  // Group by month (YYYY-MM), look at last 3 months
  const monthTotals = new Map<string, number>();
  for (const inv of invoices) {
    const ts = parseDate(inv.invoiceDate);
    if (ts === 0) continue;
    const d = new Date(ts);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthTotals.set(key, (monthTotals.get(key) ?? 0) + inv.amount);
  }

  const months = Array.from(monthTotals.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  if (months.length < 2) return null;

  const recent = months.slice(0, 3).map(([, v]) => v);
  if (recent.length === 2) {
    const diff = (recent[0] - recent[1]) / (recent[1] || 1);
    if (diff > 0.1) return 'up';
    if (diff < -0.1) return 'down';
    return 'flat';
  }

  // 3 months: compare average of recent 2 vs oldest
  const avgRecent = (recent[0] + recent[1]) / 2;
  const oldest = recent[2];
  const diff = (avgRecent - oldest) / (oldest || 1);
  if (diff > 0.1) return 'up';
  if (diff < -0.1) return 'down';
  return 'flat';
}

function computeHealthScore(
  lastOrderDaysAgo: number | null,
  avgFrequencyDays: number | null,
  aov: number,
  allAovs: number[],
  paidPct: number,
): number {
  // Recency score (30%): 100 if ordered today, 0 if >180 days
  let recencyScore = 50;
  if (lastOrderDaysAgo !== null) {
    recencyScore = Math.max(0, 100 - (lastOrderDaysAgo / 180) * 100);
  }

  // Frequency score (20%): based on how consistent ordering is
  let frequencyScore = 50;
  if (avgFrequencyDays !== null) {
    // Lower frequency days = more frequent = better
    frequencyScore = Math.max(0, 100 - (avgFrequencyDays / 90) * 100);
  }

  // Monetary score (25%): percentile rank among all stores
  let monetaryScore = 50;
  if (allAovs.length > 0) {
    const sorted = [...allAovs].sort((a, b) => a - b);
    const rank = sorted.findIndex(v => v >= aov);
    monetaryScore = ((rank + 1) / sorted.length) * 100;
  }

  // Payment score (25%): directly paidPct
  const paymentScore = paidPct;

  const score = recencyScore * 0.3 + frequencyScore * 0.2 + monetaryScore * 0.25 + paymentScore * 0.25;
  return Math.round(Math.min(100, Math.max(0, score)));
}

export function computeStoreIntelligence(invoices: Invoice[]): Map<string, StoreIntelligence> {
  // Group invoices by contactName
  const storeInvoices = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    if (!inv.contactName) continue;
    const arr = storeInvoices.get(inv.contactName);
    if (arr) arr.push(inv);
    else storeInvoices.set(inv.contactName, [inv]);
  }

  // First pass: compute AOVs for percentile ranking
  const allAovs: number[] = [];
  const storeData = new Map<string, {
    dates: number[];
    totalAmount: number;
    count: number;
    paidCount: number;
    totalRemaining: number;
  }>();

  storeInvoices.forEach((invs, name) => {
    const dates: number[] = [];
    let totalAmount = 0;
    let paidCount = 0;
    let totalRemaining = 0;

    for (const inv of invs) {
      const ts = parseDate(inv.invoiceDate);
      if (ts > 0) dates.push(ts);
      totalAmount += inv.amount;
      totalRemaining += inv.remainingAmount;
      if (inv.invoiceStatus === 'Paid') paidCount++;
    }

    const aov = invs.length > 0 ? totalAmount / invs.length : 0;
    allAovs.push(aov);
    storeData.set(name, { dates, totalAmount, count: invs.length, paidCount, totalRemaining });
  });

  // Second pass: build intelligence
  const result = new Map<string, StoreIntelligence>();

  storeInvoices.forEach((invs, name) => {
    const data = storeData.get(name)!;
    const { dates, totalAmount, count, paidCount, totalRemaining } = data;

    const maxDate = dates.length > 0 ? Math.max(...dates) : null;
    const lastOrderDaysAgo = maxDate !== null ? daysBetween(NOW, maxDate) : null;
    const avgFrequencyDays = getOrderFrequency(dates);

    const isOverdueForOrder =
      lastOrderDaysAgo !== null &&
      avgFrequencyDays !== null &&
      lastOrderDaysAgo > avgFrequencyDays * 1.5;

    const aov = count > 0 ? totalAmount / count : 0;
    const paidPct = count > 0 ? (paidCount / count) * 100 : 0;
    const outstandingRatio = totalAmount > 0 ? (totalRemaining / totalAmount) * 100 : 0;
    const trend = getRevenueTrend(invs);

    const healthScore = computeHealthScore(lastOrderDaysAgo, avgFrequencyDays, aov, allAovs, paidPct);

    result.set(name, {
      contactName: name,
      lastOrderDaysAgo,
      avgFrequencyDays,
      isOverdueForOrder,
      aov,
      trend,
      paidPct,
      outstandingRatio,
      healthScore,
    });
  });

  return result;
}
