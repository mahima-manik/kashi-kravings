'use client';

import { ShoppingCart, Sparkles, Minus, Plus } from 'lucide-react';
import Image from 'next/image';
import type { DealPack } from '@/lib/products';
import { discountPct } from '@/lib/products';
import { formatCurrency } from '@/lib/format';
import { useCart } from '@/contexts/CartContext';

interface DealCardProps {
  deal: DealPack;
  featured?: boolean;
  onAdd: (dealId: string) => void;
}

const FLAVOR_LABELS: Record<string, string> = {
  thandai: 'Thandai',
  paan: 'Paan',
  gilori: 'Gilori',
};

export default function DealCard({ deal, featured, onAdd }: DealCardProps) {
  const { items, updateQuantity } = useCart();
  const cartItem = items.find((i) => i.dealId === deal.id);
  const qty = cartItem?.quantity ?? 0;
  const discount = discountPct(deal.mrpTotal, deal.dealPrice);
  const payNowDiscount = discountPct(deal.mrpTotal, deal.payNowPrice);

  return (
    <div className={`relative bg-surface-card rounded-2xl border border-surface-border overflow-hidden transition-all hover:shadow-xl hover:scale-[1.01] ${featured ? '' : 'flex flex-col'}`}>
      {/* Badge */}
      {deal.badge && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-brand-gold text-white shadow-md">
            <Sparkles className="h-3 w-3" />
            {deal.badge}
          </span>
        </div>
      )}

      {/* Discount badge — top right */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full bg-green-500 text-white shadow-md">
          {discount}% OFF
        </span>
      </div>

      {/* Product Image */}
      <div className="relative w-full aspect-[2.5/1] bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 overflow-hidden">
        <Image
          src="/packs.png"
          alt="Kashi Kravings Chocolate Bars"
          fill
          className="object-cover object-center"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {/* Gradient overlay for text readability below */}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-surface-card to-transparent" />
      </div>

      <div className={`p-5 pt-3 ${featured ? '' : 'flex-1 flex flex-col'}`}>
        {/* Name + Subtitle */}
        <div className="mb-3">
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">{deal.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{deal.subtitle}</p>
        </div>

        {/* Breakdown */}
        {!featured && (
          <div className="mb-4 flex gap-2">
            {deal.items.map((item) => (
              <span
                key={item.flavor}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-brand-olive/10 dark:bg-brand-gold/10 text-brand-olive dark:text-brand-gold"
              >
                {FLAVOR_LABELS[item.flavor]} x{item.qty}
              </span>
            ))}
          </div>
        )}

        {/* Pricing */}
        <div className={`${featured ? 'mt-1' : 'mt-auto pt-3 border-t border-surface-border'}`}>
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-xl font-extrabold text-gray-900 dark:text-white">
              {formatCurrency(deal.dealPrice)}
            </span>
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(deal.mrpTotal)}
            </span>
          </div>
          <p className="text-xs font-medium text-brand-olive dark:text-brand-gold mt-1.5">
            Pay now & save extra — {formatCurrency(deal.payNowPrice)} ({payNowDiscount}% off)
          </p>
        </div>

        {/* Add to Cart / Quantity Stepper */}
        {qty === 0 ? (
          <button
            onClick={() => onAdd(deal.id)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-brand-olive to-brand-olive/90 hover:from-brand-olive/90 hover:to-brand-olive/80 text-white rounded-xl font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
        ) : (
          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => updateQuantity(deal.id, qty - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-surface-border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex-shrink-0"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white">
              {qty} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">in cart</span>
            </span>
            <button
              onClick={() => updateQuantity(deal.id, qty + 1)}
              className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-brand-olive to-brand-olive/90 hover:from-brand-olive/90 hover:to-brand-olive/80 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <Plus className="h-5 w-5" />
              Add More
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
