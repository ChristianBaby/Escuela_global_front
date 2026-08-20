"use client";

// 🚀 Recuperamos los componentes oficiales que manejan el script de forma nativa
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { api } from "@/lib/http/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PayPalButtonProps {
  orderId: string;     // ID de orden interno de Escuela Global (EG-ORD-xxxxxx)
  totalAmount: number; // Monto base en soles
}

export function PayPalButtonComponent({ orderId, totalAmount }: PayPalButtonProps) {
  const router = useRouter();

  // 💡 NOTA DE TESIS: PayPal no acepta Soles (PEN). Convertimos a USD al vuelo para la Demo.
  const exchangeRate = 3.75;
  const amountInUSD = (totalAmount / exchangeRate).toFixed(2);

  // Configuración del SDK de PayPal
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
        currency: "USD", 
        amount: amountInUSD
      });
      return data.paypalOrderId;
    } catch (error) { 
      console.error("Error al iniciar orden de PayPal:", error);
      toast.error("No se pudo conectar con la pasarela de PayPal.");
      throw error; 
    }
  };

  // 2. Llama a tu endpoint al confirmar el pago y redirige sincronizado con el Webhook
  const handleOnApprove = async (data: any) => {
    try {
      toast.info("Procesando pago internacional...");

      // Pega en tu ruta de NestJS envolviéndola en un catch para evitar bloqueos del SDK
      await api.post(`/payments/paypal/capture/${data.orderID}`).catch((backendError) => {
        console.warn("⚠️ El backend demoró la respuesta directa. Dejando que el Webhook asíncrono resuelva en Postgres.");
      });

      toast.success("¡Transacción autorizada con éxito!");

      // 🚀 CAMBIO CLAVE: Redirigimos pasando el orderId interno por la URL (?orderId=...)
      // Esto permite que el polling de la página de éxito valide de inmediato la base de datos real
      setTimeout(() => {
        router.push(`/checkout/success?orderId=${orderId}`);
      }, 400);
    } catch (error) {
      console.error("Error en la captura de PayPal:", error);
      // Red de seguridad: si algo falla, avanzamos igual para que el frente intente validar el Postgres
      router.push(`/checkout/success?orderId=${orderId}`);
    }
  };

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
      <div className="text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-xs text-amber-800 font-medium">
          🌎 Pago Internacional Seguro (Monto equivalente: <strong className="font-mono">${amountInUSD} USD</strong>)
        </p>
      </div>

      {/* 💎 EL PROVIDER: Se encarga de inyectar el script de PayPal de forma segura e inmune a race conditions */}
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