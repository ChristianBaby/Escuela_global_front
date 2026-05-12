import { http, HttpResponse } from "msw";

function normalizeApiUrl(url: string) {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

const BASE = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001");

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

// ── Contenido de cursos mock ───────────────────────────────────────────────────
const MOCK_COURSE_CONTENT: Record<string, object> = {
  c1: {
    id: "c1",
    title: "Derecho Laboral Avanzado",
    modules: [
      {
        id: "m1", title: "Módulo 1: Fundamentos del Derecho Laboral", display_order: 1,
        sessions: [
          { id: "s1", module_id: "m1", title: "Introducción al Derecho Laboral", description: "Conceptos base, principios fundamentales y fuentes del derecho del trabajo.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 45, display_order: 1, materials: [{ id: "mat1", session_id: "s1", name: "Presentación Clase 1.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-01-10" }] },
          { id: "s2", module_id: "m1", title: "Contratos de Trabajo", description: "Tipos de contratos laborales según la legislación vigente y sus implicancias.", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 38, display_order: 2, materials: [] },
          { id: "s3", module_id: "m1", title: "Jornada Laboral y Horas Extra", description: "Regulaciones sobre la jornada de trabajo, horas extraordinarias y descanso.", youtube_video_id: "9bZkp7q19f0", duration_minutes: 42, display_order: 3, materials: [{ id: "mat2", session_id: "s3", name: "Tabla Cálculo Horas Extra.xlsx", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "Excel", created_at: "2024-01-10" }] },
        ],
      },
      {
        id: "m2", title: "Módulo 2: Relaciones Laborales", display_order: 2,
        sessions: [
          { id: "s4", module_id: "m2", title: "Derechos Fundamentales del Trabajador", description: "Los derechos laborales reconocidos en la constitución y legislación laboral.", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 1, materials: [{ id: "mat3", session_id: "s4", name: "Manual Derechos Laborales.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-01-10" }] },
          { id: "s5", module_id: "m2", title: "Sindicatos y Negociación Colectiva", description: "Rol de los sindicatos, proceso de negociación colectiva y convenios.", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 48, display_order: 2, materials: [] },
        ],
      },
    ],
  },
  c2: {
    id: "c2",
    title: "Finanzas Corporativas",
    modules: [
      {
        id: "mc2_1", title: "Módulo 1: Fundamentos Financieros", display_order: 1,
        sessions: [
          { id: "sc2_1", module_id: "mc2_1", title: "Introducción a las Finanzas Corporativas", description: "Conceptos esenciales y estructura financiera empresarial.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 40, display_order: 1, materials: [] },
          { id: "sc2_2", module_id: "mc2_1", title: "Estados Financieros", description: "Análisis e interpretación de balance, resultados y flujos.", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 50, display_order: 2, materials: [{ id: "mc2mat1", session_id: "sc2_2", name: "Plantilla Excel Financiera.xlsx", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "Excel", created_at: "2024-02-05" }] },
        ],
      },
    ],
  },
  c3: {
    id: "c3",
    title: "Python para Análisis de Datos",
    modules: [
      {
        id: "mc3_1", title: "Módulo 1: Python Básico", display_order: 1,
        sessions: [
          { id: "sc3_1", module_id: "mc3_1", title: "Instalación y Entorno", description: "Configuración de Python, Anaconda y Jupyter Notebook.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 30, display_order: 1, materials: [] },
          { id: "sc3_2", module_id: "mc3_1", title: "Variables y Tipos de Datos", description: "Tipos primitivos, colecciones y operaciones básicas en Python.", youtube_video_id: "9bZkp7q19f0", duration_minutes: 45, display_order: 2, materials: [{ id: "mc3mat1", session_id: "sc3_2", name: "Ejercicios Python.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-03-01" }] },
        ],
      },
      {
        id: "mc3_2", title: "Módulo 2: Análisis con Pandas", display_order: 2,
        sessions: [
          { id: "sc3_3", module_id: "mc3_2", title: "Introducción a Pandas", description: "DataFrames, Series y operaciones de análisis de datos.", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 60, display_order: 1, materials: [] },
          { id: "sc3_4", module_id: "mc3_2", title: "Visualización con Matplotlib", description: "Gráficos básicos, avanzados y visualización de datos.", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 2, materials: [] },
        ],
      },
    ],
  },
};

// ── Progreso de lecciones mock ─────────────────────────────────────────────────
const MOCK_PROGRESS_BY_COURSE: Record<string, { enrollment: object; lesson_progress: object[]; has_review: boolean }> = {
  c1: {
    enrollment: { id: "enr1", progress_percent: 65, completed_at: null },
    has_review: false,
    lesson_progress: [
      { id: "lp1", enrollment_id: "enr1", session_id: "s1", watched_seconds: 2700, completed: true, completed_at: "2024-03-10T10:00:00Z", last_watched_at: "2024-03-10T10:45:00Z" },
      { id: "lp2", enrollment_id: "enr1", session_id: "s2", watched_seconds: 2200, completed: true, completed_at: "2024-03-12T11:00:00Z", last_watched_at: "2024-03-12T11:38:00Z" },
      { id: "lp3", enrollment_id: "enr1", session_id: "s3", watched_seconds: 900, completed: false, completed_at: null, last_watched_at: "2024-03-14T09:30:00Z" },
    ],
  },
  c2: {
    enrollment: { id: "enr2", progress_percent: 30, completed_at: null },
    has_review: false,
    lesson_progress: [
      { id: "lp4", enrollment_id: "enr2", session_id: "sc2_1", watched_seconds: 2400, completed: true, completed_at: "2024-03-05T10:00:00Z", last_watched_at: "2024-03-05T10:40:00Z" },
    ],
  },
  c3: {
    enrollment: { id: "enr3", progress_percent: 100, completed_at: "2024-02-28T12:00:00Z" },
    has_review: false,
    lesson_progress: [
      { id: "lp5", enrollment_id: "enr3", session_id: "sc3_1", watched_seconds: 1800, completed: true, completed_at: "2024-02-20T10:00:00Z", last_watched_at: "2024-02-20T10:30:00Z" },
      { id: "lp6", enrollment_id: "enr3", session_id: "sc3_2", watched_seconds: 2700, completed: true, completed_at: "2024-02-22T11:00:00Z", last_watched_at: "2024-02-22T11:45:00Z" },
      { id: "lp7", enrollment_id: "enr3", session_id: "sc3_3", watched_seconds: 3600, completed: true, completed_at: "2024-02-25T09:00:00Z", last_watched_at: "2024-02-25T10:00:00Z" },
      { id: "lp8", enrollment_id: "enr3", session_id: "sc3_4", watched_seconds: 3300, completed: true, completed_at: "2024-02-28T11:00:00Z", last_watched_at: "2024-02-28T12:00:00Z" },
    ],
  },
};

// ── Certificados mock ──────────────────────────────────────────────────────────
const MOCK_CERTIFICATES: Record<string, object> = {
  enr3: {
    id: "cert1",
    enrollment_id: "enr3",
    template_id: "tmpl1",
    verification_code: "CERT-2024-EG-PYTHON-001",
    pdf_url: "",
    issued_at: "2024-02-28T12:05:00Z",
    student: { first_name: "María", last_name: "García" },
    enrollment: {
      enrolled_at: "2023-12-01T08:00:00Z",
      completed_at: "2024-02-28T12:00:00Z",
      course: { title: "Python para Análisis de Datos", total_duration_minutes: 300 },
    },
  },
};

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
        total_watched_seconds: 5800,
        has_review: false,
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
        total_watched_seconds: 2400,
        has_review: false,
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
        total_watched_seconds: 11400,
        has_review: false,
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

  // ── VISOR DE CURSO ───────────────────────────────────────────────────────────

  http.get(`${BASE}/cursos/:id/contenido`, ({ params }) => {
    console.log("[MSW] GET /cursos/:id/contenido →", params.id);
    const content = MOCK_COURSE_CONTENT[params.id as string] ?? MOCK_COURSE_CONTENT["c1"];
    return HttpResponse.json(content);
  }),

  http.get(`${BASE}/mi-progreso/cursos/:courseId`, ({ params }) => {
    console.log("[MSW] GET /mi-progreso/cursos/:courseId →", params.courseId);
    const progress = MOCK_PROGRESS_BY_COURSE[params.courseId as string] ?? {
      enrollment: { id: "enr_unknown", progress_percent: 0, completed_at: null },
      lesson_progress: [],
      has_review: false,
    };
    return HttpResponse.json(progress);
  }),

  http.put(`${BASE}/mi-progreso/sesiones/:sessionId`, async ({ params, request }) => {
    const body = await request.json() as { watched_seconds: number };
    console.log("[MSW] PUT /mi-progreso/sesiones/:sessionId →", params.sessionId, body);

    // Busca en todos los cursos la sesión para calcular si se completó
    let durationMinutes = 45;
    for (const courseData of Object.values(MOCK_COURSE_CONTENT)) {
      const c = courseData as { modules: Array<{ sessions: Array<{ id: string; duration_minutes: number }> }> };
      for (const mod of c.modules) {
        const sess = mod.sessions.find((s) => s.id === params.sessionId);
        if (sess) { durationMinutes = sess.duration_minutes; break; }
      }
    }
    const completed = body.watched_seconds >= durationMinutes * 60 * 0.9;
    // Simula progreso recalculado
    return HttpResponse.json({ completed, progress_percent: completed ? 80 : 65 });
  }),

  // ── RESEÑAS ──────────────────────────────────────────────────────────────────

  http.post(`${BASE}/reviews`, async ({ request }) => {
    const body = await request.json() as { enrollment_id: string; rating: number; comment: string };
    console.log("[MSW] POST /reviews →", body);
    // Al crear reseña, se genera certificado
    return HttpResponse.json({
      id: "rev_" + Date.now(),
      ...body,
      status: "approved",
      created_at: new Date().toISOString(),
      certificate_available: true,
    }, { status: 201 });
  }),

  // ── CERTIFICADOS ─────────────────────────────────────────────────────────────

  http.get(`${BASE}/certificados/mi-certificado/:enrollmentId`, ({ params }) => {
    console.log("[MSW] GET /certificados/mi-certificado/:enrollmentId →", params.enrollmentId);
    const cert = MOCK_CERTIFICATES[params.enrollmentId as string];
    if (!cert) {
      return HttpResponse.json({ message: "Certificado no disponible" }, { status: 404 });
    }
    return HttpResponse.json(cert);
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
