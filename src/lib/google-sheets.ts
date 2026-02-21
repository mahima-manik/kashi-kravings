import { google } from 'googleapis';
import {
  SalesRecord,
  DashboardData,
  DailySummary,
  StoreSummary,
  ProductSummary,
  STORE_MAP,
} from './types';

// Cache configuration
let cachedData: DashboardData | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const SHEET_ID = process.env.GOOGLE_SHEET_ID;
if (!SHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID environment variable is required');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function parseNumber(value: string | undefined | null): number {
  if (!value || value === '' || value === '-') return 0;
  const cleaned = String(value).replace(/[₹,\s"]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

const MONTH_ABBR: Record<string, string> = {
  'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
  'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
  'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12',
};

function parseDate(dateValue: string | undefined | null): string {
  if (!dateValue) return '';

  const dateString = String(dateValue).replace(/"/g, '').trim();

  // Check if it's already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }

  // Handle M/D/YYYY format (US format from Google Forms)
  const slashParts = dateString.split('/');
  if (slashParts.length === 3) {
    const [month, day, year] = slashParts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Handle dash-separated formats
  const dashParts = dateString.split('-');
  if (dashParts.length === 3) {
    const [dayPart, monthPart, yearPart] = dashParts;

    // DD-Mon-YY format (e.g., "31-Jan-26", "1-Feb-26")
    const monthNum = MONTH_ABBR[monthPart];
    if (monthNum) {
      const fullYear = yearPart.length === 2 ? `20${yearPart}` : yearPart;
      return `${fullYear}-${monthNum}-${dayPart.padStart(2, '0')}`;
    }

    // DD-MM-YYYY format
    if (dayPart.length <= 2) {
      return `${yearPart}-${monthPart.padStart(2, '0')}-${dayPart.padStart(2, '0')}`;
    }
  }

  // Fallback: try native Date parsing
  const parsed = new Date(dateString);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return '';
}

function parseSalesRow(row: string[], index: number): SalesRecord {
  const location = String(row[2] || '').replace(/"/g, '').trim();
  const storeName = STORE_MAP[location] || location;

  return {
    id: `row-${index}`,
    timestamp: String(row[0] || '').replace(/"/g, ''),
    date: parseDate(row[1]),
    location: location,
    storeName: storeName,
    paanL: parseNumber(row[3]),
    thandaiL: parseNumber(row[4]),
    giloriL: parseNumber(row[5]),
    paanS: parseNumber(row[6]),
    thandaiS: parseNumber(row[7]),
    giloriS: parseNumber(row[8]),
    heritageBox9: parseNumber(row[9]),
    heritageBox15: parseNumber(row[10]),
    saleValue: parseNumber(row[11]),
    collectionReceived: parseNumber(row[12]),
    sampleGiven: parseNumber(row[13]),
    numTSO: parseNumber(row[14]),
    promotionDuration: parseNumber(row[15]),
    sampleConsumed: parseNumber(row[16]),
  };
}

function calculateTotalUnits(record: SalesRecord): number {
  return (
    record.paanL +
    record.thandaiL +
    record.giloriL +
    record.paanS +
    record.thandaiS +
    record.giloriS +
    record.heritageBox9 +
    record.heritageBox15
  );
}

function aggregateDailySummaries(records: SalesRecord[]): DailySummary[] {
  const dailyMap = new Map<string, DailySummary>();

  for (const record of records) {
    if (!record.date) continue;

    const existing = dailyMap.get(record.date);
    const units = calculateTotalUnits(record);

    if (existing) {
      existing.totalRevenue += record.saleValue;
      existing.totalCollection += record.collectionReceived;
      existing.totalUnits += units;
      existing.storeCount += 1;
      existing.totalTSOs += record.numTSO;
      existing.totalSampleGiven += record.sampleGiven;
      existing.totalSampleConsumed += record.sampleConsumed;
      existing.totalPromotionHours += record.promotionDuration;
    } else {
      dailyMap.set(record.date, {
        date: record.date,
        totalRevenue: record.saleValue,
        totalCollection: record.collectionReceived,
        totalUnits: units,
        storeCount: 1,
        totalTSOs: record.numTSO,
        totalSampleGiven: record.sampleGiven,
        totalSampleConsumed: record.sampleConsumed,
        totalPromotionHours: record.promotionDuration,
      });
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

function aggregateStoreSummaries(records: SalesRecord[]): StoreSummary[] {
  const storeMap = new Map<string, StoreSummary>();

  for (const record of records) {
    if (!record.location) continue;

    const existing = storeMap.get(record.location);
    const units = calculateTotalUnits(record);

    if (existing) {
      existing.totalRevenue += record.saleValue;
      existing.totalCollection += record.collectionReceived;
      existing.totalUnits += units;
      existing.outstanding = existing.totalRevenue - existing.totalCollection;
    } else {
      storeMap.set(record.location, {
        storeCode: record.location,
        storeName: record.storeName,
        totalRevenue: record.saleValue,
        totalCollection: record.collectionReceived,
        totalUnits: units,
        outstanding: record.saleValue - record.collectionReceived,
      });
    }
  }

  return Array.from(storeMap.values()).sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  );
}

function aggregateProductSummaries(records: SalesRecord[]): ProductSummary[] {
  const products: ProductSummary[] = [
    { productName: 'Paan (L)', totalUnits: 0, flavor: 'Paan', size: 'L' },
    { productName: 'Thandai (L)', totalUnits: 0, flavor: 'Thandai', size: 'L' },
    { productName: 'Gilori (L)', totalUnits: 0, flavor: 'Gilori', size: 'L' },
    { productName: 'Paan (S)', totalUnits: 0, flavor: 'Paan', size: 'S' },
    { productName: 'Thandai (S)', totalUnits: 0, flavor: 'Thandai', size: 'S' },
    { productName: 'Gilori (S)', totalUnits: 0, flavor: 'Gilori', size: 'S' },
    { productName: 'Heritage Box (9)', totalUnits: 0, isGiftBox: true },
    { productName: 'Heritage Box (15)', totalUnits: 0, isGiftBox: true },
  ];

  for (const record of records) {
    products[0].totalUnits += record.paanL;
    products[1].totalUnits += record.thandaiL;
    products[2].totalUnits += record.giloriL;
    products[3].totalUnits += record.paanS;
    products[4].totalUnits += record.thandaiS;
    products[5].totalUnits += record.giloriS;
    products[6].totalUnits += record.heritageBox9;
    products[7].totalUnits += record.heritageBox15;
  }

  return products.filter((p) => p.totalUnits > 0);
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

async function fetchSheetData(): Promise<string[][]> {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Form Responses 1',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    return [];
  }

  // Skip header row, return remaining rows as string arrays
  return rows.slice(1).map((row) => row.map(String));
}

export async function fetchSalesData(
  forceRefresh = false
): Promise<DashboardData> {
  // Return cached data if valid
  if (!forceRefresh && cachedData && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedData;
  }

  const rows = await fetchSheetData();

  const salesRecords = rows
    .map((row, index) => parseSalesRow(row, index + 2))
    .filter((record) => record.date && record.location);

  // Calculate aggregations
  const totalRevenue = salesRecords.reduce((sum, r) => sum + r.saleValue, 0);
  const totalCollection = salesRecords.reduce(
    (sum, r) => sum + r.collectionReceived,
    0
  );
  const totalUnits = salesRecords.reduce(
    (sum, r) => sum + calculateTotalUnits(r),
    0
  );

  const today = getTodayString();
  const todayRecords = salesRecords.filter((r) => r.date === today);
  const uniqueStoresToday = new Set(todayRecords.map((r) => r.location));

  const dashboardData: DashboardData = {
    salesRecords,
    totalRevenue,
    totalCollection,
    totalOutstanding: totalRevenue - totalCollection,
    totalUnits,
    storesActiveToday: uniqueStoresToday.size,
    dailySummaries: aggregateDailySummaries(salesRecords),
    storeSummaries: aggregateStoreSummaries(salesRecords),
    productSummaries: aggregateProductSummaries(salesRecords),
    collectionRate: totalRevenue > 0 ? (totalCollection / totalRevenue) * 100 : 0,
    lastUpdated: new Date().toISOString(),
  };

  // Update cache
  cachedData = dashboardData;
  cacheTimestamp = Date.now();

  return dashboardData;
}

export async function fetchSalesDataForDateRange(
  startDate: string,
  endDate: string
): Promise<DashboardData> {
  const allData = await fetchSalesData();

  const filteredRecords = allData.salesRecords.filter((record) => {
    return record.date >= startDate && record.date <= endDate;
  });

  const totalRevenue = filteredRecords.reduce((sum, r) => sum + r.saleValue, 0);
  const totalCollection = filteredRecords.reduce(
    (sum, r) => sum + r.collectionReceived,
    0
  );
  const totalUnits = filteredRecords.reduce(
    (sum, r) => sum + calculateTotalUnits(r),
    0
  );

  const today = getTodayString();
  const todayRecords = filteredRecords.filter((r) => r.date === today);
  const uniqueStoresToday = new Set(todayRecords.map((r) => r.location));

  return {
    salesRecords: filteredRecords,
    totalRevenue,
    totalCollection,
    totalOutstanding: totalRevenue - totalCollection,
    totalUnits,
    storesActiveToday: uniqueStoresToday.size,
    dailySummaries: aggregateDailySummaries(filteredRecords),
    storeSummaries: aggregateStoreSummaries(filteredRecords),
    productSummaries: aggregateProductSummaries(filteredRecords),
    collectionRate: totalRevenue > 0 ? (totalCollection / totalRevenue) * 100 : 0,
    lastUpdated: allData.lastUpdated,
  };
}

// Generate mock data for development/testing
export function generateMockData(): DashboardData {
  const stores = Object.entries(STORE_MAP);
  const mockRecords: SalesRecord[] = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const recordsPerDay = Math.floor(Math.random() * 4) + 3;
    for (let j = 0; j < recordsPerDay; j++) {
      const [storeCode, storeName] = stores[Math.floor(Math.random() * stores.length)];
      const saleValue = Math.floor(Math.random() * 5000) + 1000;
      const collectionReceived = Math.floor(saleValue * (0.7 + Math.random() * 0.3));

      mockRecords.push({
        id: `mock-${i}-${j}`,
        timestamp: `${dateStr}T${Math.floor(Math.random() * 12 + 9)}:00:00`,
        date: dateStr,
        location: storeCode,
        storeName: storeName,
        paanL: Math.floor(Math.random() * 10),
        thandaiL: Math.floor(Math.random() * 10),
        giloriL: Math.floor(Math.random() * 10),
        paanS: Math.floor(Math.random() * 15),
        thandaiS: Math.floor(Math.random() * 15),
        giloriS: Math.floor(Math.random() * 15),
        heritageBox9: Math.floor(Math.random() * 3),
        heritageBox15: Math.floor(Math.random() * 2),
        saleValue,
        collectionReceived,
        sampleGiven: Math.floor(Math.random() * 5),
        numTSO: Math.floor(Math.random() * 3) + 1,
        promotionDuration: Math.floor(Math.random() * 4) + 1,
        sampleConsumed: Math.floor(Math.random() * 3),
      });
    }
  }

  const totalRevenue = mockRecords.reduce((sum, r) => sum + r.saleValue, 0);
  const totalCollection = mockRecords.reduce((sum, r) => sum + r.collectionReceived, 0);
  const totalUnits = mockRecords.reduce((sum, r) => sum + calculateTotalUnits(r), 0);

  const todayStr = today.toISOString().split('T')[0];
  const todayRecords = mockRecords.filter((r) => r.date === todayStr);
  const uniqueStoresToday = new Set(todayRecords.map((r) => r.location));

  return {
    salesRecords: mockRecords.sort((a, b) => b.date.localeCompare(a.date)),
    totalRevenue,
    totalCollection,
    totalOutstanding: totalRevenue - totalCollection,
    totalUnits,
    storesActiveToday: uniqueStoresToday.size,
    dailySummaries: aggregateDailySummaries(mockRecords),
    storeSummaries: aggregateStoreSummaries(mockRecords),
    productSummaries: aggregateProductSummaries(mockRecords),
    collectionRate: totalRevenue > 0 ? (totalCollection / totalRevenue) * 100 : 0,
    lastUpdated: new Date().toISOString(),
  };
}
