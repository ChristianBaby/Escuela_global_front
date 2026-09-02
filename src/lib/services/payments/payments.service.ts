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
};
