// Store definitions
// `aliases` lists alternate invoice contactName spellings that map to this store.
export interface Store {
  code: string;
  name: string;
  aliases?: string[];
}

export const STORES: Store[] = [
  { code: 'KK-TRM-01', name: 'The Ram Bhandar' },
  { code: 'KK-LC-02', name: 'Lakshmi Chai' },
  { code: 'KK-DC-06', name: 'Deena Chaat' },
  { code: 'KK-SJ-03', name: 'Shree Ji', aliases: ['Shreeji'] },
  { code: 'KK-BL-04', name: 'Blue Lassi' },
  { code: 'KK-SL-05', name: 'Siwon Lassi' },
  { code: 'KK-PBC-07', name: 'Popular Baati Chokha', aliases: ['Popular Baati'] },
  { code: 'KK-GB-08', name: 'GreenBerry', aliases: ['Greenberry', 'Green Berry'] },
  { code: 'KK-RB-09', name: 'Rahul Brothers' },
];

// code -> name (used by sales sheet parsing)
export const STORE_MAP: Record<string, string> = STORES.reduce(
  (acc, store) => ({ ...acc, [store.code]: store.name }),
  {}
);

// contactName -> code (case-insensitive prefix match)
// Built once from STORES, including aliases.
const _nameLookup: { prefix: string; code: string }[] = STORES.flatMap(store => [
  { prefix: store.name.toLowerCase(), code: store.code },
  ...(store.aliases ?? []).map(a => ({ prefix: a.toLowerCase(), code: store.code })),
]);

export function findStoreCode(contactName: string): string | null {
  const lower = contactName.toLowerCase();
  return _nameLookup.find(e => lower.startsWith(e.prefix))?.code ?? null;
}

// Product definitions
export type Flavor = 'Paan' | 'Thandai' | 'Gilori';
export type Size = 'L' | 'S';

export interface Product {
  name: string;
  flavor?: Flavor;
  size?: Size;
  isGiftBox?: boolean;
}

export const PRODUCTS: Product[] = [
  { name: 'Paan (L)', flavor: 'Paan', size: 'L' },
  { name: 'Thandai (L)', flavor: 'Thandai', size: 'L' },
  { name: 'Gilori (L)', flavor: 'Gilori', size: 'L' },
  { name: 'Paan (S)', flavor: 'Paan', size: 'S' },
  { name: 'Thandai (S)', flavor: 'Thandai', size: 'S' },
  { name: 'Gilori (S)', flavor: 'Gilori', size: 'S' },
  { name: 'Heritage Box (Set of 9)', isGiftBox: true },
  { name: 'Heritage Box (Set of 15)', isGiftBox: true },
];

// Sales record from Google Sheets
export interface SalesRecord {
  id: string;
  timestamp: string;
  date: string;
  location: string;
  storeName: string;
  paanL: number;
  thandaiL: number;
  giloriL: number;
  paanS: number;
  thandaiS: number;
  giloriS: number;
  heritageBox9: number;
  heritageBox15: number;
  saleValue: number;
  collectionReceived: number;
  sampleGiven: number;
  numTSO: number;
  promotionDuration: number;
  sampleConsumed: number;
}

// Aggregated data for dashboard
export interface DailySummary {
  date: string;
  totalRevenue: number;
  totalCollection: number;
  totalUnits: number;
  storeCount: number;
  totalTSOs: number;
  totalSampleGiven: number;
  totalSampleConsumed: number;
  totalPromotionHours: number;
}

export interface StoreSummary {
  storeCode: string;
  storeName: string;
  totalRevenue: number;
  totalCollection: number;
  totalUnits: number;
  outstanding: number;
}

export interface ProductSummary {
  productName: string;
  totalUnits: number;
  flavor?: Flavor;
  size?: Size;
  isGiftBox?: boolean;
}

export interface DashboardData {
  salesRecords: SalesRecord[];
  totalRevenue: number;
  totalCollection: number;
  totalOutstanding: number;
  totalUnits: number;
  storesActiveToday: number;
  dailySummaries: DailySummary[];
  storeSummaries: StoreSummary[];
  productSummaries: ProductSummary[];
  collectionRate: number;
  lastUpdated: string;
}

// Date range for filtering
export interface DateRange {
  startDate: string;
  endDate: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Invoice types (from MyBillBook CSV export)
export interface Invoice {
  invoiceNo: string;
  invoiceDate: string;
  contactName: string;
  amount: number;
  remainingAmount: number;
  invoiceStatus: 'Paid' | 'Unpaid' | string;
  dueDate: string;
  invoiceLink: string;
  paymentType: string;
  partyCategory: string;
  createdBy: string;
}

export interface InvoiceData {
  invoices: Invoice[];
  totalAmount: number;
  totalRemaining: number;
  paidCount: number;
  unpaidCount: number;
}

// Notification types
export interface NotificationPayload {
  type: 'daily_summary' | 'alert' | 'custom';
  message: string;
  data?: Record<string, unknown>;
}
