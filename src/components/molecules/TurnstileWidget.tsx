"use client";

import { useEffect, useId, useRef } from "react";

interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

interface TurnstileAPI {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
  getResponse: (widgetId?: string) => string | undefined;
}

declare global {
  interface Window {
    turnstile?: TurnstileAPI;
  }
}

const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Sitekey de prueba oficial de Cloudflare: siempre aprueba, sin challenge visual.
// Solo para desarrollo — el sitekey real de producción se crea manualmente en el
// dashboard de Cloudflare (Account → Turnstile → Add site).
const FALLBACK_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || FALLBACK_SITE_KEY;

if (!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
  console.warn(
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY no está configurada — usando el sitekey de prueba de Cloudflare (siempre aprueba, solo para desarrollo)."
  );
}

let turnstileLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (turnstileLoadPromise) return turnstileLoadPromise;

  turnstileLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("No se pudo cargar Cloudflare Turnstile")));
      return;
    }
    const script = document.createElement("script");
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Cloudflare Turnstile"));
    document.head.appendChild(script);
  });

  return turnstileLoadPromise;
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  className?: string;
}

/**
 * Widget de Cloudflare Turnstile. El token que genera es de un solo uso: para
 * pedir uno nuevo tras un intento de submit (éxito o error), remonta este
 * componente cambiando su prop `key` en el padre — eso desmonta el widget
 * anterior (que hace `turnstile.remove()` en el cleanup) y crea uno nuevo.
 */
export function TurnstileWidget({ onVerify, onExpire, onError, className }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const domId = useId().replace(/:/g, "");

  // Guardamos los callbacks en refs para que el efecto de montaje (deps vacías)
  // no tenga que re-renderizar el widget cada vez que el padre pasa una función
  // inline distinta (ej. al cambiar el estado del token). Se actualizan en un
  // effect (no durante el render) para no mutar refs de forma impura.
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          callback: (token) => onVerifyRef.current(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onErrorRef.current?.(),
        });
      })
      .catch((err) => {
        console.error(err);
        onErrorRef.current?.();
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  return <div ref={containerRef} id={`turnstile-${domId}`} className={className} />;
}
