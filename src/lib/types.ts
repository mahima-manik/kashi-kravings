import type { Flavor, Size } from '@/lib/stores';

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

// Firm definitions — single source of truth
export const FIRMS = {
  kashi_kravings: 'Kashi Kravings',
  prime_traders: 'Prime Traders',
} as const;

export type Firm = keyof typeof FIRMS;
export const FIRM_KEYS = Object.keys(FIRMS) as Firm[];

export function isValidFirm(value: unknown): value is Firm {
  return typeof value === 'string' && value in FIRMS;
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
  firm: Firm;
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
