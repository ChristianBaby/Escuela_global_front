import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "full" | "icon";
  size?: "sm" | "md" | "lg";
  theme?: "light" | "dark";
}

export function Logo({ className, variant = "full", size = "md", theme = "light" }: LogoProps) {
  const heights = { sm: 32, md: 40, lg: 52 };
  const widths = { sm: 120, md: 150, lg: 195 };

  const height = heights[size];
  const width = variant === "icon" ? height : widths[size];

  return (
    <Link href="/" className={cn("inline-flex items-center hover:opacity-90 transition-opacity", className)}>
      <Image
        src="/Logo_escuela_global.png"
        alt="Escuela Global"
        width={width}
        height={height}
        className={cn("object-contain", theme === "dark" && "brightness-0 invert")}
        priority
      />
    </Link>
  );
}
