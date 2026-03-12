// Store tier definitions
export const STORE_TIERS = {
  company_promoter: 'Company Promoter',
  store_promoter: 'Store Promoter',
  no_promoter: 'No Promoter',
} as const;

export type StoreTier = keyof typeof STORE_TIERS;

// Store definitions
export interface Store {
  code: string;
  name: string;
  aliases?: string[];
  tier: StoreTier;
  address?: string | null;
  contact_name?: string | null;
  contact_phone?: string | null;
}

/**
 * Match a contact name to a store code using case-insensitive prefix matching.
 * Accepts a stores array so it can work with DB-fetched data.
 */
export function findStoreCode(contactName: string, stores: Store[]): string | null {
  const lower = contactName.toLowerCase();
  for (const store of stores) {
    if (lower.startsWith(store.name.toLowerCase())) return store.code;
    for (const alias of store.aliases ?? []) {
      if (lower.startsWith(alias.toLowerCase())) return store.code;
    }
  }
  return null;
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
