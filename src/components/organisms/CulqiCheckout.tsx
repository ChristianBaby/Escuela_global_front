"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { paymentsService } from "@/lib/services/payments";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";

const PUBLIC_KEY = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY || "";
const CULQI_SCRIPT_SRC = "https://js.culqi.com/checkout-js";

// CulqiJS se integra vía script global (no hay wrapper oficial de React) —
// mismo patrón de "callback global" que usan sus SDKs para otros frameworks.
declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (opts: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token?: { id: string };
      order?: unknown;
      error?: { user_message?: string };
    };
    culqi?: () => void;
  }
}

interface CulqiCheckoutProps {
  orderId: string;
  totalAmount: number;
  currency: string;
}

export function CulqiCheckout({ orderId, totalAmount, currency }: CulqiCheckoutProps) {
  const { user } = useAuthStore();
  const router = useRouter();

  const [scriptReady, setScriptReady] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!PUBLIC_KEY) {
      console.warn("NEXT_PUBLIC_CULQI_PUBLIC_KEY no está configurada.");
    }

    const existing = document.querySelector(`script[src="${CULQI_SCRIPT_SRC}"]`);
    if (existing) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src = CULQI_SCRIPT_SRC;
    script.async = true;
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      console.warn("No se pudo cargar el script de Culqi.");
      toast.error("No se pudo cargar la pasarela de Culqi.");
    };
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    // Callback global que CulqiJS invoca luego de Culqi.open() al generar
    // (o fallar) un token de tarjeta/Yape.
    window.culqi = async () => {
      const culqi = window.Culqi;
      if (!culqi) return;

      if (culqi.error) {
        toast.error(culqi.error.user_message || "No se pudo generar el token de pago.");
        return;
      }

      if (!culqi.token) return;

      setProcessing(true);
      try {
        const data = await paymentsService.culqi.createCharge({
          orderId,
          token: culqi.token.id,
          email: user?.email || "estudiante_demo@escuelaglobal.com",
        });

        if (!data.success) {
          throw new Error("La transacción no pudo ser validada.");
        }

        toast.success("¡Matrícula procesada y aprobada con éxito!");
        router.push(`/checkout/success?orderId=${orderId}`);
      } catch (error: any) {
        const backendMessage = error?.response?.data?.message;
        toast.error(backendMessage || "La transacción no pudo ser validada.");
      } finally {
        setProcessing(false);
      }
    };

    return () => {
      window.culqi = undefined;
    };
  }, [orderId, user, router]);

  function handleOpen() {
    if (!window.Culqi) {
      toast.error("La pasarela de Culqi todavía no está lista, intenta de nuevo.");
      return;
    }

    window.Culqi.publicKey = PUBLIC_KEY;
    window.Culqi.settings({
      title: "Escuela Global",
      currency,
      description: `Orden de compra`,
      amount: Math.round(totalAmount * 100),
    });
    window.Culqi.open();
  }

  return (
    <div className="w-full bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-[200px] flex flex-col items-center justify-center gap-4 text-center">
      <Wallet size={28} className="text-[#084D95]" />
      <div>
        <p className="text-sm font-semibold text-gray-800">Paga con tarjeta o Yape</p>
        <p className="text-xs text-gray-400 mt-1">Serás redirigido a la ventana segura de Culqi.</p>
      </div>
      <button
        type="button"
        onClick={handleOpen}
        disabled={!scriptReady || processing}
        className="w-full max-w-xs flex items-center justify-center gap-2 bg-[#084D95] text-white h-11 rounded-lg text-sm font-semibold hover:bg-[#084D95]/90 transition-colors disabled:opacity-50"
      >
        {processing ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Procesando...
          </>
        ) : !scriptReady ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Cargando pasarela...
          </>
        ) : (
          "Pagar con Culqi"
        )}
      </button>
    </div>
  );
}
