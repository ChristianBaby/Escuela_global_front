"use client";

import { useState, type ReactNode } from "react";

interface ImageHoverBubbleProps {
  src?: string | null;
  /** La miniatura sobre la que se pasa el cursor */
  children: ReactNode;
}

const BUBBLE_MAX = 320; // px — ancho/alto máximo de la burbuja
const GAP = 12;

// Al pasar el cursor por una miniatura muestra la imagen ampliada en una burbuja
// flotante al costado, tal cual (sin estirarla más de su tamaño real).
// Va con position: fixed para que no la recorte el overflow de las tablas.
export function ImageHoverBubble({ src, children }: ImageHoverBubbleProps) {
  const [pos, setPos] = useState<{ left: number; top: number; side: "right" | "left" } | null>(null);

  if (!src) return <>{children}</>;

  const show = (e: React.MouseEvent<HTMLSpanElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // A la derecha de la miniatura; si no entra en la pantalla, a la izquierda
    const fitsRight = rect.right + GAP + BUBBLE_MAX <= window.innerWidth;
    const top = Math.min(
      Math.max(rect.top + rect.height / 2, BUBBLE_MAX / 2 + GAP),
      window.innerHeight - BUBBLE_MAX / 2 - GAP,
    );
    setPos(
      fitsRight
        ? { left: rect.right + GAP, top, side: "right" }
        : { left: rect.left - GAP, top, side: "left" },
    );
  };

  return (
    // inline-flex + shrink-0: el envoltorio no debe deformar la miniatura (en filas
    // flex con títulos largos se encogía y la imagen quedaba como rectángulo angosto)
    <span className="inline-flex shrink-0" onMouseEnter={show} onMouseLeave={() => setPos(null)}>
      {children}
      {pos && (
        <span
          className="fixed z-50 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: pos.left,
            top: pos.top,
            transform: pos.side === "right" ? "translateY(-50%)" : "translate(-100%, -50%)",
          }}
        >
          <span className="block p-1.5 bg-white rounded-2xl shadow-2xl ring-2 ring-brand-secondary/40">
            <img
              src={src}
              alt=""
              className="block rounded-xl"
              style={{ maxWidth: BUBBLE_MAX, maxHeight: BUBBLE_MAX }}
            />
          </span>
        </span>
      )}
    </span>
  );
}
