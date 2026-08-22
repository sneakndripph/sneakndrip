"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, PaymentType } from "@/lib/types";

const DEFAULT_PAYMENT_TYPE: PaymentType = "full_payment";

// Cart item identity is product + size + payment_type -- two lines can share
// a product and size if their payment_type differs. Persisted items from
// before payment_type existed are treated as full_payment.
function matches(i: CartItem, productId: string, size: string, paymentType: PaymentType) {
  return i.product.id === productId && i.size === size && (i.payment_type ?? DEFAULT_PAYMENT_TYPE) === paymentType;
}

// Moves `moving` to wherever `apply` puts it, unless that collides with an
// existing line (`collision`), in which case they're merged: quantities are
// combined (capped at available stock, if known) and `moving` is dropped.
function mergeOrMove(
  items: CartItem[],
  moving: CartItem,
  collision: CartItem | undefined,
  apply: (item: CartItem) => CartItem
): CartItem[] {
  if (!collision) {
    return items.map(i => (i === moving ? apply(i) : i));
  }
  const maxStock = moving.product.sizes.find(s => s.size === collision.size)?.stock;
  const mergedQty = maxStock != null
    ? Math.min(collision.quantity + moving.quantity, maxStock)
    : collision.quantity + moving.quantity;
  return items.filter(i => i !== moving).map(i => (i === collision ? { ...i, quantity: mergedQty } : i));
}

// Returned by actions that can merge one line into another (updateSize,
// updatePaymentType), so callers can carry per-line UI state (e.g. cart page
// selection) across the identity change: `id` is the line's id after the
// operation -- unchanged unless `merged` is true, in which case it's the
// absorbing line's id and the original line's id no longer exists.
export type LineMergeResult = { id: string; merged: boolean } | null;

interface CartState {
  items: CartItem[];
  cartUserId: string | null;
  addItem: (product: Product, size: string, paymentType: PaymentType, qty?: number) => void;
  removeItem: (productId: string, size: string, paymentType: PaymentType) => void;
  updateQuantity: (productId: string, size: string, paymentType: PaymentType, quantity: number) => void;
  updateSize: (productId: string, oldSize: string, newSize: string, paymentType: PaymentType) => LineMergeResult;
  clearCart: () => void;
  removeItems: (keys: Array<{ productId: string; size: string; paymentType: PaymentType }>) => void;
  updatePaymentType: (productId: string, size: string, paymentType: PaymentType, newPaymentType: PaymentType) => LineMergeResult;
  itemCount: () => number;
  subtotal: () => number;
  initForUser: (userId: string | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      cartUserId: null,

      addItem: (product, size, paymentType, qty = 1) => {
        const price = paymentType === "full_payment"
          ? product.full_payment_price
          : product.downpayment_price;

        set(state => {
          const existing = state.items.find(i => matches(i, product.id, size, paymentType));
          if (existing) {
            return {
              items: state.items.map(i =>
                matches(i, product.id, size, paymentType)
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { id: crypto.randomUUID(), product, size, quantity: qty, payment_type: paymentType, unit_price: price }],
          };
        });
      },

      removeItem: (productId, size, paymentType) =>
        set(state => ({
          items: state.items.filter(i => !matches(i, productId, size, paymentType)),
        })),

      updateQuantity: (productId, size, paymentType, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, paymentType);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            matches(i, productId, size, paymentType) ? { ...i, quantity } : i
          ),
        }));
      },

      updateSize: (productId, oldSize, newSize, paymentType) => {
        if (oldSize === newSize) return null;
        let result: LineMergeResult = null;
        set(state => {
          const moving = state.items.find(i => matches(i, productId, oldSize, paymentType));
          if (!moving) return state;
          const collision = state.items.find(i => matches(i, productId, newSize, paymentType));
          result = { id: collision ? collision.id : moving.id, merged: !!collision };
          return { items: mergeOrMove(state.items, moving, collision, i => ({ ...i, size: newSize })) };
        });
        return result;
      },

      clearCart: () => set({ items: [], cartUserId: null }),

      removeItems: (keys) =>
        set(state => ({
          items: state.items.filter(i => !keys.some(k => matches(i, k.productId, k.size, k.paymentType))),
        })),

      updatePaymentType: (productId, size, paymentType, newPaymentType) => {
        if (paymentType === newPaymentType) return null;
        let result: LineMergeResult = null;
        set(state => {
          const moving = state.items.find(i => matches(i, productId, size, paymentType));
          if (!moving) return state;
          const unit_price = newPaymentType === "full_payment"
            ? moving.product.full_payment_price
            : moving.product.downpayment_price;
          const collision = state.items.find(i => matches(i, productId, size, newPaymentType));
          result = { id: collision ? collision.id : moving.id, merged: !!collision };
          return {
            items: mergeOrMove(state.items, moving, collision, i => ({ ...i, payment_type: newPaymentType, unit_price })),
          };
        });
        return result;
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),

      // Call on auth state change. Clears cart if a different user is detected.
      initForUser: (userId) =>
        set(state => {
          const stored = state.cartUserId;
          // Different known user logged in → wipe the previous user's cart
          if (stored !== null && stored !== userId) {
            return { items: [], cartUserId: userId };
          }
          return { cartUserId: userId };
        }),
    }),
    {
      name: "snd-cart",
      version: 2,
      // v0 -> v1: payment_type didn't exist yet, so items persisted before this
      // change may be missing it -- default them to full_payment.
      // v1 -> v2: items didn't have a stable id yet -- backfill one so React
      // keys and UI selection state can be decoupled from mutable fields.
      migrate: (persistedState) => {
        const state = persistedState as { items?: CartItem[]; cartUserId?: string | null };
        return {
          cartUserId: state.cartUserId ?? null,
          items: (state.items ?? []).map(i => ({
            ...i,
            payment_type: i.payment_type ?? DEFAULT_PAYMENT_TYPE,
            id: i.id ?? crypto.randomUUID(),
          })),
        } as CartState;
      },
    }
  )
);
