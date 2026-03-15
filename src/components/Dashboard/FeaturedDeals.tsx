'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DEALS } from '@/lib/products';
import { useCartSafe } from '@/contexts/CartContext';
import DealCard from './DealCard';

const FEATURED_IDS = ['starter-pack', 'growth-pack'];

export default function FeaturedDeals() {
  const cart = useCartSafe();
  const addItem = cart?.addItem ?? (() => {});
  const featured = DEALS.filter((d) => FEATURED_IDS.includes(d.id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Restock</h3>
        <Link
          href="/order"
          className="text-sm font-medium text-brand-olive dark:text-brand-gold hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {featured.map((deal) => (
          <DealCard key={deal.id} deal={deal} featured onAdd={addItem} />
        ))}
      </div>
    </div>
  );
}
