'use client';

import { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { CartItem } from '@/lib/products';
import { DEALS } from '@/lib/products';

type PaymentMode = 'pay_now' | 'pay_partial' | null;

interface CartState {
  items: CartItem[];
  paymentMode: PaymentMode;
}

type CartAction =
  | { type: 'ADD_ITEM'; dealId: string; qty: number }
  | { type: 'REMOVE_ITEM'; dealId: string }
  | { type: 'UPDATE_QTY'; dealId: string; qty: number }
  | { type: 'SET_PAYMENT_MODE'; mode: PaymentMode }
  | { type: 'CLEAR' }
  | { type: 'HYDRATE'; state: CartState };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existing = state.items.find((i) => i.dealId === action.dealId);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.dealId === action.dealId ? { ...i, quantity: i.quantity + action.qty } : i
          ),
        };
      }
      return { ...state, items: [...state.items, { dealId: action.dealId, quantity: action.qty }] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.dealId !== action.dealId) };
    case 'UPDATE_QTY': {
      if (action.qty <= 0) {
        return { ...state, items: state.items.filter((i) => i.dealId !== action.dealId) };
      }
      return {
        ...state,
        items: state.items.map((i) =>
          i.dealId === action.dealId ? { ...i, quantity: action.qty } : i
        ),
      };
    }
    case 'SET_PAYMENT_MODE':
      return { ...state, paymentMode: action.mode };
    case 'CLEAR':
      return { items: [], paymentMode: null };
    case 'HYDRATE':
      return action.state;
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  paymentMode: PaymentMode;
  addItem: (dealId: string, qty?: number) => void;
  removeItem: (dealId: string) => void;
  updateQuantity: (dealId: string, qty: number) => void;
  setPaymentMode: (mode: PaymentMode) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  totalItems: number;
  subtotal: number;
  mrpTotal: number;
  savings: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'kk-cart';

function loadCart(): CartState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.items)) return parsed as CartState;
  } catch {
    // ignore
  }
  return null;
}

function saveCart(state: CartState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], paymentMode: null });
  const [isCartOpen, setCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = loadCart();
    if (saved) dispatch({ type: 'HYDRATE', state: saved });
    setHydrated(true);
  }, []);

  // Persist to localStorage on change (after hydration)
  useEffect(() => {
    if (hydrated) saveCart(state);
  }, [state, hydrated]);

  const addItem = useCallback((dealId: string, qty = 1) => {
    dispatch({ type: 'ADD_ITEM', dealId, qty });
  }, []);

  const removeItem = useCallback((dealId: string) => {
    dispatch({ type: 'REMOVE_ITEM', dealId });
  }, []);

  const updateQuantity = useCallback((dealId: string, qty: number) => {
    dispatch({ type: 'UPDATE_QTY', dealId, qty });
  }, []);

  const setPaymentMode = useCallback((mode: PaymentMode) => {
    dispatch({ type: 'SET_PAYMENT_MODE', mode });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const totalItems = useMemo(
    () => state.items.reduce((sum, i) => sum + i.quantity, 0),
    [state.items]
  );

  const { subtotal, mrpTotal } = useMemo(() => {
    let sub = 0;
    let mrp = 0;
    state.items.forEach((item) => {
      const deal = DEALS.find((d) => d.id === item.dealId);
      if (!deal) return;
      const price = state.paymentMode === 'pay_now' ? deal.payNowPrice : deal.dealPrice;
      sub += price * item.quantity;
      mrp += deal.mrpTotal * item.quantity;
    });
    return { subtotal: sub, mrpTotal: mrp };
  }, [state.items, state.paymentMode]);

  const savings = mrpTotal - subtotal;

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      paymentMode: state.paymentMode,
      addItem,
      removeItem,
      updateQuantity,
      setPaymentMode,
      clearCart,
      isCartOpen,
      setCartOpen,
      totalItems,
      subtotal,
      mrpTotal,
      savings,
    }),
    [state, addItem, removeItem, updateQuantity, setPaymentMode, clearCart, isCartOpen, totalItems, subtotal, mrpTotal, savings]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

// Safe hook that returns null when no provider exists (for Header used by all roles)
export function useCartSafe(): CartContextValue | null {
  return useContext(CartContext);
}
