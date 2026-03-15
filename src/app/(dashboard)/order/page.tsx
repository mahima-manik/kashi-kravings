'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { PRODUCTS, DEALS } from '@/lib/products';
import type { ProductId } from '@/lib/products';
import { useCartSafe } from '@/contexts/CartContext';
import DealCard from '@/components/Dashboard/DealCard';
import CartDrawer from '@/components/Dashboard/CartDrawer';
import ProductDetailModal from '@/components/Dashboard/ProductDetailModal';

// Show bars (S variants) + heritage for the product info strip
const DISPLAY_PRODUCTS = PRODUCTS.filter((p) => ['paan-s', 'gilori-s', 'thandai-s', 'heritage-s'].includes(p.id));

export default function OrderPage() {
  const cart = useCartSafe();
  const addItem = cart?.addItem ?? (() => {});
  const totalItems = cart?.totalItems ?? 0;
  const setCartOpen = cart?.setCartOpen ?? (() => {});

  const [selectedProduct, setSelectedProduct] = useState<ProductId | null>(null);

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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DISPLAY_PRODUCTS.map((product) => (
              <button
                key={product.id}
                onClick={() => setSelectedProduct(product.id)}
                className="flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 relative mb-2 rounded-xl overflow-hidden bg-white dark:bg-white/10 group-hover:ring-2 ring-brand-olive/30 dark:ring-brand-gold/30 transition-all">
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-1 group-hover:scale-105 transition-transform"
                      sizes="96px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-brand-olive/20 to-brand-gold/20">
                      <span className="text-xs font-bold text-brand-olive dark:text-brand-gold uppercase">
                        {product.shortName.slice(0, 2)}
                      </span>
                    </div>
                  )}
                </div>
                <p className="font-medium text-xs text-gray-900 dark:text-white leading-tight group-hover:text-brand-olive dark:group-hover:text-brand-gold transition-colors">{product.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{product.description}</p>
              </button>
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

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          productId={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onNavigate={(id) => setSelectedProduct(id)}
        />
      )}
    </>
  );
}
