import { create } from "zustand";

interface WishlistState {
  items: string[];
  loaded: boolean;
  setItems: (items: string[]) => void;
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  reset: () => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  items: [],
  loaded: false,
  setItems: (items) => set({ items, loaded: true }),
  addItem: (id) => set(state => ({ items: [...state.items, id] })),
  removeItem: (id) => set(state => ({ items: state.items.filter(i => i !== id) })),
  reset: () => set({ items: [], loaded: false }),
}));
