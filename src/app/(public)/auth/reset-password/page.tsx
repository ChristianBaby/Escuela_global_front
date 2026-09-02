"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Eye, EyeOff, KeyRound } from "lucide-react";
import { Suspense, useState, type InputHTMLAttributes } from "react";
import { AuthLayout } from "@/components/templates";
import { TurnstileWidget } from "@/components/molecules";
import { Button } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/services/auth";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
    password_confirmation: z.string().min(8, "Confirma tu contraseña"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("root", { message: "El enlace de recuperación no tiene token." });
      return;
    }

    try {
      await authService.resetPassword({ token, password: data.password, turnstileToken: turnstileToken ?? "" });
      router.push("/auth/login");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "No pudimos actualizar tu contraseña.";

      setError("root", { message });
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  };

  return (
    <AuthLayout title="Nueva contraseña" subtitle="Crea una contraseña segura para tu cuenta">
      {!token && (
        <div className="mb-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>El enlace no es válido o está incompleto.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {errors.root?.message && (
          <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{errors.root.message}</p>
          </div>
        )}

        <PasswordField
          label="Contraseña"
          autoComplete="new-password"
          show={showPassword}
          onToggle={() => setShowPassword((value) => !value)}
          error={errors.password?.message}
          {...register("password")}
        />

        <PasswordField
          label="Confirmar contraseña"
          autoComplete="new-password"
          show={showConfirmation}
          onToggle={() => setShowConfirmation((value) => !value)}
          error={errors.password_confirmation?.message}
          {...register("password_confirmation")}
        />

        <TurnstileWidget
          key={turnstileKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          className="flex justify-center"
        />

        <Button
          type="submit"
          disabled={isSubmitting || !token || !turnstileToken}
          className="w-full bg-brand-primary text-white hover:bg-brand-primary/90"
        >
          <KeyRound className="size-4" />
          {isSubmitting ? "Actualizando..." : "Cambiar contraseña"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          <Link href="/auth/login" className="font-semibold text-brand-primary hover:text-brand-secondary">
            Volver a iniciar sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  );
}

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  show: boolean;
  onToggle: () => void;
  error?: string;
}

const PasswordField = ({
  label,
  show,
  onToggle,
  error,
  name,
  ...props
}: PasswordFieldProps) => (
  <div className="space-y-1.5">
    <label htmlFor={name} className="text-sm font-medium text-gray-700">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        id={name}
        name={name}
        type={show ? "text" : "password"}
        aria-invalid={!!error}
        className={cn(
          "h-10 w-full rounded-lg border border-gray-300 px-3 pr-10 text-sm outline-none transition",
          "focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30",
          error && "border-red-400 focus:border-red-400 focus:ring-red-300"
        )}
        {...props}
      />
      <button
        type="button"
        onClick={onToggle}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
    {error && (
      <p role="alert" className="text-xs text-red-500">
        {error}
      </p>
    )}
  </div>
);
