"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/lib/services/auth";

function VerifyEmailContent() {
  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail({ token });

        setStatus("success");

        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch {
        setStatus("error");
      }
    };

    verify();
  }, [token, router]);

  if (!token) return <p>Error al verificar el email ❌</p>;

  if (status === "loading") return <p>Verificando email...</p>;

  if (status === "success") {
    return (
      <div>
        <p>Email verificado correctamente 🎉</p>
        <p>Redirigiendo a login...</p>
      </div>
    );
  }

  return <p>Error al verificar el email ❌</p>;
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p>Verificando email...</p>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
