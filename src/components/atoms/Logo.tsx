import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
}

// El logo completo (ícono + "Escuela Global") mantiene la proporción real
// del archivo (900x220) para no distorsionar el texto al escalarlo.
const FULL_LOGO_RATIO = 900 / 220;

// Alturas del ícono solo (cuadrado, pequeño está bien).
const ICON_HEIGHTS = { sm: 24, md: 32, lg: 44 };
// Alturas del logo completo (ícono + texto) — tiene que ser más alto para
// que el texto siga siendo legible, no puede compartir la escala del ícono.
const FULL_HEIGHTS = { sm: 40, md: 52, lg: 64 };

// Ambos archivos ya tienen fondo transparente real (el ícono es un PNG con
// canal alfa; el logo completo es un SVG con el ícono embebido —también ya
// transparente— más el texto "Escuela Global" como texto vectorial real).
// No hace falta ningún truco de placa blanca en fondos oscuros.
export function Logo({ className, variant = "full", size = "md" }: LogoProps) {
  const isIcon = variant === "icon";
  const height = isIcon ? ICON_HEIGHTS[size] : FULL_HEIGHTS[size];
  const width = isIcon ? height : Math.round(height * FULL_LOGO_RATIO);

  return (
    <Link href="/" className={cn("inline-flex items-center hover:opacity-90 transition-opacity", className)}>
      <Image
        src={isIcon ? "/Logo_escuela_global.png" : "/logo_full_escuela_global.svg"}
        alt="Escuela Global"
        width={width}
        height={height}
        className="object-contain"
        priority
      />
    </Link>
  );
}
