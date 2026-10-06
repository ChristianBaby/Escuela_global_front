import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { registerSessionQueryClient } from "@/lib/auth/sessionClient";
import { useAuthStore } from "@/store/authStore";

describe("HTTP 401 session handling", () => {
  it("clears a stale user and redirects only once with the original URL", async () => {
    const replace = vi.fn();
    vi.stubGlobal("window", {
      location: {
        pathname: "/panel/soporte/cursos",
        search: "?page=2",
        replace,
      },
    });
    const queryClient = new QueryClient();
    registerSessionQueryClient(queryClient);
    queryClient.setQueryData(["private"], "secret");
    useAuthStore.getState().setUser({
      id: "user-1",
      first_name: "Ana",
      last_name: "García",
      email: "ana@example.com",
      phone: "999999999",
      role: "soporte",
      email_verified: true,
      status: "active",
      created_at: "2026-01-01",
      updated_at: "2026-01-01",
    });
    const unauthorized = async (config: unknown) => {
      throw { config, response: { status: 401 } };
    };

    await Promise.allSettled([
      api.get("/users/me", { adapter: unauthorized }),
      api.get("/admin/usuarios", { adapter: unauthorized }),
    ]);

    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["private"])).toBeUndefined();
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith(
      "/auth/login?redirect=%2Fpanel%2Fsoporte%2Fcursos%3Fpage%3D2",
    );
    vi.unstubAllGlobals();
  });
});
