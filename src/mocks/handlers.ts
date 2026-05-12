import { http, HttpResponse } from "msw";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function mockJwt(payload: object): string {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const header  = encode({ alg: "HS256", typ: "JWT" });
  const body    = encode(payload);
  return `${header}.${body}.mock_signature`;
}

// ── Usuarios mock ─────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "u1", first_name: "María", last_name: "García", email: "maria@example.com", role: "estudiante", status: "active", created_at: "2024-01-15", phone: "+51999111222", country: "PE" },
  { id: "u2", first_name: "Carlos", last_name: "López", email: "carlos@example.com", role: "estudiante", status: "active", created_at: "2024-02-20", phone: "+51999333444", country: "PE" },
  { id: "u3", first_name: "Ana", last_name: "Torres", email: "ana@example.com", role: "soporte", status: "active", created_at: "2024-01-05", phone: "+51999555666", country: "PE" },
  { id: "u4", first_name: "Luis", last_name: "Mendoza", email: "luis@example.com", role: "marketing", status: "suspended", created_at: "2024-03-10", phone: "+51999777888", country: "PE" },
  { id: "u5", first_name: "Admin", last_name: "Global", email: "admin@escuelaglobal.com", role: "admin", status: "active", created_at: "2023-12-01", phone: "+51999000111", country: "PE" },
];

// ── Cursos mock ───────────────────────────────────────────────────────────────
const MOCK_CURSOS = [
  { id: "c1", title: "Derecho Laboral Avanzado", slug: "derecho-laboral-avanzado", category: { id: "cat1", name: "Derecho" }, price: 299, currency: "USD", status: "published", enrolled_count: 42, thumbnail_url: "", created_at: "2024-01-10" },
  { id: "c2", title: "Finanzas Corporativas", slug: "finanzas-corporativas", category: { id: "cat2", name: "Finanzas" }, price: 249, currency: "USD", status: "published", enrolled_count: 28, thumbnail_url: "", created_at: "2024-02-05" },
  { id: "c3", title: "Python para Análisis de Datos", slug: "python-analisis-datos", category: { id: "cat3", name: "Tecnología" }, price: 199, currency: "USD", status: "draft", enrolled_count: 0, thumbnail_url: "", created_at: "2024-03-01" },
];

// ── Categorías mock ───────────────────────────────────────────────────────────
const MOCK_CATEGORIAS = [
  { id: "cat1", name: "Derecho", slug: "derecho", icon: "⚖️", color: "#2B55A3", description: "Cursos de ciencias jurídicas", courses_count: 5 },
  { id: "cat2", name: "Finanzas", slug: "finanzas", icon: "💰", color: "#3FB1E5", description: "Finanzas y contabilidad", courses_count: 3 },
  { id: "cat3", name: "Tecnología", slug: "tecnologia", icon: "💻", color: "#10B981", description: "Programación y datos", courses_count: 2 },
];

