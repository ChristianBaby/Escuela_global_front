"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { AuthLayout } from "@/components/templates";
import { buttonVariants } from "@/components/atoms";
import { authService } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail({ token });

        setStatus("success");

        setTimeout(() => {
          router.push("/auth/login");
        }, 2000);
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [token, router]);

  if (status === "loading") {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-brand-primary">
          <Loader2 className="size-7 animate-spin" />
        </div>
        <p className="text-sm text-gray-500">Verificando tu correo...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="size-7" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">Correo verificado</p>
          <p className="text-sm leading-relaxed text-gray-500">
            Redirigiendo a iniciar sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="size-7" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-900">No se pudo verificar tu correo</p>
        <p className="text-sm leading-relaxed text-gray-500">
          El enlace es inválido o ya expiró. Puedes iniciar sesión y pedir uno nuevo.
        </p>
      </div>
      <Link
        href="/auth/login"
        className={cn(
          buttonVariants(),
          "w-full bg-brand-primary text-white hover:bg-brand-primary/90"
        )}
      >
        Volver a iniciar sesión
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout title="Verificación de correo">
      <Suspense
        fallback={
          <div className="space-y-5 text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-blue-50 text-brand-primary">
              <Loader2 className="size-7 animate-spin" />
            </div>
            <p className="text-sm text-gray-500">Verificando tu correo...</p>
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </AuthLayout>
  );
}
