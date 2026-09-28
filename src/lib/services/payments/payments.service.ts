import { api } from "@/lib/http/api";

export interface CreateMercadoPagoPreferenceDto {
  orderId: string;
}

export interface CreateMercadoPagoPreferenceResponse {
  preferenceId: string;
}

export interface MercadoPagoBrickFormData {
  orderId: string;
  token: string;
  payment_method_id: string;
  issuer_id?: string;
  installments: number;
  payer: { email: string };
}

export interface ProcessMercadoPagoBrickResponse {
  success: boolean;
  order_number: string;
}

export interface CreateCulqiChargeDto {
  orderId: string;
  token: string;
  email: string;
}

export interface CreateCulqiChargeResponse {
  success: boolean;
  order_number: string;
}

export interface CreatePaypalOrderResponse {
  paypalOrderId: string;
}

export interface CapturePaypalOrderDto {
  orderId: string;
  paypalOrderId: string;
}

export interface CapturePaypalOrderResponse {
  success: boolean;
  order_number: string;
  // La captura quedó retenida por PayPal; la confirma el webhook del backend.
  pending?: boolean;
}

export const paymentsService = {
  mercadoPago: {
    createPreference: (data: CreateMercadoPagoPreferenceDto) =>
      api
        .post<CreateMercadoPagoPreferenceResponse>("/payments-v2/mercadopago/preference", data)
        .then((r) => r.data),

    processBrickPayment: (data: MercadoPagoBrickFormData) =>
      api
        .post<ProcessMercadoPagoBrickResponse>("/payments-v2/mercadopago/brick", data)
        .then((r) => r.data),
  },

  culqi: {
    createCharge: (data: CreateCulqiChargeDto) =>
      api
        .post<CreateCulqiChargeResponse>("/payments-v2/culqi/charge", data)
        .then((r) => r.data),
  },

  paypal: {
    createOrder: (data: { orderId: string }) =>
      api
        .post<CreatePaypalOrderResponse>("/payments-v2/paypal/orders", data)
        .then((r) => r.data),

    capture: (data: CapturePaypalOrderDto) =>
      api
        .post<CapturePaypalOrderResponse>("/payments-v2/paypal/capture", data)
        .then((r) => r.data),
  },
};
