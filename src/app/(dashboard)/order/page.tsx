'use client';

import { ShoppingCart } from 'lucide-react';
import { PRODUCTS, DEALS } from '@/lib/products';
import { useCartSafe } from '@/contexts/CartContext';
import DealCard from '@/components/Dashboard/DealCard';
import CartDrawer from '@/components/Dashboard/CartDrawer';

const UNIQUE_FLAVORS = PRODUCTS.filter((p) => p.size === '45g');

export default function OrderPage() {
  const cart = useCartSafe();
  const addItem = cart?.addItem ?? (() => {});
  const totalItems = cart?.totalItems ?? 0;
  const setCartOpen = cart?.setCartOpen ?? (() => {});

  return (
    <>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Restock your store with our chocolate bars</p>
        </div>

        {/* Product Info Strip */}
        <div className="bg-gradient-to-r from-brand-olive/10 to-brand-gold/10 dark:from-brand-olive/20 dark:to-brand-gold/20 rounded-xl p-5 border border-brand-gold/20">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Our Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {UNIQUE_FLAVORS.map((product) => (
              <div key={product.id} className="flex gap-3 items-start">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-brand-olive/20 to-brand-gold/20 dark:from-brand-olive/30 dark:to-brand-gold/30 flex items-center justify-center flex-shrink-0 border border-brand-gold/20">
                  <span className="text-xs font-bold text-brand-olive dark:text-brand-gold uppercase">
                    {product.flavor.slice(0, 2)}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{product.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{product.description}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    45g: <span className="font-medium">₹129</span> · 100g: <span className="font-medium">₹249</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deals Grid */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pick a Pack</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEALS.map((deal) => (
              <DealCard key={deal.id} deal={deal} onAdd={addItem} />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Bar — mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 inset-x-0 sm:hidden bg-surface-card border-t border-surface-border px-4 py-3 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 bg-brand-olive text-white rounded-xl font-semibold text-sm hover:bg-brand-olive/90 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            View Cart ({totalItems})
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer />
    </>
  );
}
