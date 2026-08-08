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

export function Logo({ className, variant = "full", size = "md", theme = "light" }: LogoProps) {
  const isIcon = variant === "icon";
  const height = isIcon ? ICON_HEIGHTS[size] : FULL_HEIGHTS[size];
  const width = isIcon ? height : Math.round(height * FULL_LOGO_RATIO);

  // El PNG del isotipo trae fondo blanco sólido (no transparente), así que en
  // fondos oscuros se envuelve en una placa blanca en vez de invertir colores.
  // Eso solo aplica al ícono cuadrado: envolver el logo completo (rectangular)
  // en un círculo lo recortaría, así que ahí se muestra tal cual.
  const image = (
    <Image
      src={isIcon ? "/Logo_escuela_global.png" : "/logo_full_escuela_global.svg"}
      alt="Escuela Global"
      width={width}
      height={height}
      className="object-contain"
      priority
    />
  );

  return (
    <Link href="/" className={cn("inline-flex items-center hover:opacity-90 transition-opacity", className)}>
      {theme === "dark" && isIcon ? (
        <span className="inline-flex items-center justify-center rounded-full bg-white p-1.5 shadow-sm">
          {image}
        </span>
      ) : (
        image
      )}
    </Link>
  );
}
