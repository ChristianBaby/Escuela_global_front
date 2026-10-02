import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { SessionGate } from "./SessionGate";
import { loginDestination, registerSessionQueryClient, clearLocalSession } from "./sessionClient";
import { useLogout } from "./useLogout";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";

const mocks = vi.hoisted(() => ({
  pathname: "/panel/soporte/cursos",
  me: vi.fn(),
  logout: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: mocks.replace }),
}));
vi.mock("@/lib/services/auth", () => ({
  authService: { me: mocks.me, logout: mocks.logout },
}));
vi.mock("./sessionClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./sessionClient")>()),
  replaceLocation: mocks.replace,
}));

const user = {
  id: "user-1",
  first_name: "Ana",
  last_name: "García",
  email: "ana@example.com",
  phone: "999999999",
  role: "soporte" as const,
  email_verified: true,
  status: "active" as const,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
}

beforeEach(() => {
  mocks.pathname = "/panel/soporte/cursos";
  mocks.me.mockReset();
  mocks.logout.mockReset();
  mocks.replace.mockReset();
  useAuthStore.getState().clearUser();
  useCartStore.getState().clearCart();
  localStorage.clear();
});

afterEach(() => cleanup());

describe("proxy", () => {
  it("admits an expired access token when the refresh cookie exists", () => {
    const request = new NextRequest("http://localhost/panel/soporte/cursos");
    request.cookies.set("refresh_token", "refresh-without-role");
    expect(proxy(request).status).toBe(200);
  });

  it("preserves the original route when no session cookie exists", () => {
    const request = new NextRequest("http://localhost/panel/soporte/cursos?page=2");
    const response = proxy(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/auth/login?redirect=%2Fpanel%2Fsoporte%2Fcursos%3Fpage%3D2",
    );
  });

  it("protects the new student teachers route", () => {
    const request = new NextRequest("http://localhost/docentes");
    expect(proxy(request).status).toBe(307);
  });
});

describe("protected layout session", () => {
  it("validates before mounting a page that only calls public APIs", async () => {
    let finish!: (value: typeof user) => void;
    mocks.me.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const queryClient = client();
    const page = vi.fn(() => <div>Cursos públicos</div>);
    const Page = page;
    render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><Page /></SessionGate>
      </QueryClientProvider>,
    );
    expect(screen.getByRole("status").textContent).toContain("Validando sesión");
    expect(page).not.toHaveBeenCalled();
    await act(async () => finish(user));
    await waitFor(() => expect(screen.getByText("Cursos públicos")).toBeTruthy());
    expect(mocks.me).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toEqual(user);
  });

  it("revalidates after navigation and restores an empty store from valid cookies", async () => {
    mocks.me.mockResolvedValue(user);
    const queryClient = client();
    const view = render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Contenido</div></SessionGate>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(screen.getByText("Contenido")).toBeTruthy());
    expect(useAuthStore.getState().user).toEqual(user);
    mocks.pathname = "/panel/soporte/categorias";
    view.rerender(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Contenido</div></SessionGate>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mocks.me).toHaveBeenCalledTimes(2));
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it("keeps a revoked session behind the gate", async () => {
    mocks.me.mockRejectedValue({ response: { status: 401 } });
    const queryClient = client();
    render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Datos privados</div></SessionGate>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mocks.me).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Datos privados")).toBeNull();
  });

  it("shares one pending validation between protected gates", async () => {
    let finish!: (value: typeof user) => void;
    mocks.me.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const queryClient = client();
    render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Panel A</div></SessionGate>
        <SessionGate><div>Panel B</div></SessionGate>
      </QueryClientProvider>,
    );
    expect(mocks.me).toHaveBeenCalledTimes(1);
    await act(async () => finish(user));
    await waitFor(() => expect(screen.getByText("Panel B")).toBeTruthy());
    expect(mocks.me).toHaveBeenCalledTimes(1);
  });

  it("offers retry on a network error without clearing the session", async () => {
    mocks.me.mockRejectedValueOnce(new Error("offline")).mockResolvedValue(user);
    useAuthStore.getState().setUser(user);
    const queryClient = client();
    render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Panel</div></SessionGate>
      </QueryClientProvider>,
    );
    const retry = await screen.findByText("Reintentar");
    expect(useAuthStore.getState().user).toEqual(user);
    await act(async () => retry.click());
    await waitFor(() => expect(screen.getByText("Panel")).toBeTruthy());
    expect(mocks.me).toHaveBeenCalledTimes(2);
  });

  it("uses the validated role when denying a protected page", async () => {
    mocks.me.mockResolvedValue({ ...user, role: "estudiante" });
    const queryClient = client();
    render(
      <QueryClientProvider client={queryClient}>
        <SessionGate><div>Panel de soporte</div></SessionGate>
      </QueryClientProvider>,
    );
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/sin-acceso"));
    expect(screen.queryByText("Panel de soporte")).toBeNull();
    expect(useAuthStore.getState().user?.role).toBe("estudiante");
  });
});

describe("session cleanup", () => {
  it("clears persisted user and cached queries, and preserves the login destination", () => {
    const queryClient = client();
    registerSessionQueryClient(queryClient);
    queryClient.setQueryData(["private"], "secret");
    useAuthStore.getState().setUser(user);
    clearLocalSession();
    expect(useAuthStore.getState().user).toBeNull();
    expect(queryClient.getQueryData(["private"])).toBeUndefined();
    expect(loginDestination("/panel/soporte/cursos", "?page=2")).toBe(
      "/auth/login?redirect=%2Fpanel%2Fsoporte%2Fcursos%3Fpage%3D2",
    );
  });

  it("calls backend logout before clearing the local session", async () => {
    const queryClient = client();
    registerSessionQueryClient(queryClient);
    useAuthStore.getState().setUser(user);
    mocks.logout.mockResolvedValue({});
    const { result } = renderHook(() => useLogout());
    await act(async () => { await result.current.logout(); });
    expect(mocks.logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().user).toBeNull();
    expect(mocks.replace).toHaveBeenCalledWith("/auth/login");
  });
});
