import { api } from "@/lib/http/api";

export interface CreateOrderDto {
  payment_method: "stripe" | "paypal" | "mercado_pago";
  dni_ruc?: string;
}

export interface OrderResponse {
  id: string;
  order_number: string;
  total: number;
  currency: string;
}

export interface OrderItem {
  course_id: string;
  title: string;
  thumbnail_url: string;
  unit_price: number;
  discount_price: number | null;
  final_price: number;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  subtotal: number;
  total: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  billing_name: string;
  billing_email: string;
  billing_country: string;
  created_at: string;
  items: OrderItem[];
}

export const ordersService = {
  create: (data: CreateOrderDto) =>
    api.post<OrderResponse>("/orders", data).then((r) => r.data),

  get: (id: string) =>
    api.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),
};
