"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { AuthLayout } from "@/components/templates";
import { FormField, TurnstileWidget } from "@/components/molecules";
import { Button, buttonVariants } from "@/components/atoms";
import { authService } from "@/lib/services/auth";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().email("Ingresa un correo válido"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitSuccessful, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await authService.forgotPassword({ email: data.email, turnstileToken: turnstileToken ?? "" });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No pudimos enviar el correo de recuperación.";

      setError("root", { message });
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  };

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva contraseña"
    >
      {isSubmitSuccessful ? (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-7" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">Revisa tu correo</p>
            <p className="text-sm leading-relaxed text-gray-500">
              Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.
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
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          {errors.root?.message && (
            <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <p>{errors.root.message}</p>
            </div>
          )}

          <FormField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            placeholder="tu@correo.com"
            error={errors.email?.message}
            required
            {...register("email")}
          />

          <TurnstileWidget
            key={turnstileKey}
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
            className="flex justify-center"
          />

          <Button
            type="submit"
            disabled={isSubmitting || !turnstileToken}
            className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
          >
            <Mail className="size-4" />
            {isSubmitting ? "Enviando..." : "Enviar enlace"}
          </Button>

          <p className="text-center text-sm text-gray-500">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-primary hover:text-brand-secondary">
              Inicia sesión
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
