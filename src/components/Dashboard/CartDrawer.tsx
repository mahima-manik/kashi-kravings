'use client';

import { X, Minus, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useCartSafe } from '@/contexts/CartContext';
import { DEALS } from '@/lib/products';
import { formatCurrency } from '@/lib/format';

export default function CartDrawer() {
  const cart = useCartSafe();
  const [orderPlaced, setOrderPlaced] = useState(false);

  if (!cart || !cart.isCartOpen) return null;

  const {
    items,
    paymentMode,
    updateQuantity,
    removeItem,
    setPaymentMode,
    clearCart,
    isCartOpen,
    setCartOpen,
    totalItems,
    subtotal,
    mrpTotal,
    savings,
  } = cart;

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  const handleDone = () => {
    setOrderPlaced(false);
    clearCart();
    setCartOpen(false);
  };

  // Compute partial payment amounts
  const partialNow = items.reduce((sum, item) => {
    const deal = DEALS.find((d) => d.id === item.dealId);
    if (!deal) return sum;
    return sum + Math.round((deal.dealPrice * deal.partialPct) / 100) * item.quantity;
  }, 0);
  const partialLater = paymentMode === 'pay_partial' ? subtotal - partialNow : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={() => setCartOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-surface-card border-l border-surface-border z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-bold text-lg text-gray-900 dark:text-white">
            Your Cart {totalItems > 0 && <span className="text-sm font-normal text-gray-500">({totalItems} pack{totalItems !== 1 ? 's' : ''})</span>}
          </h2>
          <button
            onClick={() => setCartOpen(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {orderPlaced ? (
            /* Success State */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Order Placed!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                We&apos;ll confirm your order shortly via WhatsApp.
              </p>
              <button
                onClick={handleDone}
                className="px-6 py-2.5 bg-brand-olive text-white rounded-lg font-medium text-sm hover:bg-brand-olive/90 transition-colors"
              >
                Done
              </button>
            </div>
          ) : items.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center h-full px-6 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-sm">Your cart is empty</p>
            </div>
          ) : (
            <div className="px-5 py-4 space-y-4">
              {/* Cart Items */}
              {items.map((item) => {
                const deal = DEALS.find((d) => d.id === item.dealId);
                if (!deal) return null;
                const linePrice = (paymentMode === 'pay_now' ? deal.payNowPrice : deal.dealPrice) * item.quantity;
                return (
                  <div key={item.dealId} className="flex items-start gap-3 pb-4 border-b border-surface-border last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{deal.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{deal.subtitle}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{formatCurrency(linePrice)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => updateQuantity(item.dealId, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-surface-border text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium text-gray-900 dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.dealId, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-surface-border text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(item.dealId)}
                        className="w-7 h-7 flex items-center justify-center rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Payment Mode Selector */}
              <div className="space-y-2 pt-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Payment Option</p>

                {/* Pay Now */}
                <button
                  onClick={() => setPaymentMode('pay_now')}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    paymentMode === 'pay_now'
                      ? 'border-brand-olive dark:border-brand-gold bg-brand-olive/5 dark:bg-brand-gold/10'
                      : 'border-surface-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">Pay Now</span>
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">Extra savings!</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Pay full amount & get best price
                  </p>
                </button>

                {/* Pay Partial */}
                <button
                  onClick={() => setPaymentMode('pay_partial')}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-all ${
                    paymentMode === 'pay_partial'
                      ? 'border-brand-olive dark:border-brand-gold bg-brand-olive/5 dark:bg-brand-gold/10'
                      : 'border-surface-border hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">Pay 50% Now</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Pay {formatCurrency(partialNow)} now, rest on delivery
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {items.length > 0 && !orderPlaced && (
          <div className="border-t border-surface-border px-5 py-4 space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-500 dark:text-gray-400">
                <span>MRP Total</span>
                <span className="line-through">{formatCurrency(mrpTotal)}</span>
              </div>
              <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                <span>You Save</span>
                <span>{formatCurrency(savings)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white text-base pt-1 border-t border-surface-border">
                <span>Amount Due Now</span>
                <span>{formatCurrency(paymentMode === 'pay_partial' ? partialNow : subtotal)}</span>
              </div>
              {paymentMode === 'pay_partial' && (
                <div className="flex justify-between text-gray-500 dark:text-gray-400">
                  <span>Balance on Delivery</span>
                  <span>{formatCurrency(partialLater)}</span>
                </div>
              )}
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!paymentMode}
              className="w-full py-3 bg-brand-olive text-white rounded-xl font-semibold text-sm hover:bg-brand-olive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Place Order
            </button>
          </div>
        )}
      </div>
    </>
  );
}
