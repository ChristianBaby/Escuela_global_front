"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/atoms";
import { cn } from "@/lib/utils";
import { getPasswordStrength } from "@/lib/password-strength";

interface PasswordFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showStrength?: boolean;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, error, showStrength, className, required, name, id, value, ...props }, ref) => {
    const [show, setShow] = useState(false);
    const fieldId = id ?? name;
    const strength = showStrength ? getPasswordStrength(String(value ?? "")) : null;

    return (
      <div className="space-y-1.5">
        <Label htmlFor={fieldId} className="text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span className="ml-0.5 text-red-500" aria-hidden>
              *
            </span>
          )}
        </Label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            name={name}
            required={required}
            value={value}
            type={show ? "text" : "password"}
            aria-invalid={!!error}
            className={cn(
              "w-full border rounded-lg px-3 pr-10 h-10 text-sm outline-none transition focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary",
              error ? "border-red-400" : "border-gray-300",
              className
            )}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShow((p) => !p)}
            aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-xs text-red-500">
            {error}
          </p>
        )}
        {strength && String(value ?? "").length > 0 && (
          <div className="mt-2 space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    i <= strength.score ? strength.color : "bg-gray-200"
                  )}
                />
              ))}
            </div>
            <p
              className={cn(
                "text-xs font-medium",
                strength.score <= 1 && "text-red-500",
                strength.score === 2 && "text-orange-500",
                strength.score === 3 && "text-yellow-600",
                strength.score >= 4 && "text-green-600"
              )}
            >
              {strength.label}
            </p>
          </div>
        )}
      </div>
    );
  }
);
PasswordField.displayName = "PasswordField";
