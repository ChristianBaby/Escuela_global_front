"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { scrollPopupsService } from "@/lib/services/marketing";

const SCROLL_THRESHOLD = 300;

export function ScrollPopupModal() {
  const { data: popups = [] } = useQuery({
    queryKey: ["scroll-popups", "vigentes"],
    queryFn: () => scrollPopupsService.list(true),
  });

  const popup = [...popups].sort((a, b) => a.display_order - b.display_order)[0];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!popup) return;

    const storageKey = `scroll_popup_shown_${popup.id}`;
    if (sessionStorage.getItem(storageKey)) return;

    const handleScroll = () => {
      if (window.scrollY > SCROLL_THRESHOLD) {
        sessionStorage.setItem(storageKey, "1");
        setVisible(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [popup]);

  if (!popup || !visible) return null;

  const image = (
    <img
      src={popup.image_url}
      alt="Publicidad"
      className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
    />
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={() => setVisible(false)}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setVisible(false)}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg hover:bg-gray-100 transition-colors"
        >
          <X size={18} />
        </button>

        {popup.destination_url ? (
          <a href={popup.destination_url} target="_blank" rel="noopener noreferrer">
            {image}
          </a>
        ) : (
          image
        )}
      </div>
    </div>
  );
}
