import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Course } from "@/types";

interface CartEntry {
  course: Course;
  addedAt: string;
}

interface CartState {
  items: CartEntry[];
  addItem: (course: Course) => void;
  removeItem: (courseId: string) => void;
  clearCart: () => void;
  hasItem: (courseId: string) => boolean;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (course) => {
        if (get().hasItem(course.id)) return;
        set((s) => ({ items: [...s.items, { course, addedAt: new Date().toISOString() }] }));
      },

      removeItem: (courseId) =>
        set((s) => ({ items: s.items.filter((i) => i.course.id !== courseId) })),

      clearCart: () => set({ items: [] }),

      hasItem: (courseId) => get().items.some((i) => i.course.id === courseId),

      total: () =>
        get().items.reduce((sum, { course }) => {
          const price = course.discount_price_pen ?? course.price_pen;
          return sum + price;
        }, 0),
    }),
    { name: "cart-storage" }
  )
);
