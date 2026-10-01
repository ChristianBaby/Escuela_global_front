"use client";
import { useState } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/templates";
import { RegisterForm } from "@/components/organisms";
import { buttonVariants } from "@/components/atoms";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <AuthLayout title="¡Registro exitoso!" subtitle="Revisa tu correo electrónico">
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Te enviamos un enlace de verificación a tu correo. Activa tu cuenta para comenzar a aprender.
          </p>
          <Link
            href="/auth/login"
            className={cn(
              buttonVariants(),
              "w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 justify-center"
            )}
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Comienza tu camino hacia la especialización">
      <RegisterForm onSuccess={() => setSuccess(true)} />
    </AuthLayout>
  );
}
