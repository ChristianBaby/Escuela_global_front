"use client";
import { useRouter } from "next/navigation";
import { AuthLayout } from "@/components/templates";
import { LoginForm } from "@/components/organisms";
import { resolvePostLoginPath } from "@/lib/auth/roleRoutes";
import type { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();

  function handleSuccess(user: User) {
    const redirect = new URLSearchParams(window.location.search).get("redirect");
    router.push(resolvePostLoginPath(redirect, user.role));
  }

  return (
    <AuthLayout title="Bienvenido de vuelta" subtitle="Ingresa tus datos para continuar">
      <LoginForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
}
