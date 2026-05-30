import { api } from "@/lib/http/api";

export interface CartCourse {
  id: string;
  title: string;
  thumbnail_url: string;
  price: number;
  discount_price?: number;
  currency: "USD" | "PEN";
}

export interface CartItem {
  id: string;
  course: CartCourse;
}

export interface CartResponse {
  items: CartItem[];
  subtotal: number;
  item_count: number;
}

const SESSION_KEY = "escuela_global_session_token";

/**
 * Obtiene o genera un token único para invitados persistido en el navegador
 */
export function getOrCreateSessionToken(): string {
  if (typeof window === "undefined") return "";
  let token = localStorage.getItem(SESSION_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, token);
  }
  return token;
}

export const cartService = {
  /**
   * Obtiene los elementos del carrito de la API (Soporta Autenticado e Invitado)
   */
  getCart: async (isAuthenticated: boolean): Promise<CartResponse> => {
    const params: Record<string, string> = {};
    if (!isAuthenticated) {
      params.session_token = getOrCreateSessionToken();
    }
    
    const { data } = await api.get<CartResponse>("/api/cart", { params });
    return data;
  },

  /**
   * Agrega un curso al carrito
   */
  addItem: async (courseId: string, isAuthenticated: boolean): Promise<any> => {
    const body: Record<string, any> = { course_id: courseId };
    if (!isAuthenticated) {
      body.session_token = getOrCreateSessionToken();
    }
    
    const { data } = await api.post("/api/cart", body);
    return data;
  },

  /**
   * Elimina un ítem específico del carrito mediante su itemId
   */
  removeItem: async (itemId: string): Promise<any> => {
    const { data } = await api.delete(`/api/cart/${itemId}`);
    return data;
  },

  /**
   * Vacía el carrito por completo
   */
  clearCart: async (isAuthenticated: boolean): Promise<any> => {
    const params: Record<string, string> = {};
    if (!isAuthenticated) {
      params.session_token = getOrCreateSessionToken();
    }

    const { data } = await api.delete("/api/cart", { params });
    
    // Si era invitado, limpiamos el token local por seguridad
    if (!isAuthenticated) {
      localStorage.removeItem(SESSION_KEY);
    }
    return data;
  },

  /**
   * Ejecuta la fusión de carritos tras un login exitoso
   */
  mergeCart: async (): Promise<any> => {
    const sessionToken = localStorage.getItem(SESSION_KEY);
    if (!sessionToken) return null;

    const { data } = await api.post("/api/cart/merge", { session_token: sessionToken });
    // Una vez fusionado, limpiamos el token de invitado
    localStorage.removeItem(SESSION_KEY);
    return data;
  }
};