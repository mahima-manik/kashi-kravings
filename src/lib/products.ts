// Product and deal definitions for the Order Now feature
// NOTE: Deal prices are placeholders — confirm with business before going live

export type ProductId =
  | 'paan-s' | 'paan-l'
  | 'gilori-s' | 'gilori-l'
  | 'thandai-s' | 'thandai-l'
  | 'heritage-s' | 'heritage-l';

export interface ProductItem {
  id: ProductId;
  name: string;
  shortName: string; // for deal breakdown pills
  mrp: number;
  description: string;
  longDescription?: string;
  ingredients?: string[];
  storage?: string;
  image?: string;
}

// Base product name without size suffix (for detail modal)
export function baseProductName(id: ProductId): string {
  if (id.startsWith('paan')) return 'Royal Paan Bar';
  if (id.startsWith('gilori')) return 'Banarasi Gilori Bar';
  if (id.startsWith('thandai')) return 'Banarasi Thandai Bar';
  if (id.startsWith('heritage')) return id === 'heritage-s' ? 'Heritage Box (Small)' : 'Heritage Box (Large)';
  return '';
}

// Group products by base flavor for "You may also like"
export function getRelatedProducts(currentId: ProductId): ProductItem[] {
  const base = currentId.replace(/-[sl]$/, '');
  return PRODUCTS.filter((p) => !p.id.startsWith(base) && p.id.endsWith('-s'));
}

export interface DealLineItem {
  productId: ProductId;
  qty: number;
}

