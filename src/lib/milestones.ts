import type { Invoice } from '@/lib/types';
import { parseDate } from '@/lib/aging';

export interface Milestone {
  id: string;
  category: 'revenue' | 'payment' | 'orders' | 'outstanding' | 'consistency';
  label: string;
  target: number;
  progress: number; // 0-100
  achieved: boolean;
}

export interface MilestoneResult {
  achieved: Milestone[];
  nextUp: Milestone | null;
  all: Milestone[];
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function computeMilestones(invoices: Invoice[]): MilestoneResult {
  if (invoices.length === 0) {
    const all = buildAllMilestones(0, 0, 0, 0, null);
    return { achieved: [], nextUp: all[0] ?? null, all };
  }

  const totalAmount = invoices.reduce((s, inv) => s + inv.amount, 0);
  const paidCount = invoices.filter(inv => inv.invoiceStatus === 'Paid').length;
  const paidPct = (paidCount / invoices.length) * 100;
  const totalRemaining = invoices.reduce((s, inv) => s + inv.remainingAmount, 0);
  const orderCount = invoices.length;

  // Compute average frequency
  const dates: number[] = [];
  for (const inv of invoices) {
    const ts = parseDate(inv.invoiceDate);
    if (ts > 0) dates.push(ts);
  }
  let avgFrequencyDays: number | null = null;
  if (dates.length >= 2) {
    const sorted = [...dates].sort((a, b) => a - b);
    let totalGap = 0;
    for (let i = 1; i < sorted.length; i++) {
      totalGap += sorted[i] - sorted[i - 1];
    }
    avgFrequencyDays = Math.round(totalGap / DAY_MS / (sorted.length - 1));
  }

  const all = buildAllMilestones(totalAmount, paidPct, orderCount, totalRemaining, avgFrequencyDays);
  const achieved = all.filter(m => m.achieved);
  const pending = all.filter(m => !m.achieved);
  // Pick the one closest to completion
  pending.sort((a, b) => b.progress - a.progress);
  const nextUp = pending[0] ?? null;

  return { achieved, nextUp, all };
}

function buildAllMilestones(
  totalAmount: number,
  paidPct: number,
  orderCount: number,
  totalRemaining: number,
  avgFrequencyDays: number | null,
): Milestone[] {
  const milestones: Milestone[] = [];

  // Revenue milestones
  const revenueTargets = [
    { amount: 10_000, label: '₹10K Revenue' },
    { amount: 50_000, label: '₹50K Revenue' },
    { amount: 1_00_000, label: '₹1L Revenue' },
    { amount: 5_00_000, label: '₹5L Revenue' },
    { amount: 10_00_000, label: '₹10L Revenue' },
  ];
  for (const t of revenueTargets) {
    milestones.push({
      id: `revenue-${t.amount}`,
      category: 'revenue',
      label: t.label,
      target: t.amount,
      progress: Math.min(100, (totalAmount / t.amount) * 100),
      achieved: totalAmount >= t.amount,
    });
  }

  // Payment reliability milestones
  const paymentTargets = [
    { pct: 50, label: '50% Payment Reliability' },
    { pct: 75, label: '75% Payment Reliability' },
    { pct: 90, label: '90% Payment Reliability' },
    { pct: 100, label: '100% Payment Reliability' },
  ];
  for (const t of paymentTargets) {
    milestones.push({
      id: `payment-${t.pct}`,
      category: 'payment',
      label: t.label,
      target: t.pct,
      progress: orderCount > 0 ? Math.min(100, (paidPct / t.pct) * 100) : 0,
      achieved: orderCount > 0 && paidPct >= t.pct,
    });
  }

  // Order count milestones
  const orderTargets = [10, 25, 50, 100];
  for (const t of orderTargets) {
    milestones.push({
      id: `orders-${t}`,
      category: 'orders',
      label: `${t} Orders`,
      target: t,
      progress: Math.min(100, (orderCount / t) * 100),
      achieved: orderCount >= t,
    });
  }

  // Clean Slate — zero remaining with at least 1 invoice
  milestones.push({
    id: 'outstanding-clean',
    category: 'outstanding',
    label: 'Clean Slate',
    target: 0,
    progress: orderCount > 0 && totalRemaining === 0 ? 100 : orderCount > 0 ? Math.max(0, 100 - (totalRemaining / (totalRemaining + 1)) * 100) : 0,
    achieved: orderCount > 0 && totalRemaining === 0,
  });

  // Consistency milestones
  if (avgFrequencyDays !== null) {
    milestones.push({
      id: 'consistency-monthly',
      category: 'consistency',
      label: 'Monthly Regular',
      target: 30,
      progress: Math.min(100, (30 / avgFrequencyDays) * 100),
      achieved: avgFrequencyDays <= 30,
    });
    milestones.push({
      id: 'consistency-weekly',
      category: 'consistency',
      label: 'Weekly Regular',
      target: 10,
      progress: Math.min(100, (10 / avgFrequencyDays) * 100),
      achieved: avgFrequencyDays <= 10,
    });
  } else {
    milestones.push({
      id: 'consistency-monthly',
      category: 'consistency',
      label: 'Monthly Regular',
      target: 30,
      progress: 0,
      achieved: false,
    });
    milestones.push({
      id: 'consistency-weekly',
      category: 'consistency',
      label: 'Weekly Regular',
      target: 10,
      progress: 0,
      achieved: false,
    });
  }

  return milestones;
}
