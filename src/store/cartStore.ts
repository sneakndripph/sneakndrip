"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, PaymentType } from "@/lib/types";

interface CartState {
  items: CartItem[];
  addItem: (product: Product, size: string, paymentType: PaymentType, qty?: number) => void;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, size, paymentType, qty = 1) => {
        const price = paymentType === "full_payment"
          ? product.full_payment_price
          : product.downpayment_price;

        set(state => {
          const existing = state.items.find(
            i => i.product.id === product.id && i.size === size
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id && i.size === size
                  ? { ...i, quantity: i.quantity + qty }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { product, size, quantity: qty, payment_type: paymentType, unit_price: price }],
          };
        });
      },

      removeItem: (productId, size) =>
        set(state => ({
          items: state.items.filter(i => !(i.product.id === productId && i.size === size)),
        })),

      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId && i.size === size ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    { name: "snd-cart" }
  )
);
