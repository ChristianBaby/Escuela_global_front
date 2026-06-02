"use client";

import { useEffect, useState } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react"; // Regresamos al componente Payment completo
import { useAuthStore } from "@/store/authStore";
import { api } from "@/lib/http/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || "TEST-a6a719c4-9eba-488c-9bf8-22facd0b6475";

initMercadoPago(PUBLIC_KEY, {
  locale: "es-PE",
});

interface MercadoPagoBrickProps {
  orderId: string;
  totalAmount: number;
}

export function MercadoPagoBrick({ orderId, totalAmount }: MercadoPagoBrickProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // Estados para controlar la carga del PreferenceID real
  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Pedimos el ID de preferencia oficial al backend al montar el componente
 // Busca este bloque dentro de tu MercadoPagoBrick.tsx y déjalo así:
  useEffect(() => {
    api.post("/payments/session", { // 👈 CORREGIDO: Quitamos el "/api" de adelante
      orderId: orderId,
      paymentMethod: "mercado_pago"
    })
    .then(({ data }) => {
      setPreferenceId(data.preferenceId);
      setLoading(false);
    })
    .catch((err) => {
      console.error("Error al obtener la sesión de Mercado Pago:", err);
      setLoading(false);
    });
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-2 bg-white rounded-xl border border-gray-200">
        <Loader2 size={28} className="animate-spin text-[#2B55A3]" />
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
      entityType: "individual" as const, // 🚀 CORREGIDO: Define explícitamente que es persona natural
    },
  };

  const customization = {
    visual: {
      style: {
        theme: "default" as const,
      },
    },
    // 🚀 CORREGIDO: Dejamos únicamente los métodos aprobados y autorizados para tu cuenta de pruebas
    paymentMethods: {
      creditCard: "all" as const,  // Tarjeta de Crédito (con opción a simular cuotas)
      debitCard: "all" as const,   // Tarjeta de Débito
      mercadoPago: "all" as const,  // Mercado Pago Wallet (Dinero en cuenta)
      maxInstallments: 1, 
    },
  };

  const onSubmit = async (param: any) => {
    try {
      const { formData } = param;
      
      // 🚀 CORREGIDO: Quitamos el "/api" inicial para evitar la duplicación en Axios
      const { data } = await api.post("/payments/mercadopago/brick", {
        orderId,
        ...formData,
      });

      if (data.success) {
        toast.success("¡Matrícula procesada y aprobada con éxito!");
        router.push("/checkout/success");
      } else {
        toast.error("La transacción no pudo ser validada.");
      }
    } catch (error) {
      console.error("Error al capturar el cobro:", error);
      toast.error("Error de comunicación en el servidor transaccional.");
    }
  };

  return (
    <div className="w-full bg-white p-2 rounded-xl border border-gray-200 shadow-sm min-h-[350px]">
      {preferenceId ? (
        <Payment
          initialization={initialization}
          customization={customization}
          onSubmit={onSubmit}
          onError={(err) => console.error("Error en Brick Completo:", err)}
        />
      ) : (
        <div className="text-center py-10 text-xs text-red-500">
          No se pudo inicializar el entorno seguro. Verifica tus credenciales (Access Token).
        </div>
      )}
    </div>
  );
}