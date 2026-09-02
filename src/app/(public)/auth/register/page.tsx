"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthLayout } from "@/components/templates";
import { FormField, PasswordField, TurnstileWidget } from "@/components/molecules";
import { Button, Checkbox, Label, buttonVariants } from "@/components/atoms";
import { authService } from "@/lib/services/auth";
import { cn } from "@/lib/utils";
import { COUNTRIES, PROFESSIONS } from "@/lib/constants/checkout-options";

const registerSchema = z
  .object({
    nombres:              z.string().min(2, "Ingresa tu(s) nombre(s) (mínimo 2 caracteres)"),
    apellidos:            z.string().min(2, "Ingresa tus apellidos (mínimo 2 caracteres)"),
    email:                z.string().email("Ingresa un correo válido"),
    country:              z.string().min(1, "Selecciona tu país"),
    phone:                z.string().min(6, "Teléfono inválido").max(15, "Teléfono inválido"),
    profession:           z.string().min(1, "Selecciona tu profesión"),
    password:             z.string().min(8, "La contraseña debe tener mínimo 8 caracteres"),
    password_confirmation:z.string(),
    terms:                z.boolean().refine((v) => v, "Debes aceptar los términos para continuar"),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: "Las contraseñas no coinciden",
    path: ["password_confirmation"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Página principal ─────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);
  const [phonePrefix, setPhonePrefix] = useState("+51");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileKey, setTurnstileKey] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false, country: "PE" },
  });

  const terms         = watch("terms");
  const watchCountry  = watch("country");
  const watchPassword = watch("password") ?? "";
  const selectedCountry = COUNTRIES.find((c) => c.code === watchCountry);

  useEffect(() => {
    if (selectedCountry) setPhonePrefix(selectedCountry.dial);
  }, [selectedCountry]);

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const { nombres, apellidos, email, country, phone: rawPhone, profession, password } = data;

      const phone = `${phonePrefix}${rawPhone.replace(/\D/g, "")}`;

	await authService.register({
        first_name: nombres.trim(),
        last_name: apellidos.trim(),
        email,
        phone,
        password,
        country,
        profession,
        turnstileToken: turnstileToken ?? "",
      });

      setSuccess(true);
    } catch (err: unknown) {
      console.error("Register error:", err);
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
      const errors = (err as { response?: { data?: { errors?: Record<string, string[] | string> } } })
        ?.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors)
            .flat()
            .find(Boolean)
        : null;
      setServerError(
        msg ?? firstError ?? "Error al registrarte. Revisa que el backend este activo."
      );
      setTurnstileToken(null);
      setTurnstileKey((k) => k + 1);
    }
  };

  // ── Estado de éxito ────────────────────────────────────────────────────────
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

  // ── Formulario ─────────────────────────────────────────────────────────────
  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Comienza tu camino hacia la especialización">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
          >
            {serverError}
          </div>
        )}

        {/* Nombre(s) */}
        <FormField
          label="Nombre(s)"
          type="text"
          autoComplete="given-name"
          placeholder="Juan Carlos"
          error={errors.nombres?.message}
          required
          {...register("nombres")}
        />

        {/* Apellidos */}
        <FormField
          label="Apellidos"
          type="text"
          autoComplete="family-name"
          placeholder="Pérez García"
          error={errors.apellidos?.message}
          required
          {...register("apellidos")}
        />

        {/* Email */}
        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          error={errors.email?.message}
          required
          {...register("email")}
        />

        {/* País */}
        <div className="space-y-1.5">
          <Label htmlFor="country" className="text-sm font-medium text-gray-700">
            País <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <select
            id="country"
            {...register("country")}
            className={cn(
              "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
              errors.country ? "border-red-400" : "border-gray-300"
            )}
          >
            <option value="">Selecciona tu país</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.flag} {c.name}
              </option>
            ))}
          </select>
          {errors.country && (
            <p role="alert" className="text-xs text-red-500">
              {errors.country.message}
            </p>
          )}
        </div>

        {/* Teléfono con prefijo */}
        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
            Teléfono <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <div className="flex">
            <div className="flex items-center gap-1.5 px-3 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-600 shrink-0 select-none">
              <span className="text-base leading-none">{selectedCountry?.flag ?? "🌍"}</span>
              <span className="font-medium tabular-nums">{phonePrefix}</span>
            </div>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              placeholder="999 999 999"
              aria-invalid={!!errors.phone}
              className={cn(
                "flex-1 border rounded-r-lg px-3 h-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
                errors.phone ? "border-red-400" : "border-gray-300"
              )}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p role="alert" className="text-xs text-red-500">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Profesión */}
        <div className="space-y-1.5">
          <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
            Profesión <span className="text-red-500" aria-hidden>*</span>
          </Label>
          <select
            id="profession"
            {...register("profession")}
            className={cn(
              "w-full border rounded-lg px-3 h-10 text-sm bg-white text-gray-900 outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
              errors.profession ? "border-red-400" : "border-gray-300"
            )}
          >
            <option value="">Selecciona tu profesión</option>
            {PROFESSIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          {errors.profession && (
            <p role="alert" className="text-xs text-red-500">
              {errors.profession.message}
            </p>
          )}
        </div>

        {/* Contraseña */}
        <PasswordField
          label="Contraseña"
          id="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          error={errors.password?.message}
          required
          showStrength
          value={watchPassword}
          {...register("password")}
        />

        {/* Confirmar contraseña */}
        <PasswordField
          label="Confirmar contraseña"
          id="password_confirmation"
          autoComplete="new-password"
          placeholder="Repite tu contraseña"
          error={errors.password_confirmation?.message}
          required
          {...register("password_confirmation")}
        />

        {/* Términos */}
        <div className="space-y-1 pt-1">
          <div className="flex items-start gap-2">
            <Checkbox
              id="terms"
              className="mt-0.5 shrink-0"
              checked={terms}
              onCheckedChange={(val) => setValue("terms", !!val)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600 leading-snug cursor-pointer">
              Acepto los{" "}
              <Link href="/terminos" className="text-brand-primary hover:underline">
                términos de uso
              </Link>{" "}
              y la{" "}
              <Link href="/privacidad" className="text-brand-primary hover:underline">
                política de privacidad
              </Link>
            </Label>
          </div>
          {errors.terms && (
            <p role="alert" className="text-xs text-red-500 pl-6">
              {errors.terms.message}
            </p>
          )}
        </div>

        <TurnstileWidget
          key={turnstileKey}
          onVerify={setTurnstileToken}
          onExpire={() => setTurnstileToken(null)}
          className="flex justify-center"
        />

        {/* Botón submit */}
        <Button
          type="submit"
          disabled={isSubmitting || !turnstileToken}
          className="w-full bg-brand-primary hover:bg-brand-primary/90 text-white h-11 font-semibold mt-2"
        >
          {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
        </Button>

        <p className="text-center text-sm text-gray-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
