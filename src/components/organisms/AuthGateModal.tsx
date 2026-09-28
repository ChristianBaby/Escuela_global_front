"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import type { User } from "@/types";

export type AuthGateMode = "login" | "register";

interface AuthGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: AuthGateMode;
  onModeChange: (mode: AuthGateMode) => void;
  onAuthenticated: (user: User) => void;
}

// Overlay reutilizado en el checkout: mismo login/registro que ya existe en
// /auth/login y /auth/register (LoginForm / RegisterForm), pero como modal
// sobre la página en vez de navegar a otra pantalla, para no perder el
// contexto del carrito/checkout mientras el usuario inicia sesión o se crea
// una cuenta.
export function AuthGateModal({ open, onOpenChange, mode, onModeChange, onAuthenticated }: AuthGateModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta para continuar"}
          </DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "Ingresa a tu cuenta para finalizar la compra de tu curso."
              : "Regístrate gratis para finalizar la compra de tu curso."}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <LoginForm
            onSuccess={onAuthenticated}
            onRegisterClick={() => onModeChange("register")}
            syncCartOnSuccess={false}
          />
        ) : (
          <RegisterForm
            onSuccess={onAuthenticated}
            onLoginClick={() => onModeChange("login")}
            syncCartOnSuccess={false}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
