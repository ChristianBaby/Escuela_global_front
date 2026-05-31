import { api } from "@/lib/http/api";

export interface ApiCartCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string;
  price: number;
  discount_price?: number;
  currency: string;
}

export interface ApiCartItem {
  id: string;
  course: ApiCartCourse;
}

export interface CartResponse {
  items: ApiCartItem[];
  subtotal: number;
  item_count: number;
}

export const cartService = {
  get: (sessionToken?: string): Promise<CartResponse> =>
    api.get("/cart", { params: sessionToken ? { session_token: sessionToken } : {} }).then((r) => r.data),

  add: (courseId: string, sessionToken?: string): Promise<{ success: boolean; cart_item: { id: string; course_id: string }; item_count: number }> =>
    api.post("/cart", { course_id: courseId, ...(sessionToken ? { session_token: sessionToken } : {}) }).then((r) => r.data),

  remove: (itemId: string): Promise<{ success: boolean; item_count: number }> =>
    api.delete(`/cart/${itemId}`).then((r) => r.data),

  clear: (): Promise<{ success: boolean; message: string }> =>
    api.delete("/cart").then((r) => r.data),

  merge: (sessionToken: string): Promise<{ success: boolean; item_count: number }> =>
    api.post("/cart/merge", { session_token: sessionToken }).then((r) => r.data),
};
