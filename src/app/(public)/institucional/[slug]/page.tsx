"use client";

import { useParams } from "next/navigation";
import { NosotrosView } from "./NosotrosView";
import { DevolucionesView } from "./DevolucionesView";
import { TerminosView } from "./TerminosView";
import { PrivacidadView } from "./PrivacidadView";

export default function InstitucionalDynamicPage(props: any) {
  // 🚀 Leemos el slug reactivamente desde la URL
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug).toLowerCase().trim();

  // 🔍 Diagnóstico en consola del navegador para verificar la ruta detectada
  if (typeof window !== "undefined") {
    console.log("📍 [Institucional] Slug detectado:", slug);
  }

  // 🛡️ Detección flexible: Atrapa singular, plural o cualquier variante de nombre
  if (slug.includes("termino") || slug.includes("term") || slug.includes("condicion")) {
    return <TerminosView />;
  }

  if (slug.includes("privaci") || slug.includes("priva") || slug.includes("datos")) {
    return <PrivacidadView />;
  }

  if (slug.includes("devolu") || slug.includes("reembols") || slug.includes("garantia")) {
    return <DevolucionesView />;
  }

  // Por defecto (o si es "nosotros", "about", etc.)
  return <NosotrosView />;
}