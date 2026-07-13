import type { ReactNode } from "react";
import { Logo } from "@/components/atoms";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 py-4 px-6">
        <div className="max-w-7xl mx-auto">
          <Logo variant="full" size="md" />
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Logo variant="icon" size="lg" />
              </div>
              <h1 className="text-2xl font-bold text-brand-primary">{title}</h1>
              {subtitle && <p className="text-sm text-gray-500 mt-1.5">{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Escuela Global
      </footer>
    </div>
  );
}
