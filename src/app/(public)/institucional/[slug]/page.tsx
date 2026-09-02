"use client";

import { useParams } from "next/navigation";
import { NosotrosView } from "./NosotrosView";
import { DevolucionesView } from "./DevolucionesView";
import { TerminosView } from "./TerminosView";
import { PrivacidadView } from "./PrivacidadView";
import { ContactoView } from "./ContactoView"; // 🚀 Importar nueva vista

export default function InstitucionalDynamicPage() {
  const params = useParams();
  const rawSlug = (params?.slug as string) || "";
  const slug = (Array.isArray(rawSlug) ? rawSlug[0] : rawSlug).toLowerCase().trim();

  // Detección de Contáctanos
  if (slug.includes("contact")) {
    return <ContactoView />;
  }

  if (slug.includes("termino") || slug.includes("term") || slug.includes("condicion")) {
    return <TerminosView />;
  }

  if (slug.includes("privaci") || slug.includes("priva") || slug.includes("datos")) {
    return <PrivacidadView />;
  }

  if (slug.includes("devolu") || slug.includes("reembols") || slug.includes("garantia")) {
    return <DevolucionesView />;
  }

  return <NosotrosView />;
}