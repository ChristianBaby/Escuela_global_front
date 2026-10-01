"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { paymentsService } from "@/lib/services/payments";

// Client ID de la app sandbox de PayPal (es público, va en el navegador).
const FALLBACK_CLIENT_ID = "AcA7lkNQIguA9sGXvvNRl8hq_tbqU2KqAbAB6fQNe5rUmSaO0yUS7co0qL8TC3j8g4nQ7npkUhSaUKWA";
const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || FALLBACK_CLIENT_ID;

if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
  console.warn("NEXT_PUBLIC_PAYPAL_CLIENT_ID no está configurada — usando client ID sandbox de fallback.");
}

interface PayPalButtonProps {
  orderId: string;
  totalAmount: number;
  currency: string; // Las órdenes de PayPal se crean en USD (backend)
}

function errorMessage(error: unknown, fallback: string) {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === "string" ? message : fallback;
}

export function PayPalButtonComponent({ orderId, totalAmount, currency }: PayPalButtonProps) {
  const router = useRouter();

  // El monto lo fija el backend a partir de la orden; aquí solo se muestra.
  const handleCreateOrder = async () => {
    try {
      const { paypalOrderId } = await paymentsService.paypal.createOrder({ orderId });
      return paypalOrderId;
    } catch (error) {
      toast.error(errorMessage(error, "No se pudo conectar con la pasarela de PayPal."));
      throw error;
    }
  };

  const handleOnApprove = async (data: { orderID: string }) => {
    try {
      toast.info("Procesando pago...");
      const result = await paymentsService.paypal.capture({ orderId, paypalOrderId: data.orderID });

      if (result.pending) {
        toast.info("PayPal está revisando tu pago. Te avisaremos cuando se confirme.");
      } else {
        toast.success("¡Pago confirmado!");
      }
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      toast.error(errorMessage(error, "El pago no pudo ser procesado por PayPal."));
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 font-medium">
          🌎 Pago internacional seguro: <strong className="font-mono">${totalAmount.toFixed(2)} {currency}</strong>
        </p>
      </div>

      <PayPalScriptProvider options={{ clientId: CLIENT_ID, currency, intent: "capture" }}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={handleCreateOrder}
          onApprove={handleOnApprove}
          onError={() => {
            toast.error("Hubo un problema al abrir la ventana segura de PayPal.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
