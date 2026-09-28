"use client";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/templates";
import { LoginForm } from "@/components/organisms";
import type { User } from "@/types";

const ROLE_REDIRECTS: Record<string, string> = {
  estudiante:   "/dashboard",
  soporte:      "/panel/soporte/cursos",
  marketing:    "/panel/marketing/publicaciones",
  admin:        "/panel",
  coordinador:  "/panel/estudiantes",
};

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(user: User) {
    router.push(ROLE_REDIRECTS[user.role] ?? "/dashboard");
  }

  return (
    <AuthLayout title="Bienvenido de vuelta" subtitle="Ingresa tus datos para continuar">
      <LoginForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
}
