import axios from "axios";
import { toast } from "sonner";

function normalizeApiUrl(url: string) {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

export const api = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// El backend responde 429 con X-RateLimit-Reset (segundos hasta que se libera el
// límite) y, como respaldo, algunos proxies mandan Retry-After. Si ninguno viene,
// usamos un valor conservador para no sugerir un reintento inmediato.
function getRateLimitWaitSeconds(headers: Record<string, unknown> | undefined): number {
  const raw = headers?.["x-ratelimit-reset"] ?? headers?.["retry-after"];
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds > 0) {
    // Por si en algún momento se manda un timestamp Unix en vez de segundos restantes.
    return seconds > 1e6 ? Math.max(1, Math.ceil(seconds - Date.now() / 1000)) : Math.ceil(seconds);
  }
  return 30;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = (error.config?.url ?? "").includes("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    if (error.response?.status === 429) {
      const waitSeconds = getRateLimitWaitSeconds(error.response.headers);
      const message = `Demasiadas solicitudes. Espera ${waitSeconds} segundo${waitSeconds === 1 ? "" : "s"} e intenta de nuevo.`;
      // No reintentamos automáticamente (evita loops) — solo avisamos. Sobreescribimos
      // el mensaje para que el manejo de errores ya existente en cada página (que lee
      // err.response.data.message) lo muestre tal cual, sin tocar cada llamador.
      error.response.data = { ...(error.response.data ?? {}), message };
      if (typeof window !== "undefined") {
        toast.error(message, { id: "rate-limit" });
      }
    }

    return Promise.reject(error);
  }
);
