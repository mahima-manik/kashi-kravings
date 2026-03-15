'use client';

import { X, Heart, CheckSquare, Truck, Snowflake } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import type { ProductItem, ProductId } from '@/lib/products';
import { PRODUCTS, baseProductName, getRelatedProducts } from '@/lib/products';
import { formatCurrency } from '@/lib/format';

interface ProductDetailModalProps {
  productId: ProductId;
  onClose: () => void;
  onNavigate: (id: ProductId) => void;
}

export default function ProductDetailModal({ productId, onClose, onNavigate }: ProductDetailModalProps) {
  const product = PRODUCTS.find((p) => p.id === productId);
  if (!product) return null;

  // Find size variants (e.g. paan-s and paan-l)
  const base = productId.replace(/-[sl]$/, '');
  const variants = PRODUCTS.filter((p) => p.id.startsWith(base + '-'));
  const isHeritage = productId.startsWith('heritage');

  const related = getRelatedProducts(productId);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
        <div
          className="relative bg-surface-card rounded-2xl border border-surface-border shadow-2xl w-full max-w-3xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 text-gray-500 hover:text-gray-900 dark:hover:text-white backdrop-blur-sm transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative aspect-square bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none overflow-hidden">
              {product.image && (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-8"
                  sizes="(max-width: 768px) 100vw, 384px"
                />
              )}
            </div>

            {/* Details */}
            <div className="p-6 md:p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {baseProductName(productId)}
              </h2>

              {/* Size variants */}
              {variants.length > 1 && !isHeritage && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Size</p>
                  <div className="flex gap-2">
                    {variants.map((v) => {
                      const size = v.id.endsWith('-s') ? '45g' : '100g';
                      const isActive = v.id === productId;
                      return (
                        <button
                          key={v.id}
                          onClick={() => onNavigate(v.id)}
                          className={`px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                            isActive
                              ? 'border-brand-olive dark:border-brand-gold bg-brand-olive/5 dark:bg-brand-gold/10 text-brand-olive dark:text-brand-gold'
                              : 'border-surface-border text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                        >
                          {size} / {formatCurrency(v.mrp)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Heritage pricing */}
              {isHeritage && (
                <p className="mt-3 text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(product.mrp)}
                </p>
              )}

              {/* Description */}
              {product.longDescription && (
                <p className="mt-5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {product.longDescription}
                </p>
              )}

              {/* Ingredients */}
              {product.ingredients && product.ingredients.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Key Ingredients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {product.ingredients.map((ing) => (
                      <span
                        key={ing}
                        className="px-2.5 py-1 text-xs font-medium rounded-full bg-brand-olive/10 dark:bg-brand-gold/10 text-brand-olive dark:text-brand-gold"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Storage */}
              {product.storage && (
                <div className="mt-4 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Snowflake className="h-3.5 w-3.5 flex-shrink-0" />
                  {product.storage}
                </div>
              )}

              {/* Spacer */}
              <div className="flex-1" />

              {/* Trust badges */}
              <div className="mt-6 pt-5 border-t border-surface-border">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { icon: Heart, label: 'Made with Love' },
                    { icon: CheckSquare, label: 'Quality Assured' },
                    { icon: Truck, label: 'Fast Delivery' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center text-center gap-1.5">
                      <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" strokeWidth={1.5} />
                      <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* You may also like */}
          {related.length > 0 && (
            <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2">
              <div className="border-t border-surface-border pt-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">You may also like</h3>
                <div className="grid grid-cols-3 gap-4">
                  {related.map((rel) => (
                    <button
                      key={rel.id}
                      onClick={() => onNavigate(rel.id)}
                      className="text-left group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 mb-2">
                        {rel.image && (
                          <Image
                            src={rel.image}
                            alt={rel.name}
                            fill
                            className="object-contain p-3 group-hover:scale-105 transition-transform"
                            sizes="150px"
                          />
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-brand-olive dark:group-hover:text-brand-gold transition-colors">
                        {baseProductName(rel.id)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        From {formatCurrency(rel.mrp)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
