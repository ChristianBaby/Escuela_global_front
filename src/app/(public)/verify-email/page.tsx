"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<
    "loading" | "success" | "error"
  >("loading");

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
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
      	credentials: "include"
        });

        if (!res.ok) throw new Error();

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
