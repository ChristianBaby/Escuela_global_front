import { api } from "@/lib/http/api";

export interface ApiCartItem {
  cartItemId: string;
  courseId: string;
  title: string;
  slug: string;
  thumbnail: string;
  price: number;
  discountPrice: number | null;
  finalPrice: number;
  currency: string;
}

export interface CartResponse {
  items: ApiCartItem[];
  totalCount: number;
  subtotal: number;
  currency: string;
}

export const cartService = {
  // 🟢 Mapped {/api/cart, GET} -> Impecable
  get: (sessionToken?: string): Promise<CartResponse> =>
    api.get("/cart", { params: sessionToken ? { session_token: sessionToken } : {} }).then((r) => r.data),

  // 🚀 CORREGIDO: Apunta a "/cart/add" para eliminar el 404
  add: (courseId: string, sessionToken?: string): Promise<{ success: boolean; cart_item: { id: string; course_id: string }; item_count: number }> =>
    api.post("/cart/add", { course_id: courseId, ...(sessionToken ? { session_token: sessionToken } : {}) }).then((r) => r.data),

  // 🚀 CORREGIDO: Tu backend mapea "/cart/remove/:id" 
  remove: (itemId: string): Promise<{ success: boolean; item_count: number }> =>
    api.delete(`/cart/remove/${itemId}`).then((r) => r.data),

  // 🚀 CORREGIDO: Tu backend mapea "/cart/clear"
  clear: (sessionToken?: string): Promise<{ success: boolean; message: string }> =>
    api.delete("/cart/clear", { params: sessionToken ? { session_token: sessionToken } : {} }).then((r) => r.data),

  // 🟢 Mapped {/api/cart/merge, POST} -> Impecable
  merge: (sessionToken: string): Promise<{ success: boolean; item_count: number }> =>
    api.post("/cart/merge", { session_token: sessionToken }).then((r) => r.data),
};