// Product and deal definitions for the Order Now feature
// NOTE: Deal prices are placeholders — confirm with business before going live

export type BarFlavor = 'thandai' | 'paan' | 'gilori';
export type BarSize = '45g' | '100g';

export interface ProductItem {
  id: string;
  flavor: BarFlavor;
  size: BarSize;
  name: string;
  weight: string;
  mrp: number;
  description: string;
}

export interface DealPack {
  id: string;
  name: string;
  subtitle: string;
  size: BarSize;
  items: { flavor: BarFlavor; qty: number }[];
  totalBars: number;
  mrpTotal: number;
  dealPrice: number;
  payNowPrice: number;
  partialPct: number; // e.g. 50 = pay 50% upfront
  badge?: string;
}

export interface CartItem {
  dealId: string;
  quantity: number;
}

export const PRODUCTS: ProductItem[] = [
  {
    id: 'thandai-45g',
    flavor: 'thandai',
    size: '45g',
    name: 'Banarasi Thandai Bar',
    weight: '45g',
    mrp: 129,
    description: 'Almonds, cashews, makhana, rose petals',
  },
  {
    id: 'paan-45g',
    flavor: 'paan',
    size: '45g',
    name: 'Royal Paan Bar',
    weight: '45g',
    mrp: 129,
    description: 'Betel leaf, dry dates, cardamom, rose',
  },
  {
    id: 'gilori-45g',
    flavor: 'gilori',
    size: '45g',
    name: 'Banarasi Gilori Bar',
    weight: '45g',
    mrp: 129,
    description: 'Honey, anjeer, almonds, pistachios',
  },
  {
    id: 'thandai-100g',
    flavor: 'thandai',
    size: '100g',
    name: 'Banarasi Thandai Bar',
    weight: '100g',
    mrp: 249,
    description: 'Almonds, cashews, makhana, rose petals',
  },
  {
    id: 'paan-100g',
    flavor: 'paan',
    size: '100g',
    name: 'Royal Paan Bar',
    weight: '100g',
    mrp: 249,
    description: 'Betel leaf, dry dates, cardamom, rose',
  },
  {
    id: 'gilori-100g',
    flavor: 'gilori',
    size: '100g',
    name: 'Banarasi Gilori Bar',
    weight: '100g',
    mrp: 249,
    description: 'Honey, anjeer, almonds, pistachios',
  },
];

// Placeholder prices — confirm with business
export const DEALS: DealPack[] = [
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    subtitle: '12 bars — 4 of each flavor (45g)',
    size: '45g',
    items: [
      { flavor: 'thandai', qty: 4 },
      { flavor: 'paan', qty: 4 },
      { flavor: 'gilori', qty: 4 },
    ],
    totalBars: 12,
    mrpTotal: 12 * 129, // ₹1,548
    dealPrice: 1399,
    payNowPrice: 1299,
    partialPct: 50,
  },
  {
    id: 'best-seller',
    name: 'Best Seller Pack',
    subtitle: '24 bars — 8 of each flavor (45g)',
    size: '45g',
    items: [
      { flavor: 'thandai', qty: 8 },
      { flavor: 'paan', qty: 8 },
      { flavor: 'gilori', qty: 8 },
    ],
    totalBars: 24,
    mrpTotal: 24 * 129, // ₹3,096
    dealPrice: 2699,
    payNowPrice: 2499,
    partialPct: 50,
    badge: 'Most Popular',
  },
  {
    id: 'premium-display',
    name: 'Premium Display Pack',
    subtitle: '12 bars — 4 of each flavor (100g)',
    size: '100g',
    items: [
      { flavor: 'thandai', qty: 4 },
      { flavor: 'paan', qty: 4 },
      { flavor: 'gilori', qty: 4 },
    ],
    totalBars: 12,
    mrpTotal: 12 * 249, // ₹2,988
    dealPrice: 2699,
    payNowPrice: 2499,
    partialPct: 50,
    badge: 'Premium',
  },
  {
    id: 'mega-restock',
    name: 'Mega Restock',
    subtitle: '48 bars — 16 of each flavor (45g)',
    size: '45g',
    items: [
      { flavor: 'thandai', qty: 16 },
      { flavor: 'paan', qty: 16 },
      { flavor: 'gilori', qty: 16 },
    ],
    totalBars: 48,
    mrpTotal: 48 * 129, // ₹6,192
    dealPrice: 4999,
    payNowPrice: 4499,
    partialPct: 50,
    badge: 'Best Value',
  },
];

export function discountPct(mrp: number, price: number): number {
  return Math.round(((mrp - price) / mrp) * 100);
}
