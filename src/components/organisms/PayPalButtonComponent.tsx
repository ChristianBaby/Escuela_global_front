"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { api } from "@/lib/http/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PayPalButtonProps {
  orderId: string;
  totalAmount: number;
}

export function PayPalButtonComponent({ orderId, totalAmount }: PayPalButtonProps) {
  const router = useRouter();

  // 💡 NOTA DE TESIS: PayPal no acepta Soles (PEN). Convertimos a USD al vuelo para la Demo.
  const exchangeRate = 3.75;
  const amountInUSD = (totalAmount / exchangeRate).toFixed(2);

  // Configuración del SDK de PayPal
  // Reemplaza "test" por tu Client ID de Sandbox si deseas usar tu propia cuenta de pruebas.
  const initialOptions = {
    clientId: "AcA7lkNQIguA9sGXvvNRl8hq_tbqU2KqAbAB6fQNe5rUmSaO0yUS7co0qL8TC3j8g4nQ7npkUhSaUKWA", 
    currency: "USD",
    intent: "capture",
  };

  // 1. Llama a tu endpoint @Post('session') para obtener el paypalOrderId real de la API
  const handleCreateOrder = async () => {
    try {
      const { data } = await api.post("/payments/session", {
          orderId: orderId,
          paymentMethod: "paypal",
          currency: "USD", // PayPal siempre requiere USD
          amount: amountInUSD
        });
        return data.paypalOrderId;
      } catch (error) { 
      console.error("Error al iniciar orden de PayPal:", error);
      toast.error("No se pudo conectar con la pasarela de PayPal.");
      throw error; }
    };
      

  // 2. Llama a tu endpoint @Post('paypal/capture/:paypalOrderId') al confirmar el pago en la ventana flotante
  const handleOnApprove = async (data: any) => {
    try {
      // Pega exactamente en tu ruta con parámetro de NestJS (sin /api de más)
      const response = await api.post(`/payments/paypal/capture/${data.orderID}`);

      if (response.data.success) {
        toast.success("¡Pago internacional con PayPal aprobado!");
        router.push("/checkout/success");
      } else {
        toast.error("El pago no pudo ser verificado por el servidor.");
      }
    } catch (error) {
      console.error("Error en la captura de PayPal:", error);
      toast.error("Error crítico al procesar la matrícula internacional.");
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 font-medium">
          🌎 Pago Internacional Seguro (Monto equivalente: <strong className="font-mono">${amountInUSD} USD</strong>)
        </p>
      </div>

      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{ layout: "vertical", color: "gold", shape: "rect", label: "paypal" }}
          createOrder={handleCreateOrder}
          onApprove={handleOnApprove}
          onError={(err: any) => {
            console.error("PayPal Smart Buttons Error:", err);
            toast.error("Hubo un problema al abrir la ventana segura de PayPal.");
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}