export const handlers = [
  // ── AUTH ────────────────────────────────────────────────────────────────────

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    console.log("[MSW] POST /auth/login →", body);

    // Simula credenciales incorrectas
    if (body.password === "wrong") {
      return HttpResponse.json({ message: "Credenciales incorrectas" }, { status: 401 });
    }

    // Determina el usuario según el email
    const userMap: Record<string, typeof MOCK_USERS[0]> = {
      "admin@escuelaglobal.com": MOCK_USERS[4],
      "ana@example.com":         MOCK_USERS[2],
      "luis@example.com":        MOCK_USERS[3],
    };
    const user = userMap[body.email] ?? MOCK_USERS[0];

    // JWT con el rol correcto del usuario (importante para que el proxy lo deje pasar)
    const access_token = mockJwt({ sub: user.id, role: user.role, email: user.email });

    return HttpResponse.json({ access_token, user });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    console.log("[MSW] POST /auth/register →", body);

    // Simula email duplicado
    if (body.email === "duplicado@example.com") {
      return HttpResponse.json({ message: "El correo ya está registrado" }, { status: 409 });
    }

    return HttpResponse.json({ message: "Usuario creado. Revisa tu correo." }, { status: 201 });
  }),

  // ── CURSOS ──────────────────────────────────────────────────────────────────

  http.get(`${BASE}/cursos`, ({ request }) => {
    const url = new URL(request.url);
    console.log("[MSW] GET /cursos →", Object.fromEntries(url.searchParams));
    return HttpResponse.json({ data: MOCK_CURSOS, total: MOCK_CURSOS.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.get(`${BASE}/cursos/:id`, ({ params }) => {
    console.log("[MSW] GET /cursos/:id →", params.id);
    const curso = MOCK_CURSOS.find((c) => c.id === params.id) ?? MOCK_CURSOS[0];
    return HttpResponse.json(curso);
  }),

  http.post(`${BASE}/cursos`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /cursos →", body);
    return HttpResponse.json({ id: "c_new_" + Date.now(), ...body as object }, { status: 201 });
  }),

  http.patch(`${BASE}/cursos/:id`, async ({ params, request }) => {
    const body = await request.json();
    console.log("[MSW] PATCH /cursos/:id →", params.id, body);
    return HttpResponse.json({ id: params.id, ...body as object });
  }),

  http.delete(`${BASE}/cursos/:id`, ({ params }) => {
    console.log("[MSW] DELETE /cursos/:id →", params.id);
    return HttpResponse.json({ message: "Curso eliminado" });
  }),

  http.get(`${BASE}/cursos/:id/matriculados`, ({ params, request }) => {
    const url = new URL(request.url);
    console.log("[MSW] GET /cursos/:id/matriculados →", params.id, Object.fromEntries(url.searchParams));
    return HttpResponse.json({ data: MOCK_USERS.slice(0, 2), total: 2, page: 1, limit: 10, totalPages: 1 });
  }),

  // ── CATEGORÍAS ──────────────────────────────────────────────────────────────

  http.get(`${BASE}/categorias`, () => {
    console.log("[MSW] GET /categorias");
    return HttpResponse.json(MOCK_CATEGORIAS);
  }),

  http.post(`${BASE}/categorias`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /categorias →", body);
    return HttpResponse.json({ id: "cat_new_" + Date.now(), ...body as object }, { status: 201 });
  }),

  http.patch(`${BASE}/categorias/:id`, async ({ params, request }) => {
    const body = await request.json();
    console.log("[MSW] PATCH /categorias/:id →", params.id, body);
    return HttpResponse.json({ id: params.id, ...body as object });
  }),

  http.delete(`${BASE}/categorias/:id`, ({ params }) => {
    console.log("[MSW] DELETE /categorias/:id →", params.id);
    return HttpResponse.json({ message: "Categoría eliminada" });
  }),

  // ── USUARIOS ─────────────────────────────────────────────────────────────────

  http.get(`${BASE}/usuarios`, ({ request }) => {
    const url = new URL(request.url);
    console.log("[MSW] GET /usuarios →", Object.fromEntries(url.searchParams));
    return HttpResponse.json({ data: MOCK_USERS, total: MOCK_USERS.length, page: 1, limit: 10, totalPages: 1 });
  }),

  http.get(`${BASE}/usuarios/buscar`, ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get("q") ?? "";
    console.log("[MSW] GET /usuarios/buscar →", q);
    const results = MOCK_USERS.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q.toLowerCase()) ||
      u.email.toLowerCase().includes(q.toLowerCase())
    );
    return HttpResponse.json(results);
  }),

  http.post(`${BASE}/usuarios`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /usuarios →", body);
    return HttpResponse.json({ id: "u_new_" + Date.now(), ...body as object, status: "active", created_at: new Date().toISOString().slice(0, 10) }, { status: 201 });
  }),

  http.patch(`${BASE}/usuarios/:id/suspender`, ({ params }) => {
    console.log("[MSW] PATCH /usuarios/:id/suspender →", params.id);
    return HttpResponse.json({ message: "Usuario suspendido" });
  }),

  http.patch(`${BASE}/usuarios/:id/activar`, ({ params }) => {
    console.log("[MSW] PATCH /usuarios/:id/activar →", params.id);
    return HttpResponse.json({ message: "Usuario activado" });
  }),

  // ── ESTUDIANTE (mis inscripciones) ───────────────────────────────────────────

  http.get(`${BASE}/estudiantes/mis-inscripciones`, () => {
    console.log("[MSW] GET /estudiantes/mis-inscripciones");
    return HttpResponse.json([
      {
        id: "enr1",
        user_id: "u1",
        course_id: "c1",
        enrollment_type: "online",
        progress_percent: 65,
        completed_at: null,
        last_accessed_at: "2024-03-14T10:00:00Z",
        enrolled_at: "2024-01-10T08:00:00Z",
        course: {
          id: "c1", title: "Derecho Laboral Avanzado", slug: "derecho-laboral-avanzado",
          thumbnail_url: "", level: "avanzado", total_duration_minutes: 480,
        },
      },
      {
        id: "enr2",
        user_id: "u1",
        course_id: "c2",
        enrollment_type: "online",
        progress_percent: 30,
        completed_at: null,
        last_accessed_at: "2024-03-10T15:00:00Z",
        enrolled_at: "2024-02-01T08:00:00Z",
        course: {
          id: "c2", title: "Finanzas Corporativas", slug: "finanzas-corporativas",
          thumbnail_url: "", level: "intermedio", total_duration_minutes: 360,
        },
      },
      {
        id: "enr3",
        user_id: "u1",
        course_id: "c3",
        enrollment_type: "manual",
        progress_percent: 100,
        completed_at: "2024-02-28T12:00:00Z",
        last_accessed_at: "2024-02-28T12:00:00Z",
        enrolled_at: "2023-12-01T08:00:00Z",
        course: {
          id: "c3", title: "Python para Análisis de Datos", slug: "python-analisis-datos",
          thumbnail_url: "", level: "principiante", total_duration_minutes: 300,
        },
      },
    ]);
  }),

  // ── MATRICULACIONES ──────────────────────────────────────────────────────────

  http.post(`${BASE}/matriculaciones`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /matriculaciones →", body);
    return HttpResponse.json({ message: "Matriculación creada" }, { status: 201 });
  }),

  // ── MARKETING ───────────────────────────────────────────────────────────────

  http.get(`${BASE}/promociones`, () => {
    console.log("[MSW] GET /promociones");
    return HttpResponse.json({
      data: [
        { id: "p1", title: "Banner Verano 2024", image_url: "", destination_url: "https://example.com", status: "active", starts_at: "2024-01-01", ends_at: "2024-12-31" },
      ],
      total: 1,
    });
  }),

  http.post(`${BASE}/promociones`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /promociones →", body);
    return HttpResponse.json({ id: "p_new_" + Date.now(), ...body as object }, { status: 201 });
  }),

  http.patch(`${BASE}/promociones/:id`, async ({ params, request }) => {
    const body = await request.json();
    console.log("[MSW] PATCH /promociones/:id →", params.id, body);
    return HttpResponse.json({ id: params.id, ...body as object });
  }),

  http.delete(`${BASE}/promociones/:id`, ({ params }) => {
    console.log("[MSW] DELETE /promociones/:id →", params.id);
    return HttpResponse.json({ message: "Promoción eliminada" });
  }),

  http.get(`${BASE}/sliders`, () => {
    console.log("[MSW] GET /sliders");
    return HttpResponse.json({
      data: [
        { id: "s1", title: "Cursos Destacados", type: "courses", position_on_page: "top", status: "active", courses: [] },
      ],
      total: 1,
    });
  }),

  http.post(`${BASE}/sliders`, async ({ request }) => {
    const body = await request.json();
    console.log("[MSW] POST /sliders →", body);
    return HttpResponse.json({ id: "s_new_" + Date.now(), ...body as object }, { status: 201 });
  }),

  http.patch(`${BASE}/sliders/:id`, async ({ params, request }) => {
    const body = await request.json();
    console.log("[MSW] PATCH /sliders/:id →", params.id, body);
    return HttpResponse.json({ id: params.id, ...body as object });
  }),

  http.delete(`${BASE}/sliders/:id`, ({ params }) => {
    console.log("[MSW] DELETE /sliders/:id →", params.id);
    return HttpResponse.json({ message: "Slider eliminado" });
  }),

  // ── ADMIN ────────────────────────────────────────────────────────────────────

  http.get(`${BASE}/admin/stats`, () => {
    console.log("[MSW] GET /admin/stats");
    return HttpResponse.json({
      ingresos: {
        total_mes: 18450,
        online: 14200,
        manual: 4250,
        cambio_porcentual: 12,
      },
      estudiantes: {
        total: 342,
        nuevos_mes: 28,
      },
      cursos: {
        total_activos: 12,
        nuevos_mes: 2,
      },
      tasa_finalizacion: 68,
    });
  }),

  http.get(`${BASE}/admin/auditoria`, ({ request }) => {
    const url = new URL(request.url);
    console.log("[MSW] GET /admin/auditoria →", Object.fromEntries(url.searchParams));
    return HttpResponse.json({
      data: [
        { id: "a1", created_at: "2024-03-15 09:32", user: { first_name: "Ana", last_name: "Torres", email: "ana@example.com" }, action: "update", entity_type: "Course", changes: { title: { before: "Derecho Básico", after: "Derecho Laboral Avanzado" } } },
        { id: "a2", created_at: "2024-03-14 14:15", user: { first_name: "Ana", last_name: "Torres", email: "ana@example.com" }, action: "create", entity_type: "Category", changes: { name: "Tecnología" } },
      ],
      total: 2,
    });
  }),
];
