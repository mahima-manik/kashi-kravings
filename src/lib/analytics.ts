import type { DailySales } from '@/lib/types';

export interface CostParams {
  tsoCostPerDay: number;     // default 500
  sampleCostPerUnit: number; // default 15
}

export interface DailyMetrics {
  date: string;
  sales: number;
  tsoCost: number;
  sampleCost: number;
  netReturn: number;          // D1
  salesPerTSO: number | null; // D2
  dowBaseline: number | null; // D3 — ratio (1.2 = 20% above avg)
  sampleConversion: number | null; // D4
}

export interface WeeklyMetrics {
  weekLabel: string;          // "3 Mar - 9 Mar"
  weekStart: string;          // ISO date of Monday
  totalSales: number;
  totalTSOCost: number;
  totalSampleCost: number;
  netReturn: number;          // W2
  wowGrowth: number | null;  // W1 — decimal (0.15 = +15%)
  sampleROI: number | null;  // W4
  bestDay: string;            // 3-letter DOW of highest sale day (e.g. "Mon")
}

export const DEFAULT_COSTS: CostParams = {
  tsoCostPerDay: 500,
  sampleCostPerUnit: 15,
};

const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getDOWName(dateStr: string): string {
  return DOW_NAMES[getDOW(dateStr)];
}

/** Parse YYYY-MM-DD without timezone issues */
function parseDate(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/** Get day-of-week (0=Sun..6=Sat) from YYYY-MM-DD */
function getDOW(dateStr: string): number {
  const { year, month, day } = parseDate(dateStr);
  return new Date(year, month - 1, day).getDay();
}

/** Get the Monday (ISO week start) for a given YYYY-MM-DD */
export function getWeekMonday(dateStr: string): string {
  const { year, month, day } = parseDate(dateStr);
  const d = new Date(year, month - 1, day);
  const dow = d.getDay();
  const diff = dow === 0 ? 6 : dow - 1; // Monday=0 offset
  d.setDate(d.getDate() - diff);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Format a week range label like "3 Mar - 9 Mar" */
function weekLabel(mondayStr: string): string {
  const { year, month, day } = parseDate(mondayStr);
  const mon = new Date(year, month - 1, day);
  const sun = new Date(year, month - 1, day + 6);
  const fmt = (d: Date) =>
    `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  return `${fmt(mon)} - ${fmt(sun)}`;
}

/** D3 helper: compute average sale value per day-of-week */
export function getDOWAverages(
  dailySales: DailySales[],
): Map<number, { avg: number; count: number }> {
  const sums = new Map<number, { total: number; count: number }>();
  for (const d of dailySales) {
    const dow = getDOW(d.date);
    const existing = sums.get(dow);
    if (existing) {
      existing.total += d.saleValue;
      existing.count += 1;
    } else {
      sums.set(dow, { total: d.saleValue, count: 1 });
    }
  }
  const result = new Map<number, { avg: number; count: number }>();
  sums.forEach(({ total, count }, dow) => {
    result.set(dow, { avg: total / count, count });
  });
  return result;
}

export function computeDailyMetrics(
  dailySales: DailySales[],
  costs: CostParams,
): DailyMetrics[] {
  const dowAvgs = getDOWAverages(dailySales);

  return dailySales.map((d) => {
    const tsoCost = d.numTSO * costs.tsoCostPerDay;
    const sampleCost = d.sampleGiven * costs.sampleCostPerUnit;
    const netReturn = d.saleValue - tsoCost - sampleCost;
    const salesPerTSO = d.numTSO > 0 ? d.saleValue / d.numTSO : null;

    const dow = getDOW(d.date);
    const dowData = dowAvgs.get(dow);
    const dowBaseline =
      dowData && dowData.count >= 3 && dowData.avg > 0
        ? d.saleValue / dowData.avg
        : null;

    const sampleConversion = d.sampleGiven > 0 ? d.saleValue / d.sampleGiven : null;

    return {
      date: d.date,
      sales: d.saleValue,
      tsoCost,
      sampleCost,
      netReturn,
      salesPerTSO,
      dowBaseline,
      sampleConversion,
    };
  });
}

export function computeWeeklyMetrics(
  dailySales: DailySales[],
  costs: CostParams,
): WeeklyMetrics[] {
  // Group by week
  const weekMap = new Map<
    string,
    { sales: number; tsoCost: number; sampleCost: number; sampledDaySales: number[]; unsampledDaySales: number[]; bestDayDate: string; bestDaySale: number }
  >();

  // Sort ascending for proper WoW ordering
  const sorted = [...dailySales].sort((a, b) => a.date.localeCompare(b.date));

  for (const d of sorted) {
    const monday = getWeekMonday(d.date);
    const existing = weekMap.get(monday);
    const tsoCost = d.numTSO * costs.tsoCostPerDay;
    const sampleCost = d.sampleGiven * costs.sampleCostPerUnit;

    if (existing) {
      existing.sales += d.saleValue;
      existing.tsoCost += tsoCost;
      existing.sampleCost += sampleCost;
      if (d.sampleGiven > 0) {
        existing.sampledDaySales.push(d.saleValue);
      } else {
        existing.unsampledDaySales.push(d.saleValue);
      }
      if (d.saleValue > existing.bestDaySale) {
        existing.bestDaySale = d.saleValue;
        existing.bestDayDate = d.date;
      }
    } else {
      weekMap.set(monday, {
        sales: d.saleValue,
        tsoCost,
        sampleCost,
        sampledDaySales: d.sampleGiven > 0 ? [d.saleValue] : [],
        unsampledDaySales: d.sampleGiven > 0 ? [] : [d.saleValue],
        bestDayDate: d.date,
        bestDaySale: d.saleValue,
      });
    }
  }

  const weeks = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return weeks.map(([monday, w], i) => {
    const netReturn = w.sales - w.tsoCost - w.sampleCost;

    // W1: WoW Growth
    let wowGrowth: number | null = null;
    if (i > 0) {
      const prevSales = weeks[i - 1][1].sales;
      wowGrowth = prevSales > 0 ? (w.sales - prevSales) / prevSales : null;
    }

    // W4: Sample ROI
    let sampleROI: number | null = null;
    if (w.sampledDaySales.length > 0 && w.unsampledDaySales.length > 0 && w.sampleCost > 0) {
      const avgSampled = w.sampledDaySales.reduce((a, b) => a + b, 0) / w.sampledDaySales.length;
      const avgUnsampled = w.unsampledDaySales.reduce((a, b) => a + b, 0) / w.unsampledDaySales.length;
      sampleROI = (avgSampled - avgUnsampled) / w.sampleCost;
    }

    return {
      weekLabel: weekLabel(monday),
      weekStart: monday,
      totalSales: w.sales,
      totalTSOCost: w.tsoCost,
      totalSampleCost: w.sampleCost,
      netReturn,
      wowGrowth,
      sampleROI,
      bestDay: getDOWName(w.bestDayDate),
    };
  });
}