export interface DealPack {
  id: string;
  name: string;
  subtitle: string;
  items: DealLineItem[];
  totalPcs: number;
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
    id: 'paan-s', name: 'Royal Paan Bar (45g)', shortName: 'Paan S', mrp: 129,
    description: 'Betel leaf, dry dates, cardamom, rose',
    longDescription: 'The iconic Banarasi paan, reimagined as a chocolate. It opens cool and refreshing, then melts into a rich sweetness, giving you the after-meal paan experience in a completely new way.',
    ingredients: ['Betel leaves', 'Dry dates', 'Aniseed', 'Cardamom', 'Rose petals', 'Amla', 'Bel pulp'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/paan.png',
  },
  {
    id: 'paan-l', name: 'Royal Paan Bar (100g)', shortName: 'Paan L', mrp: 249,
    description: 'Betel leaf, dry dates, cardamom, rose',
    longDescription: 'The iconic Banarasi paan, reimagined as a chocolate. It opens cool and refreshing, then melts into a rich sweetness, giving you the after-meal paan experience in a completely new way.',
    ingredients: ['Betel leaves', 'Dry dates', 'Aniseed', 'Cardamom', 'Rose petals', 'Amla', 'Bel pulp'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/paan.png',
  },
  {
    id: 'gilori-s', name: 'Banarasi Gilori Bar (45g)', shortName: 'Gilori S', mrp: 129,
    description: 'Honey, anjeer, almonds, pistachios',
    longDescription: 'A rich and indulgent take on the traditional Banarasi gilori. Smooth chocolate blended with honey, anjeer, almonds, cashews, pista, and postakadana for a naturally sweet, nutty experience.',
    ingredients: ['Honey', 'Anjeer (dried figs)', 'Almonds', 'Cashews', 'Pista (pistachios)', 'Postakadana (poppy seeds)'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/gilori.png',
  },
  {
    id: 'gilori-l', name: 'Banarasi Gilori Bar (100g)', shortName: 'Gilori L', mrp: 249,
    description: 'Honey, anjeer, almonds, pistachios',
    longDescription: 'A rich and indulgent take on the traditional Banarasi gilori. Smooth chocolate blended with honey, anjeer, almonds, cashews, pista, and postakadana for a naturally sweet, nutty experience.',
    ingredients: ['Honey', 'Anjeer (dried figs)', 'Almonds', 'Cashews', 'Pista (pistachios)', 'Postakadana (poppy seeds)'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/gilori.png',
  },
  {
    id: 'thandai-s', name: 'Banarasi Thandai Bar (45g)', shortName: 'Thandai S', mrp: 129,
    description: 'Almonds, cashews, makhana, rose petals',
    longDescription: 'A chocolate inspired by the festive thandai of Banaras. This bar brings together the richness of traditional ingredients like almonds, cashews, makhana, and rose petals, blended into a warm, nutty, and gently aromatic experience.',
    ingredients: ['Almonds', 'Cashews', 'Makhana (fox nuts)', 'Watermelon seeds', 'Pumpkin seeds', 'Lettuce seeds', 'Rose petals'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/thandai.png',
  },
  {
    id: 'thandai-l', name: 'Banarasi Thandai Bar (100g)', shortName: 'Thandai L', mrp: 249,
    description: 'Almonds, cashews, makhana, rose petals',
    longDescription: 'A chocolate inspired by the festive thandai of Banaras. This bar brings together the richness of traditional ingredients like almonds, cashews, makhana, and rose petals, blended into a warm, nutty, and gently aromatic experience.',
    ingredients: ['Almonds', 'Cashews', 'Makhana (fox nuts)', 'Watermelon seeds', 'Pumpkin seeds', 'Lettuce seeds', 'Rose petals'],
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/thandai.png',
  },
  {
    id: 'heritage-s', name: 'Heritage Box (Small)', shortName: 'Heritage S', mrp: 699,
    description: 'Curated heritage gift box',
    longDescription: 'A beautifully curated gift box carrying the sweetness of Banaras. Perfect for festive gifting and special occasions, featuring a handpicked selection of our finest creations.',
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/heritage.png',
  },
  {
    id: 'heritage-l', name: 'Heritage Box (Large)', shortName: 'Heritage L', mrp: 1099,
    description: 'Premium heritage gift box',
    longDescription: 'Our premium heritage collection — a generous assortment of handcrafted chocolates in an elegant presentation box. The perfect centrepiece for celebrations and corporate gifting.',
    storage: 'Keep refrigerated or store in a cool, dry place.',
    image: '/products/heritage.png',
  },
];

export const PRODUCTS_MAP = new Map(PRODUCTS.map((p) => [p.id, p]));

function mrpSum(items: DealLineItem[]): number {
  return items.reduce((sum, item) => {
    const product = PRODUCTS_MAP.get(item.productId);
    return sum + (product ? product.mrp * item.qty : 0);
  }, 0);
}

function totalPcs(items: DealLineItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}

// Packs weighted by actual sales distribution:
// Paan ~40%, Gilori ~22%, Thandai ~22%, Heritage sprinkled in
const STARTER_ITEMS: DealLineItem[] = [
  { productId: 'paan-s', qty: 20 },
  { productId: 'paan-l', qty: 12 },
  { productId: 'gilori-s', qty: 10 },
  { productId: 'thandai-s', qty: 10 },
  { productId: 'thandai-l', qty: 4 },
  { productId: 'gilori-l', qty: 4 },
  { productId: 'heritage-s', qty: 1 },
];

const GROWTH_ITEMS: DealLineItem[] = [
  { productId: 'paan-s', qty: 30 },
  { productId: 'paan-l', qty: 18 },
  { productId: 'gilori-s', qty: 16 },
  { productId: 'thandai-s', qty: 16 },
  { productId: 'thandai-l', qty: 6 },
  { productId: 'gilori-l', qty: 6 },
  { productId: 'heritage-s', qty: 1 },
];

const PREMIUM_ITEMS: DealLineItem[] = [
  { productId: 'paan-s', qty: 48 },
  { productId: 'paan-l', qty: 30 },
  { productId: 'gilori-s', qty: 24 },
  { productId: 'thandai-s', qty: 24 },
  { productId: 'thandai-l', qty: 12 },
  { productId: 'gilori-l', qty: 10 },
  { productId: 'heritage-s', qty: 2 },
];

const MEGA_ITEMS: DealLineItem[] = [
  { productId: 'paan-s', qty: 96 },
  { productId: 'paan-l', qty: 60 },
  { productId: 'gilori-s', qty: 48 },
  { productId: 'thandai-s', qty: 48 },
  { productId: 'thandai-l', qty: 24 },
  { productId: 'gilori-l', qty: 20 },
  { productId: 'heritage-s', qty: 3 },
  { productId: 'heritage-l', qty: 2 },
];

export const DEALS: DealPack[] = [
  {
    id: 'starter-pack',
    name: 'Starter Pack',
    subtitle: '61 pcs — Best sellers + Heritage box',
    items: STARTER_ITEMS,
    totalPcs: totalPcs(STARTER_ITEMS),    // 61
    mrpTotal: mrpSum(STARTER_ITEMS),      // ₹10,839
    dealPrice: 9999,
    payNowPrice: 9499,
    partialPct: 50,
  },
  {
    id: 'growth-pack',
    name: 'Growth Pack',
    subtitle: '93 pcs — Scale up your display',
    items: GROWTH_ITEMS,
    totalPcs: totalPcs(GROWTH_ITEMS),     // 93
    mrpTotal: mrpSum(GROWTH_ITEMS),       // ₹16,167
    dealPrice: 14999,
    payNowPrice: 13999,
    partialPct: 50,
    badge: 'Most Popular',
  },
  {
    id: 'premium-pack',
    name: 'Premium Pack',
    subtitle: '150 pcs — Full store coverage',
    items: PREMIUM_ITEMS,
    totalPcs: totalPcs(PREMIUM_ITEMS),    // 150
    mrpTotal: mrpSum(PREMIUM_ITEMS),      // ₹26,730
    dealPrice: 24999,
    payNowPrice: 23499,
    partialPct: 50,
    badge: 'Premium',
  },
  {
    id: 'mega-pack',
    name: 'Mega Pack',
    subtitle: '301 pcs — Maximum value bulk order',
    items: MEGA_ITEMS,
    totalPcs: totalPcs(MEGA_ITEMS),       // 301
    mrpTotal: mrpSum(MEGA_ITEMS),         // ₹54,959
    dealPrice: 49999,
    payNowPrice: 46999,
    partialPct: 50,
    badge: 'Best Value',
  },
];

export function discountPct(mrp: number, price: number): number {
  return Math.round(((mrp - price) / mrp) * 100);
}
