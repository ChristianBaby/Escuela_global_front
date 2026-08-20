"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
import { useAuthStore } from "@/store/authStore";
import { paymentsService } from "@/lib/services/payments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const FALLBACK_PUBLIC_KEY = "TEST-a6a719c4-9eba-488c-9bf8-22facd0b6475";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || FALLBACK_PUBLIC_KEY;

if (!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY) {
  console.warn(
    "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY no está configurada — usando llave de prueba de fallback."
  );
}

initMercadoPago(PUBLIC_KEY, {
  locale: "es-PE",
});

interface MercadoPagoBrickProps {
  orderId: string;
  totalAmount: number;
  currency: string;
}

export function MercadoPagoBrick({ orderId, totalAmount }: MercadoPagoBrickProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    paymentsService.mercadoPago
      .createPreference({ orderId })
      .then(({ preferenceId }) => {
        setPreferenceId(preferenceId);
        setLoading(false);
      })
      .catch((err) => {
        console.warn("Error al obtener la sesión de Mercado Pago:", err);
        setLoading(false);
      });
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2 bg-white rounded-xl border border-gray-200">
        <Loader2 size={28} className="animate-spin text-[#084D95]" />
        <p className="text-xs text-gray-400">Generando pasarela segura con Mercado Pago...</p>
      </div>
    );
  }

  const initialization = {
    amount: totalAmount,
    preferenceId: preferenceId || undefined, 
    payer: {
      email: user?.email || "estudiante_demo@escuelaglobal.com",
      firstName: user?.first_name || "Ferdy",
      lastName: user?.last_name || "Estudiante",
      entityType: "individual" as const,
    },
  };

  const customization = {
    visual: {
      style: {
        theme: "default" as const,
      },
    },
    paymentMethods: {
      creditCard: "all" as const,
      debitCard: "all" as const,
      mercadoPago: "all" as const,
      maxInstallments: 1,
      // 🚀 EXCLUIMOS onboarding_credits PARA ELIMINAR EL ERROR DEL BROWSER EN SANDBOX
      excludedPaymentTypes: ["onboarding_credits"] as any,
    },
  };

  const onSubmit = async (param: any) => {
    const { selectedPaymentMethod, formData } = param;

    // Con la Billetera de Mercado Pago, el propio SDK redirige al comprador
    // a MP usando la preferencia — no hay formData de tarjeta que enviar.
    if (selectedPaymentMethod === "wallet_purchase" || !formData) {
      return;
    }

    try {
      const data = await paymentsService.mercadoPago.processBrickPayment({
        orderId,
        token: formData.token,
        payment_method_id: formData.payment_method_id,
        issuer_id: formData.issuer_id,
        installments: formData.installments,
        payer: { email: formData.payer.email },
      });

      if (!data.success) {
        throw new Error("La transacción no pudo ser validada.");
      }

      toast.success("¡Matrícula procesada y aprobada con éxito!");
      // 🚀 REDIRECCIÓN CON PARÁMETRO DE ORDEN PARA CONECTAR CON EL POLLING DE LA BOLETA
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch (error: any) {
      console.warn("Error al capturar el cobro:", error);
      const backendMessage = error?.response?.data?.message;
      toast.error(backendMessage || "La transacción no pudo ser validada.");
      throw error;
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-xl border border-gray-200 shadow-sm min-h-[350px]">
      {preferenceId ? (
        <Payment
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onError={(err) => console.warn("Error en Brick Completo:", err)}
        />
      ) : (
        <div className="text-center py-10 text-xs text-red-500">
          No se pudo inicializar el entorno seguro. Verifica tus credenciales (Access Token).
        </div>
      )}
    </div>
  );
}