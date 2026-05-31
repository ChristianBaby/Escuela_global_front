import { http, HttpResponse } from "msw";

function normalizeApiUrl(url: string) {
  const cleanUrl = url.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
}

const BASE = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");

function mockJwt(payload: object): string {
  const encode = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const body = encode(payload);
  return `${header}.${body}.mock_signature`;
}

function decodeJwtEmail(request: Request): string | null {
  const auth = request.headers.get("Authorization") ?? "";
  const token = auth.replace("Bearer ", "");
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return payload.email ?? null;
  } catch {
    return null;
  }
}

// ── Usuarios mock ──────────────────────────────────────────────────────────────
const MOCK_USERS = [
  { id: "u1", first_name: "María", last_name: "García", email: "maria@example.com", role: "estudiante", status: "active", phone: "+51999111222", country: "PE", email_verified: true, profile_photo_url: undefined, created_by: undefined, created_at: "2024-01-15T00:00:00Z", updated_at: "2024-01-15T00:00:00Z" },
  { id: "u2", first_name: "Carlos", last_name: "López", email: "carlos@example.com", role: "estudiante", status: "active", phone: "+51999333444", country: "PE", email_verified: true, profile_photo_url: undefined, created_by: undefined, created_at: "2024-02-20T00:00:00Z", updated_at: "2024-02-20T00:00:00Z" },
  { id: "u3", first_name: "Ana", last_name: "Torres", email: "ana@example.com", role: "soporte", status: "active", phone: "+51999555666", country: "PE", email_verified: true, profile_photo_url: undefined, created_by: undefined, created_at: "2024-01-05T00:00:00Z", updated_at: "2024-01-05T00:00:00Z" },
  { id: "u4", first_name: "Luis", last_name: "Mendoza", email: "luis@example.com", role: "marketing", status: "suspended", phone: "+51999777888", country: "PE", email_verified: true, profile_photo_url: undefined, created_by: undefined, created_at: "2024-03-10T00:00:00Z", updated_at: "2024-03-10T00:00:00Z" },
  { id: "u5", first_name: "Admin", last_name: "Global", email: "admin@escuelaglobal.com", role: "admin", status: "active", phone: "+51999000111", country: "PE", email_verified: true, profile_photo_url: undefined, created_by: undefined, created_at: "2023-12-01T00:00:00Z", updated_at: "2023-12-01T00:00:00Z" },
];

// ── Categorías mock ────────────────────────────────────────────────────────────
const MOCK_CATEGORIAS = [
  { id: "cat1", name: "Derecho", slug: "derecho", icon: "⚖️", color: "#2B55A3", description: "Cursos de ciencias jurídicas", display_order: 1, created_at: "2024-01-01T00:00:00Z" },
  { id: "cat2", name: "Finanzas", slug: "finanzas", icon: "💰", color: "#3FB1E5", description: "Finanzas y contabilidad", display_order: 2, created_at: "2024-01-01T00:00:00Z" },
  { id: "cat3", name: "Tecnología", slug: "tecnologia", icon: "💻", color: "#10B981", description: "Programación y datos", display_order: 3, created_at: "2024-01-01T00:00:00Z" },
  { id: "cat4", name: "Marketing", slug: "marketing", icon: "📣", color: "#F59E0B", description: "Marketing digital y ventas", display_order: 4, created_at: "2024-01-01T00:00:00Z" },
];

// ── Cursos mock ────────────────────────────────────────────────────────────────
const MOCK_CURSOS = [
  {
    id: "c1", title: "Derecho Laboral Avanzado", slug: "derecho-laboral-avanzado",
    category: MOCK_CATEGORIAS[0], category_id: "cat1",
    tagline: "Domina el derecho laboral con casos reales",
    description: "Curso completo sobre legislación laboral peruana e internacional.",
    price: 299, discount_price: undefined, currency: "USD", level: "avanzado", status: "published",
    enrolled_count: 42, avg_rating: 4.7, review_count: 18, total_duration_minutes: 720,
    software_tools: ["Microsoft Word", "Excel"], access_duration: "lifetime",
    prerequisites: ["Conocimientos básicos de derecho"], outcomes: ["Gestionar contratos laborales", "Resolver conflictos laborales"],
    thumbnail_url: "", published_at: "2024-01-15T00:00:00Z",
    instructors: [{ id: "i1", course_id: "c1", first_name: "Roberto", last_name: "Sánchez", title: "Abogado Laboralista", description: "Especialista en derecho laboral con 15 años de experiencia.", photo_url: "", display_order: 1 }],
    created_by: "u5", created_at: "2024-01-10T00:00:00Z", updated_at: "2024-01-10T00:00:00Z",
  },
  {
    id: "c2", title: "Finanzas Corporativas", slug: "finanzas-corporativas",
    category: MOCK_CATEGORIAS[1], category_id: "cat2",
    tagline: "Finanzas avanzadas para directivos y gerentes",
    description: "Domina los estados financieros y análisis de inversión.",
    price: 249, discount_price: 199, currency: "USD", level: "intermedio", status: "published",
    enrolled_count: 28, avg_rating: 4.5, review_count: 11, total_duration_minutes: 540,
    software_tools: ["Excel", "Power BI"], access_duration: "1_year",
    prerequisites: ["Conocimientos básicos de contabilidad"], outcomes: ["Analizar estados financieros", "Tomar decisiones de inversión"],
    thumbnail_url: "", published_at: "2024-02-10T00:00:00Z",
    instructors: [{ id: "i2", course_id: "c2", first_name: "Lucía", last_name: "Ramos", title: "CFO & Consultora Financiera", description: "20 años en finanzas corporativas.", photo_url: "", display_order: 1 }],
    created_by: "u5", created_at: "2024-02-05T00:00:00Z", updated_at: "2024-02-05T00:00:00Z",
  },
  {
    id: "c3", title: "Python para Análisis de Datos", slug: "python-analisis-datos",
    category: MOCK_CATEGORIAS[2], category_id: "cat3",
    tagline: "Aprende Python desde cero para ciencia de datos",
    description: "Pandas, NumPy, Matplotlib y más.",
    price: 199, discount_price: undefined, currency: "USD", level: "principiante", status: "published",
    enrolled_count: 95, avg_rating: 4.9, review_count: 34, total_duration_minutes: 360,
    software_tools: ["Python", "Jupyter Notebook", "Excel"], access_duration: "lifetime",
    prerequisites: [], outcomes: ["Usar Pandas para análisis", "Crear visualizaciones con Matplotlib"],
    thumbnail_url: "", published_at: "2024-03-05T00:00:00Z",
    instructors: [{ id: "i3", course_id: "c3", first_name: "Diego", last_name: "Torres", title: "Data Scientist Senior", description: "Experto en Python y machine learning.", photo_url: "", display_order: 1 }],
    created_by: "u5", created_at: "2024-03-01T00:00:00Z", updated_at: "2024-03-01T00:00:00Z",
  },
  {
    id: "c4", title: "Marketing Digital Avanzado", slug: "marketing-digital-avanzado",
    category: MOCK_CATEGORIAS[3], category_id: "cat4",
    tagline: "Estrategias digitales para hacer crecer tu negocio",
    description: "SEO, SEM, redes sociales y analítica digital.",
    price: 179, discount_price: undefined, currency: "USD", level: "intermedio", status: "published",
    enrolled_count: 67, avg_rating: 4.6, review_count: 22, total_duration_minutes: 480,
    software_tools: ["Google Analytics", "Meta Ads", "Canva"], access_duration: "lifetime",
    prerequisites: ["Manejo básico de redes sociales"], outcomes: ["Crear campañas de Google Ads", "Analizar métricas de marketing"],
    thumbnail_url: "", published_at: "2024-03-15T00:00:00Z",
    instructors: [{ id: "i4", course_id: "c4", first_name: "Ana", last_name: "Vega", title: "Digital Marketing Manager", description: "Especialista en marketing digital.", photo_url: "", display_order: 1 }],
    created_by: "u5", created_at: "2024-03-10T00:00:00Z", updated_at: "2024-03-10T00:00:00Z",
  },
  {
    id: "c5", title: "Gestión de Proyectos con Agile", slug: "gestion-proyectos-agile",
    category: MOCK_CATEGORIAS[2], category_id: "cat3",
    tagline: "Domina Scrum y Kanban para liderar equipos", description: "Metodologías ágiles aplicadas a proyectos reales.",
    price: 229, discount_price: 179, currency: "USD", level: "intermedio", status: "draft",
    enrolled_count: 0, avg_rating: 0, review_count: 0, total_duration_minutes: 420,
    software_tools: ["Jira", "Trello"], access_duration: "lifetime",
    prerequisites: [], outcomes: ["Liderar sprints", "Gestionar backlogs"],
    thumbnail_url: "", published_at: undefined,
    instructors: [{ id: "i5", course_id: "c5", first_name: "Pedro", last_name: "Castillo", title: "Scrum Master Certificado", description: "PMP y Scrum Master con 10 años de experiencia.", photo_url: "", display_order: 1 }],
    created_by: "u5", created_at: "2024-04-01T00:00:00Z", updated_at: "2024-04-01T00:00:00Z",
  },
];

const MOCK_SOFTWARES = ["Canva", "Excel", "Google Analytics", "Jira", "Jupyter Notebook", "Meta Ads", "Microsoft Word", "Power BI", "Python", "Trello"];

// ── Módulos mock por curso ─────────────────────────────────────────────────────
const MOCK_MODULES: Record<string, object[]> = {
  c1: [
    { id: "m1", course_id: "c1", title: "Módulo 1: Fundamentos del Derecho Laboral", description: "Principios y fuentes del derecho laboral.", display_order: 1, sessions_count: 3, total_duration: 125, created_at: "2024-01-10T00:00:00Z" },
    { id: "m2", course_id: "c1", title: "Módulo 2: Relaciones Laborales", description: "Derechos, sindicatos y negociación.", display_order: 2, sessions_count: 2, total_duration: 103, created_at: "2024-01-10T00:00:00Z" },
  ],
  c2: [
    { id: "mc2_1", course_id: "c2", title: "Módulo 1: Fundamentos Financieros", description: "Conceptos esenciales de finanzas.", display_order: 1, sessions_count: 2, total_duration: 90, created_at: "2024-02-05T00:00:00Z" },
  ],
  c3: [
    { id: "mc3_1", course_id: "c3", title: "Módulo 1: Python Básico", description: "Instalación y tipos de datos.", display_order: 1, sessions_count: 2, total_duration: 75, created_at: "2024-03-01T00:00:00Z" },
    { id: "mc3_2", course_id: "c3", title: "Módulo 2: Análisis con Pandas", description: "DataFrames y visualización.", display_order: 2, sessions_count: 2, total_duration: 115, created_at: "2024-03-01T00:00:00Z" },
  ],
  c4: [
    { id: "mc4_1", course_id: "c4", title: "Módulo 1: Fundamentos del Marketing Digital", description: "SEO y SEM.", display_order: 1, sessions_count: 3, total_duration: 120, created_at: "2024-03-10T00:00:00Z" },
  ],
};

// ── Sesiones mock por módulo ───────────────────────────────────────────────────
const MOCK_SESSIONS: Record<string, object[]> = {
  m1: [
    { id: "s1", module_id: "m1", title: "Introducción al Derecho Laboral", description: "Conceptos base y principios fundamentales.", youtube_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 45, display_order: 1, materials_count: 1, created_at: "2024-01-10T00:00:00Z" },
    { id: "s2", module_id: "m1", title: "Contratos de Trabajo", description: "Tipos de contratos laborales.", youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 38, display_order: 2, materials_count: 0, created_at: "2024-01-10T00:00:00Z" },
    { id: "s3", module_id: "m1", title: "Jornada Laboral y Horas Extra", description: "Regulaciones sobre jornada de trabajo.", youtube_url: "https://www.youtube.com/watch?v=9bZkp7q19f0", youtube_video_id: "9bZkp7q19f0", duration_minutes: 42, display_order: 3, materials_count: 1, created_at: "2024-01-10T00:00:00Z" },
  ],
  m2: [
    { id: "s4", module_id: "m2", title: "Derechos Fundamentales del Trabajador", description: "Derechos constitucionales.", youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 1, materials_count: 1, created_at: "2024-01-10T00:00:00Z" },
    { id: "s5", module_id: "m2", title: "Sindicatos y Negociación Colectiva", description: "Rol de los sindicatos.", youtube_url: "https://www.youtube.com/watch?v=QH2-TGUlwu4", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 48, display_order: 2, materials_count: 0, created_at: "2024-01-10T00:00:00Z" },
  ],
  mc2_1: [
    { id: "sc2_1", module_id: "mc2_1", title: "Introducción a las Finanzas Corporativas", description: "Conceptos esenciales.", youtube_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 40, display_order: 1, materials_count: 0, created_at: "2024-02-05T00:00:00Z" },
    { id: "sc2_2", module_id: "mc2_1", title: "Estados Financieros", description: "Balance, resultados y flujos.", youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 50, display_order: 2, materials_count: 1, created_at: "2024-02-05T00:00:00Z" },
  ],
  mc3_1: [
    { id: "sc3_1", module_id: "mc3_1", title: "Instalación y Entorno", description: "Python, Anaconda y Jupyter.", youtube_url: "https://www.youtube.com/watch?v=jNQXAC9IVRw", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 30, display_order: 1, materials_count: 0, created_at: "2024-03-01T00:00:00Z" },
    { id: "sc3_2", module_id: "mc3_1", title: "Variables y Tipos de Datos", description: "Tipos primitivos y colecciones.", youtube_url: "https://www.youtube.com/watch?v=9bZkp7q19f0", youtube_video_id: "9bZkp7q19f0", duration_minutes: 45, display_order: 2, materials_count: 1, created_at: "2024-03-01T00:00:00Z" },
  ],
  mc3_2: [
    { id: "sc3_3", module_id: "mc3_2", title: "Introducción a Pandas", description: "DataFrames y Series.", youtube_url: "https://www.youtube.com/watch?v=QH2-TGUlwu4", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 60, display_order: 1, materials_count: 0, created_at: "2024-03-01T00:00:00Z" },
    { id: "sc3_4", module_id: "mc3_2", title: "Visualización con Matplotlib", description: "Gráficos y visualización.", youtube_url: "https://www.youtube.com/watch?v=JGwWNGJdvx8", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 2, materials_count: 0, created_at: "2024-03-01T00:00:00Z" },
  ],
};

// ── Materiales mock por sesión ─────────────────────────────────────────────────
const MOCK_MATERIALS: Record<string, object[]> = {
  s1: [{ id: "mat1", session_id: "s1", name: "Presentación Clase 1.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-01-10T00:00:00Z" }],
  s3: [{ id: "mat2", session_id: "s3", name: "Tabla Cálculo Horas Extra.xlsx", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "Excel", created_at: "2024-01-10T00:00:00Z" }],
  s4: [{ id: "mat3", session_id: "s4", name: "Manual Derechos Laborales.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-01-10T00:00:00Z" }],
  sc2_2: [{ id: "mc2mat1", session_id: "sc2_2", name: "Plantilla Excel Financiera.xlsx", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "Excel", created_at: "2024-02-05T00:00:00Z" }],
  sc3_2: [{ id: "mc3mat1", session_id: "sc3_2", name: "Ejercicios Python.pdf", drive_url: "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs", type: "PDF", created_at: "2024-03-01T00:00:00Z" }],
};

// ── Contenido de cursos (visor) ────────────────────────────────────────────────
const MOCK_COURSE_CONTENT: Record<string, object> = {
  c1: {
    id: "c1", title: "Derecho Laboral Avanzado",
    modules: [
      {
        id: "m1", title: "Módulo 1: Fundamentos del Derecho Laboral", display_order: 1,
        sessions: [
          { id: "s1", module_id: "m1", title: "Introducción al Derecho Laboral", description: "Conceptos base.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 45, display_order: 1, materials: MOCK_MATERIALS["s1"] },
          { id: "s2", module_id: "m1", title: "Contratos de Trabajo", description: "Tipos de contratos laborales.", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 38, display_order: 2, materials: [] },
          { id: "s3", module_id: "m1", title: "Jornada Laboral y Horas Extra", description: "Regulaciones sobre la jornada.", youtube_video_id: "9bZkp7q19f0", duration_minutes: 42, display_order: 3, materials: MOCK_MATERIALS["s3"] },
        ],
      },
      {
        id: "m2", title: "Módulo 2: Relaciones Laborales", display_order: 2,
        sessions: [
          { id: "s4", module_id: "m2", title: "Derechos Fundamentales del Trabajador", description: "Derechos laborales.", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 1, materials: MOCK_MATERIALS["s4"] },
          { id: "s5", module_id: "m2", title: "Sindicatos y Negociación Colectiva", description: "Rol de los sindicatos.", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 48, display_order: 2, materials: [] },
        ],
      },
    ],
  },
  c2: {
    id: "c2", title: "Finanzas Corporativas",
    modules: [{
      id: "mc2_1", title: "Módulo 1: Fundamentos Financieros", display_order: 1,
      sessions: [
        { id: "sc2_1", module_id: "mc2_1", title: "Introducción a las Finanzas Corporativas", description: "Conceptos esenciales.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 40, display_order: 1, materials: [] },
        { id: "sc2_2", module_id: "mc2_1", title: "Estados Financieros", description: "Balance y flujos.", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 50, display_order: 2, materials: MOCK_MATERIALS["sc2_2"] },
      ],
    }],
  },
  c3: {
    id: "c3", title: "Python para Análisis de Datos",
    modules: [
      {
        id: "mc3_1", title: "Módulo 1: Python Básico", display_order: 1,
        sessions: [
          { id: "sc3_1", module_id: "mc3_1", title: "Instalación y Entorno", description: "Python, Anaconda y Jupyter.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 30, display_order: 1, materials: [] },
          { id: "sc3_2", module_id: "mc3_1", title: "Variables y Tipos de Datos", description: "Tipos primitivos y colecciones.", youtube_video_id: "9bZkp7q19f0", duration_minutes: 45, display_order: 2, materials: MOCK_MATERIALS["sc3_2"] },
        ],
      },
      {
        id: "mc3_2", title: "Módulo 2: Análisis con Pandas", display_order: 2,
        sessions: [
          { id: "sc3_3", module_id: "mc3_2", title: "Introducción a Pandas", description: "DataFrames y Series.", youtube_video_id: "QH2-TGUlwu4", duration_minutes: 60, display_order: 1, materials: [] },
          { id: "sc3_4", module_id: "mc3_2", title: "Visualización con Matplotlib", description: "Gráficos y visualización.", youtube_video_id: "JGwWNGJdvx8", duration_minutes: 55, display_order: 2, materials: [] },
        ],
      },
    ],
  },
  c4: {
    id: "c4", title: "Marketing Digital Avanzado",
    modules: [{
      id: "mc4_1", title: "Módulo 1: Fundamentos del Marketing Digital", display_order: 1,
      sessions: [
        { id: "sc4_1", module_id: "mc4_1", title: "Introducción al Marketing Digital", description: "Panorama general.", youtube_video_id: "jNQXAC9IVRw", duration_minutes: 35, display_order: 1, materials: [] },
        { id: "sc4_2", module_id: "mc4_1", title: "SEO Fundamentos", description: "Optimización para buscadores.", youtube_video_id: "dQw4w9WgXcQ", duration_minutes: 45, display_order: 2, materials: [] },
        { id: "sc4_3", module_id: "mc4_1", title: "Google Ads", description: "Campañas de búsqueda y display.", youtube_video_id: "9bZkp7q19f0", duration_minutes: 40, display_order: 3, materials: [] },
      ],
    }],
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

// ── Inscripciones mock ─────────────────────────────────────────────────────────
const MOCK_ENROLLMENTS = [
  {
    id: "enr1", user_id: "u1", course_id: "c1", order_id: "ord1",
    enrollment_type: "online", progress_percent: 65, completed_at: null,
    last_accessed_at: "2024-03-14T10:00:00Z", enrolled_at: "2024-01-10T08:00:00Z",
    total_watched_seconds: 5800, has_review: false,
    user: MOCK_USERS[0],
    course: { id: "c1", title: "Derecho Laboral Avanzado", slug: "derecho-laboral-avanzado", thumbnail_url: "", level: "avanzado", total_duration_minutes: 720 },
  },
  {
    id: "enr2", user_id: "u1", course_id: "c2", order_id: "ord2",
    enrollment_type: "online", progress_percent: 30, completed_at: null,
    last_accessed_at: "2024-03-10T15:00:00Z", enrolled_at: "2024-02-01T08:00:00Z",
    total_watched_seconds: 2400, has_review: false,
    user: MOCK_USERS[0],
    course: { id: "c2", title: "Finanzas Corporativas", slug: "finanzas-corporativas", thumbnail_url: "", level: "intermedio", total_duration_minutes: 540 },
  },
  {
    id: "enr3", user_id: "u1", course_id: "c3", order_id: undefined,
    enrollment_type: "manual", progress_percent: 100, completed_at: "2024-02-28T12:00:00Z",
    last_accessed_at: "2024-02-28T12:00:00Z", enrolled_at: "2023-12-01T08:00:00Z",
    total_watched_seconds: 11400, has_review: false,
    user: MOCK_USERS[0],
    course: { id: "c3", title: "Python para Análisis de Datos", slug: "python-analisis-datos", thumbnail_url: "", level: "principiante", total_duration_minutes: 360 },
  },
  {
    id: "enr4", user_id: "u2", course_id: "c1", order_id: "ord3",
    enrollment_type: "online", progress_percent: 20, completed_at: null,
    last_accessed_at: "2024-03-01T09:00:00Z", enrolled_at: "2024-02-15T08:00:00Z",
    total_watched_seconds: 1440, has_review: false,
    user: MOCK_USERS[1],
    course: { id: "c1", title: "Derecho Laboral Avanzado", slug: "derecho-laboral-avanzado", thumbnail_url: "", level: "avanzado", total_duration_minutes: 720 },
  },
];

// ── Carrito mock ───────────────────────────────────────────────────────────────
let MOCK_CART_ITEMS: { id: string; course: object }[] = [
  { id: "ci1", course: { id: "c4", title: "Marketing Digital Avanzado", slug: "marketing-digital-avanzado", thumbnail_url: "", price: 179, discount_price: undefined, currency: "USD" } },
];

// ── Certificados mock ──────────────────────────────────────────────────────────
const MOCK_CERTIFICATES_SUMMARY = [
  { id: "cert1", enrollment_id: "enr3", course_title: "Python para Análisis de Datos", verification_code: "CERT-2024-EG-PYTHON-001", pdf_url: "", issued_at: "2024-02-28T12:05:00Z" },
];

const MOCK_CERTIFICATES_DETAIL: Record<string, object> = {
  enr3: { id: "cert1", verification_code: "CERT-2024-EG-PYTHON-001", pdf_url: "", course_title: "Python para Análisis de Datos", student_name: "María García", issued_at: "2024-02-28T12:05:00Z", total_hours: 6, instructors: ["Diego Torres"] },
};

// ── Promociones mock ───────────────────────────────────────────────────────────
const MOCK_PROMOCIONES = [
  { id: "p1", title: "Banner Verano 2024", image_url: "", destination_url: "https://example.com", display_order: 1, status: "active", starts_at: "2024-01-01T00:00:00Z", ends_at: "2024-12-31T23:59:59Z", created_at: "2024-01-01T00:00:00Z" },
  { id: "p2", title: "Promo Derecho Laboral", image_url: "", destination_url: "https://example.com/derecho", display_order: 2, status: "active", starts_at: "2024-03-01T00:00:00Z", ends_at: "2024-05-15T23:59:59Z", created_at: "2024-03-01T00:00:00Z" },
  { id: "p3", title: "Descuento Fin de Año", image_url: "", destination_url: null, display_order: 3, status: "inactive", starts_at: "2024-12-15T00:00:00Z", ends_at: "2024-12-31T23:59:59Z", created_at: "2024-11-01T00:00:00Z" },
  { id: "p4", title: "Campaña Python Data Science", image_url: "", destination_url: "https://example.com/python", display_order: 4, status: "inactive", starts_at: null, ends_at: null, created_at: "2024-02-10T00:00:00Z" },
];

// ── Sliders mock ───────────────────────────────────────────────────────────────
const MOCK_SLIDERS = [
  {
    id: "sl1",
    title: "Derecho Laboral Avanzado",
    subtitle: "Domina la legislación laboral peruana e internacional con casos reales de la vida profesional.",
    type: "banner",
    image_url: "",
    destination_url: "/cursos/derecho-laboral-avanzado",
    contact_url: "https://wa.me/51999000111?text=Hola,%20me%20interesa%20el%20programa%20de%20Derecho%20Laboral%20Avanzado",
    position_on_page: "top",
    display_order: 1,
    status: "active",
    courses: [] as typeof MOCK_CURSOS,
    created_at: "2024-01-01T00:00:00Z",
  },
  {
    id: "sl2",
    title: "Python para Análisis de Datos",
    subtitle: "Aprende Pandas, NumPy y Machine Learning con proyectos reales desde cero.",
    type: "banner",
    image_url: "",
    destination_url: "/cursos/python-analisis-datos",
    contact_url: "https://wa.me/51999000111?text=Hola,%20me%20interesa%20el%20programa%20de%20Python%20para%20An%C3%A1lisis%20de%20Datos",
    position_on_page: "top",
    display_order: 2,
    status: "active",
    courses: [] as typeof MOCK_CURSOS,
    created_at: "2024-02-01T00:00:00Z",
  },
  {
    id: "sl3",
    title: "Finanzas Corporativas",
    subtitle: "Domina los estados financieros y decisiones de inversión con expertos en finanzas.",
    type: "banner",
    image_url: "",
    destination_url: "/cursos/finanzas-corporativas",
    contact_url: "https://wa.me/51999000111?text=Hola,%20me%20interesa%20el%20programa%20de%20Finanzas%20Corporativas",
    position_on_page: "top",
    display_order: 3,
    status: "active",
    courses: [] as typeof MOCK_CURSOS,
    created_at: "2024-03-01T00:00:00Z",
  },
  {
    id: "sl4",
    title: "Marketing Digital Avanzado",
    subtitle: "Estrategias SEO, SEM y analítica digital para hacer crecer cualquier negocio.",
    type: "banner",
    image_url: "",
    destination_url: "/cursos/marketing-digital-avanzado",
    contact_url: "https://wa.me/51999000111?text=Hola,%20me%20interesa%20el%20programa%20de%20Marketing%20Digital",
    position_on_page: "top",
    display_order: 4,
    status: "inactive",
    courses: [] as typeof MOCK_CURSOS,
    created_at: "2024-03-10T00:00:00Z",
  },
];

export const handlers = [

  // ══════════════════════════════════════════════════════════════════════════════
  // AUTH
  // ══════════════════════════════════════════════════════════════════════════════

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as { email: string; password: string };
    if (body.password === "wrong") {
      return HttpResponse.json({ message: "Credenciales incorrectas" }, { status: 401 });
    }
    const userMap: Record<string, typeof MOCK_USERS[0]> = {
      "admin@escuelaglobal.com": MOCK_USERS[4],
      "ana@example.com": MOCK_USERS[2],
      "luis@example.com": MOCK_USERS[3],
      "carlos@example.com": MOCK_USERS[1],
    };
    const user = userMap[body.email] ?? MOCK_USERS[0];
    const access_token = mockJwt({ sub: user.id, role: user.role, email: user.email });
    return HttpResponse.json({ access_token, user });
  }),

  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    if (body.email === "duplicado@example.com") {
      return HttpResponse.json({ message: "El correo ya está registrado" }, { status: 409 });
    }
    return HttpResponse.json({ message: "Usuario creado. Revisa tu correo para verificar tu cuenta." }, { status: 201 });
  }),

  http.post(`${BASE}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json() as { email: string };
    if (body.email === "noexiste@example.com") {
      return HttpResponse.json({ message: "Si el correo existe, recibirás un enlace." });
    }
    return HttpResponse.json({ message: "Si el correo existe, recibirás un enlace de recuperación." });
  }),

  http.post(`${BASE}/auth/reset-password`, async ({ request }) => {
    const body = await request.json() as { token: string; password: string };
    if (body.token === "invalid-token") {
      return HttpResponse.json({ message: "Token inválido o expirado" }, { status: 400 });
    }
    return HttpResponse.json({ message: "Contraseña restablecida correctamente." });
  }),

  http.get(`${BASE}/auth/verify-email`, ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token || token === "invalid") {
      return HttpResponse.json({ message: "Token inválido o expirado" }, { status: 400 });
    }
    return HttpResponse.json({ message: "Correo verificado correctamente." });
  }),

  http.post(`${BASE}/auth/logout`, () => {
    return HttpResponse.json({ message: "Sesión cerrada correctamente." });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // COURSES — rutas específicas primero (antes de /:id)
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/courses/softwares`, () => {
    return HttpResponse.json(MOCK_SOFTWARES);
  }),

  http.get(`${BASE}/courses/featured`, ({ request }) => {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit")) || 8;
    const published = MOCK_CURSOS.filter((c) => c.status === "published");
    return HttpResponse.json({ data: published.slice(0, limit) });
  }),

  http.get(`${BASE}/courses/catalog`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    let results = MOCK_CURSOS.filter((c) => c.status === "published");
    if (params.search) {
      const q = params.search.toLowerCase();
      results = results.filter((c) => c.title.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q));
    }
    if (params.categoria_ids) {
      const ids = params.categoria_ids.split(",").filter(Boolean);
      if (ids.length > 0) results = results.filter((c) => ids.includes(c.category_id));
    }
    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const total = results.length;
    return HttpResponse.json({ data: results.slice((page - 1) * limit, page * limit), total, page, limit, total_pages: Math.ceil(total / limit) });
  }),

  http.get(`${BASE}/courses/slug/:slug`, ({ params }) => {
    const curso = MOCK_CURSOS.find((c) => c.slug === params.slug) ?? MOCK_CURSOS[0];
    return HttpResponse.json(curso);
  }),

  http.get(`${BASE}/courses`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    let results = [...MOCK_CURSOS];

    if (params.status) {
      results = results.filter((c) => c.status === params.status);
    } else {
      results = results.filter((c) => c.status === "published");
    }
    if (params.categoria_ids) {
      const ids = params.categoria_ids.split(",").filter(Boolean);
      if (ids.length > 0) results = results.filter((c) => ids.includes(c.category_id));
    } else if (params.categoria_id) {
      results = results.filter((c) => c.category_id === params.categoria_id);
    }
    if (params.min_rating) results = results.filter((c) => c.avg_rating >= Number(params.min_rating));
    if (params.min_price) results = results.filter((c) => c.price >= Number(params.min_price));
    if (params.max_price) results = results.filter((c) => c.price <= Number(params.max_price));
    if (params.softwares) {
      const sw = params.softwares.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (sw.length > 0) results = results.filter((c) => sw.some((s: string) => c.software_tools.includes(s)));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      results = results.filter((c) => c.title.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q));
    }
    if (params.sort === "popular") results.sort((a, b) => b.enrolled_count - a.enrolled_count);
    else if (params.sort === "best_rated") results.sort((a, b) => b.avg_rating - a.avg_rating);
    else if (params.sort === "price_asc") results.sort((a, b) => a.price - b.price);
    else if (params.sort === "price_desc") results.sort((a, b) => b.price - a.price);

    const page = Number(params.page) || 1;
    const limit = Number(params.limit) || 12;
    const total = results.length;
    return HttpResponse.json({ data: results.slice((page - 1) * limit, page * limit), total, page, limit, total_pages: Math.ceil(total / limit) });
  }),

  http.post(`${BASE}/courses`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newCourse = { id: "c_new_" + Date.now(), slug: String(body.title ?? "").toLowerCase().replace(/\s+/g, "-"), avg_rating: 0, review_count: 0, enrolled_count: 0, total_duration_minutes: 0, instructors: [], created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
    return HttpResponse.json({ success: true, course: { id: newCourse.id, title: newCourse.title, slug: newCourse.slug, status: newCourse.status ?? "draft", created_at: newCourse.created_at } }, { status: 201 });
  }),

  http.get(`${BASE}/courses/:id/matriculados`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const enrolled = MOCK_ENROLLMENTS.filter((e) => e.course_id === params.id);
    return HttpResponse.json({ data: enrolled.slice((page - 1) * limit, page * limit), total: enrolled.length, page, limit, total_pages: Math.ceil(enrolled.length / limit) });
  }),

  http.post(`${BASE}/courses/:id/thumbnail`, async () => {
    return HttpResponse.json({ success: true, thumbnail_url: "https://via.placeholder.com/640x360?text=Thumbnail" });
  }),

  http.post(`${BASE}/courses/:id/instructors`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "i_new_" + Date.now(), course_id: params.id, display_order: 1, ...body }, { status: 201 });
  }),

  http.delete(`${BASE}/courses/:id/instructors/:instructorId`, ({ params }) => {
    return HttpResponse.json({ message: `Instructor ${params.instructorId} eliminado del curso ${params.id}` });
  }),

  http.get(`${BASE}/courses/:courseId/modules`, ({ params }) => {
    const modules = MOCK_MODULES[params.courseId as string] ?? [];
    return HttpResponse.json(modules);
  }),

  http.post(`${BASE}/courses/:courseId/modules`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newModule = { id: "m_new_" + Date.now(), course_id: params.courseId, display_order: 99, sessions_count: 0, total_duration: 0, created_at: new Date().toISOString(), ...body };
    return HttpResponse.json({ success: true, module: newModule }, { status: 201 });
  }),

  http.patch(`${BASE}/courses/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const curso = MOCK_CURSOS.find((c) => c.id === params.id) ?? MOCK_CURSOS[0];
    return HttpResponse.json({ ...curso, ...body, updated_at: new Date().toISOString() });
  }),

  http.delete(`${BASE}/courses/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Curso ${params.id} eliminado correctamente` });
  }),

  http.get(`${BASE}/courses/:id`, ({ params }) => {
    const curso = MOCK_CURSOS.find((c) => c.id === params.id) ?? MOCK_CURSOS[0];
    return HttpResponse.json(curso);
  }),

  // ── Módulos ────────────────────────────────────────────────────────────────

  http.patch(`${BASE}/modules/:moduleId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, module: { id: params.moduleId, sessions_count: 0, total_duration: 0, created_at: new Date().toISOString(), ...body } });
  }),

  http.delete(`${BASE}/modules/:moduleId`, ({ params }) => {
    return HttpResponse.json({ success: true, message: `Módulo ${params.moduleId} eliminado` });
  }),

  http.get(`${BASE}/modules/:moduleId/sessions`, ({ params }) => {
    const sessions = MOCK_SESSIONS[params.moduleId as string] ?? [];
    return HttpResponse.json(sessions);
  }),

  http.post(`${BASE}/modules/:moduleId/sessions`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newSession = { id: "s_new_" + Date.now(), module_id: params.moduleId, youtube_video_id: "", display_order: 99, materials_count: 0, created_at: new Date().toISOString(), ...body };
    return HttpResponse.json({ success: true, session: newSession }, { status: 201 });
  }),

  // ── Sesiones ───────────────────────────────────────────────────────────────

  http.patch(`${BASE}/sessions/:sessionId`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ success: true, session: { id: params.sessionId, youtube_video_id: "", display_order: 1, materials_count: 0, created_at: new Date().toISOString(), ...body } });
  }),

  http.delete(`${BASE}/sessions/:sessionId`, ({ params }) => {
    return HttpResponse.json({ success: true, message: `Sesión ${params.sessionId} eliminada` });
  }),

  http.get(`${BASE}/sessions/:sessionId/materials`, ({ params }) => {
    const materials = MOCK_MATERIALS[params.sessionId as string] ?? [];
    return HttpResponse.json(materials);
  }),

  http.post(`${BASE}/sessions/:sessionId/materials`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newMaterial = { id: "mat_new_" + Date.now(), session_id: params.sessionId, created_at: new Date().toISOString(), ...body };
    return HttpResponse.json({ success: true, material: newMaterial }, { status: 201 });
  }),

  // ── Materiales ─────────────────────────────────────────────────────────────

  http.delete(`${BASE}/materials/:materialId`, ({ params }) => {
    return HttpResponse.json({ success: true, message: `Material ${params.materialId} eliminado` });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // CATEGORIES — rutas específicas primero
  // ══════════════════════════════════════════════════════════════════════════════

  http.patch(`${BASE}/categories/reorder`, async ({ request }) => {
    const body = await request.json() as { ids: string[] };
    return HttpResponse.json({ message: "Categorías reordenadas", ids: body.ids });
  }),

  http.get(`${BASE}/categories`, () => {
    return HttpResponse.json(MOCK_CATEGORIAS);
  }),

  http.post(`${BASE}/categories`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "cat_new_" + Date.now(), display_order: MOCK_CATEGORIAS.length + 1, created_at: new Date().toISOString(), ...body }, { status: 201 });
  }),

  http.get(`${BASE}/categories/:id`, ({ params }) => {
    const cat = MOCK_CATEGORIAS.find((c) => c.id === params.id) ?? MOCK_CATEGORIAS[0];
    return HttpResponse.json(cat);
  }),

  http.patch(`${BASE}/categories/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const cat = MOCK_CATEGORIAS.find((c) => c.id === params.id) ?? MOCK_CATEGORIAS[0];
    return HttpResponse.json({ ...cat, ...body });
  }),

  http.delete(`${BASE}/categories/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Categoría ${params.id} eliminada` });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // CART — rutas específicas primero
  // ══════════════════════════════════════════════════════════════════════════════

  http.post(`${BASE}/cart/merge`, async ({ request }) => {
    const body = await request.json() as { session_token: string };
    return HttpResponse.json({ success: true, item_count: MOCK_CART_ITEMS.length, session_token: body.session_token });
  }),

  http.get(`${BASE}/cart`, () => {
    const subtotal = MOCK_CART_ITEMS.reduce((sum, item) => {
      const course = item.course as { price: number; discount_price?: number };
      return sum + (course.discount_price ?? course.price);
    }, 0);
    return HttpResponse.json({ items: MOCK_CART_ITEMS, subtotal, item_count: MOCK_CART_ITEMS.length });
  }),

  http.post(`${BASE}/cart`, async ({ request }) => {
    const body = await request.json() as { course_id: string };
    const course = MOCK_CURSOS.find((c) => c.id === body.course_id);
    if (!course) return HttpResponse.json({ message: "Curso no encontrado" }, { status: 404 });
    const existing = MOCK_CART_ITEMS.find((i) => (i.course as { id: string }).id === body.course_id);
    if (existing) return HttpResponse.json({ message: "El curso ya está en el carrito" }, { status: 409 });
    const newItem = { id: "ci_" + Date.now(), course: { id: course.id, title: course.title, slug: course.slug, thumbnail_url: course.thumbnail_url, price: course.price, discount_price: course.discount_price, currency: course.currency } };
    MOCK_CART_ITEMS.push(newItem);
    return HttpResponse.json({ success: true, cart_item: { id: newItem.id, course_id: body.course_id }, item_count: MOCK_CART_ITEMS.length });
  }),

  http.delete(`${BASE}/cart/:itemId`, ({ params }) => {
    const before = MOCK_CART_ITEMS.length;
    MOCK_CART_ITEMS = MOCK_CART_ITEMS.filter((i) => i.id !== params.itemId);
    if (MOCK_CART_ITEMS.length === before) return HttpResponse.json({ message: "Item no encontrado" }, { status: 404 });
    return HttpResponse.json({ success: true, item_count: MOCK_CART_ITEMS.length });
  }),

  http.delete(`${BASE}/cart`, () => {
    MOCK_CART_ITEMS = [];
    return HttpResponse.json({ success: true, message: "Carrito vaciado" });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // ENROLLMENTS (panel admin)
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/enrollments`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const curso_id = url.searchParams.get("curso_id");
    let results = [...MOCK_ENROLLMENTS];
    if (curso_id) results = results.filter((e) => e.course_id === curso_id);
    if (search) results = results.filter((e) => e.user.email.toLowerCase().includes(search) || `${e.user.first_name} ${e.user.last_name}`.toLowerCase().includes(search));
    const total = results.length;
    return HttpResponse.json({ data: results.slice((page - 1) * limit, page * limit), total, page, limit, total_pages: Math.ceil(total / limit) });
  }),

  http.post(`${BASE}/enrollments`, async ({ request }) => {
    const body = await request.json() as { user_id: string; course_ids: string[]; offline_payment_method: string };
    const newEnrollments = body.course_ids.map((cid) => ({
      id: "enr_new_" + Date.now() + "_" + cid,
      user_id: body.user_id,
      course_id: cid,
      enrollment_type: "manual",
      offline_payment_method: body.offline_payment_method,
      progress_percent: 0,
      completed_at: null,
      enrolled_at: new Date().toISOString(),
    }));
    return HttpResponse.json(newEnrollments, { status: 201 });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // STUDENT (rutas en inglés)
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/student/enrollments`, () => {
    const myEnrollments = MOCK_ENROLLMENTS.filter((e) => e.user_id === "u1");
    return HttpResponse.json(myEnrollments);
  }),

  http.get(`${BASE}/student/courses/:courseId/content`, ({ params }) => {
    const content = MOCK_COURSE_CONTENT[params.courseId as string] ?? MOCK_COURSE_CONTENT["c1"];
    return HttpResponse.json(content);
  }),

  http.get(`${BASE}/student/progress/courses/:courseId`, ({ params }) => {
    const progress = MOCK_PROGRESS_BY_COURSE[params.courseId as string] ?? {
      enrollment: { id: "enr_unknown", progress_percent: 0, completed_at: null },
      lesson_progress: [],
      has_review: false,
    };
    return HttpResponse.json(progress);
  }),

  http.put(`${BASE}/student/progress/sessions/:sessionId`, async ({ params, request }) => {
    const body = await request.json() as { watched_seconds: number };
    let durationMinutes = 45;
    for (const courseData of Object.values(MOCK_COURSE_CONTENT)) {
      const c = courseData as { modules: Array<{ sessions: Array<{ id: string; duration_minutes: number }> }> };
      for (const mod of c.modules) {
        const sess = mod.sessions.find((s) => s.id === params.sessionId);
        if (sess) { durationMinutes = sess.duration_minutes; break; }
      }
    }
    const completed = body.watched_seconds >= durationMinutes * 60 * 0.9;
    return HttpResponse.json({ completed, progress_percent: completed ? 80 : 65 });
  }),

  http.get(`${BASE}/student/certificates`, () => {
    return HttpResponse.json({ data: MOCK_CERTIFICATES_SUMMARY });
  }),

  http.get(`${BASE}/student/certificates/:enrollmentId`, ({ params }) => {
    const cert = MOCK_CERTIFICATES_DETAIL[params.enrollmentId as string];
    if (!cert) return HttpResponse.json({ message: "Certificado no disponible" }, { status: 404 });
    return HttpResponse.json(cert);
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // REVIEWS
  // ══════════════════════════════════════════════════════════════════════════════

  http.post(`${BASE}/reviews`, async ({ request }) => {
    const body = await request.json() as { enrollment_id: string; rating: number; comment: string };
    return HttpResponse.json({ id: "rev_" + Date.now(), ...body, status: "approved", created_at: new Date().toISOString(), certificate_available: true }, { status: 201 });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // PERFIL (/usuarios/me)
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/usuarios/me`, ({ request }) => {
    const email = decodeJwtEmail(request);
    const user = MOCK_USERS.find((u) => u.email === email) ?? MOCK_USERS[0];
    return HttpResponse.json(user);
  }),

  http.patch(`${BASE}/usuarios/me`, async ({ request }) => {
    const body = await request.json() as Record<string, string>;
    const email = decodeJwtEmail(request);
    const user = MOCK_USERS.find((u) => u.email === email) ?? MOCK_USERS[0];
    return HttpResponse.json({ ...user, ...body, updated_at: new Date().toISOString() });
  }),

  http.patch(`${BASE}/usuarios/me/password`, async ({ request }) => {
    const body = await request.json() as { current_password: string };
    if (body.current_password === "wrong") {
      return HttpResponse.json({ message: "Contraseña actual incorrecta" }, { status: 400 });
    }
    return HttpResponse.json({ message: "Contraseña actualizada correctamente" });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // USERS (admin) — rutas específicas primero
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/users/buscar`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const role = url.searchParams.get("role");
    let results = MOCK_USERS.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    if (role) results = results.filter((u) => u.role === role);
    return HttpResponse.json(results.map((u) => ({ id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.email })));
  }),

  http.get(`${BASE}/admin/usuarios`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const search = url.searchParams.get("search")?.toLowerCase() ?? "";
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");
    let results = [...MOCK_USERS];
    if (search) results = results.filter((u) => `${u.first_name} ${u.last_name}`.toLowerCase().includes(search) || u.email.toLowerCase().includes(search));
    if (role) results = results.filter((u) => u.role === role);
    if (status) results = results.filter((u) => u.status === status);
    const total = results.length;
    return HttpResponse.json({ data: results.slice((page - 1) * limit, page * limit), total, page, limit, total_pages: Math.ceil(total / limit) });
  }),

  http.post(`${BASE}/users`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    const newUser = { id: "u_new_" + Date.now(), status: "active", email_verified: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body };
    return HttpResponse.json(newUser, { status: 201 });
  }),

  http.patch(`${BASE}/users/:id/suspender`, ({ params }) => {
    return HttpResponse.json({ message: `Usuario ${params.id} suspendido` });
  }),

  http.patch(`${BASE}/users/:id/activar`, ({ params }) => {
    return HttpResponse.json({ message: `Usuario ${params.id} activado` });
  }),

  http.get(`${BASE}/users/:id`, ({ params }) => {
    const user = MOCK_USERS.find((u) => u.id === params.id) ?? MOCK_USERS[0];
    return HttpResponse.json(user);
  }),

  http.patch(`${BASE}/users/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const user = MOCK_USERS.find((u) => u.id === params.id) ?? MOCK_USERS[0];
    return HttpResponse.json({ ...user, ...body, updated_at: new Date().toISOString() });
  }),

  http.delete(`${BASE}/users/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Usuario ${params.id} eliminado` });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // ADMIN DASHBOARD
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/admin/stats`, () => {
    return HttpResponse.json({
      ingresos: { total_mes: 18450, total_mes_anterior: 16400, cambio_porcentual: 12.5, online: 14200, manual: 4250 },
      estudiantes: { total: 342, nuevos_mes: 28 },
      cursos: { total_activos: 12, nuevos_mes: 2 },
      tasa_finalizacion: 68,
    });
  }),

  http.get(`${BASE}/admin/charts/ingresos`, () => {
    return HttpResponse.json([
      { mes: "Ene", total: 12000, online: 9500, manual: 2500 },
      { mes: "Feb", total: 14500, online: 11000, manual: 3500 },
      { mes: "Mar", total: 16400, online: 12800, manual: 3600 },
      { mes: "Abr", total: 18450, online: 14200, manual: 4250 },
      { mes: "May", total: 17200, online: 13500, manual: 3700 },
      { mes: "Jun", total: 19800, online: 15600, manual: 4200 },
    ]);
  }),

  http.get(`${BASE}/admin/charts/top-cursos`, () => {
    return HttpResponse.json([
      { id: "c3", title: "Python para Análisis de Datos", enrolled_count: 95, revenue: 18905 },
      { id: "c4", title: "Marketing Digital Avanzado", enrolled_count: 67, revenue: 11993 },
      { id: "c1", title: "Derecho Laboral Avanzado", enrolled_count: 42, revenue: 12558 },
      { id: "c2", title: "Finanzas Corporativas", enrolled_count: 28, revenue: 5572 },
    ]);
  }),

  http.get(`${BASE}/admin/charts/categorias`, () => {
    return HttpResponse.json([
      { name: "Derecho", count: 5 },
      { name: "Finanzas", count: 3 },
      { name: "Tecnología", count: 2 },
      { name: "Marketing", count: 2 },
    ]);
  }),

  http.get(`${BASE}/admin/charts/estudiantes`, () => {
    return HttpResponse.json([
      { mes: "Ene", activos: 180, inactivos: 40 },
      { mes: "Feb", activos: 210, inactivos: 38 },
      { mes: "Mar", activos: 245, inactivos: 35 },
      { mes: "Abr", activos: 270, inactivos: 30 },
      { mes: "May", activos: 310, inactivos: 28 },
      { mes: "Jun", activos: 342, inactivos: 25 },
    ]);
  }),

  http.get(`${BASE}/admin/top-finalizacion`, () => {
    return HttpResponse.json([
      { id: "c3", title: "Python para Análisis de Datos", enrolled_count: 95, completion_rate: 82 },
      { id: "c1", title: "Derecho Laboral Avanzado", enrolled_count: 42, completion_rate: 71 },
      { id: "c4", title: "Marketing Digital Avanzado", enrolled_count: 67, completion_rate: 65 },
      { id: "c2", title: "Finanzas Corporativas", enrolled_count: 28, completion_rate: 58 },
    ]);
  }),

  http.get(`${BASE}/admin/top-estudiantes`, () => {
    return HttpResponse.json([
      { id: "u1", first_name: "María", last_name: "García", email: "maria@example.com", courses_count: 3, completed_count: 1, total_watched_hours: 47.2 },
      { id: "u2", first_name: "Carlos", last_name: "López", email: "carlos@example.com", courses_count: 1, completed_count: 0, total_watched_hours: 8.5 },
    ]);
  }),

  http.get(`${BASE}/admin/cursos/:cursoId/matriculados`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const enrolled = MOCK_ENROLLMENTS.filter((e) => e.course_id === params.cursoId);
    const data = enrolled.map((e) => ({
      enrollment_id: e.id,
      user: { id: e.user.id, first_name: e.user.first_name, last_name: e.user.last_name, email: e.user.email },
      enrolled_at: e.enrolled_at,
      progress_percent: e.progress_percent,
      last_accessed_at: e.last_accessed_at,
      status: e.completed_at ? "completado" : e.last_accessed_at ? "activo" : "inactivo",
      enrollment_type: e.enrollment_type,
    }));
    return HttpResponse.json({
      data: data.slice((page - 1) * limit, page * limit),
      total: data.length,
      total_pages: Math.ceil(data.length / limit),
      stats: { total: data.length, avg_progress: data.reduce((s, e) => s + e.progress_percent, 0) / (data.length || 1), activos_7_dias: data.length, tasa_finalizacion: Math.round(data.filter((e) => e.status === "completado").length / (data.length || 1) * 100) },
    });
  }),

  http.get(`${BASE}/admin/estudiantes/:userId/cursos/:courseId/actividad`, ({ params }) => {
    const user = MOCK_USERS.find((u) => u.id === params.userId) ?? MOCK_USERS[0];
    const enrollment = MOCK_ENROLLMENTS.find((e) => e.user_id === params.userId && e.course_id === params.courseId) ?? MOCK_ENROLLMENTS[0];
    const course = MOCK_CURSOS.find((c) => c.id === params.courseId) ?? MOCK_CURSOS[0];
    const progress = MOCK_PROGRESS_BY_COURSE[params.courseId as string];
    const sessions: object[] = progress?.lesson_progress.map((lp) => {
      const p = lp as { session_id: string; watched_seconds: number; completed: boolean; last_watched_at: string };
      return {
        module_title: "Módulo 1",
        session_title: p.session_id,
        duration_minutes: 45,
        watched_seconds: p.watched_seconds,
        percent_watched: Math.round((p.watched_seconds / (45 * 60)) * 100),
        completed: p.completed,
        last_watched_at: p.last_watched_at,
      };
    }) ?? [];
    return HttpResponse.json({
      enrollment: { enrolled_at: enrollment.enrolled_at, progress_percent: enrollment.progress_percent, last_accessed_at: enrollment.last_accessed_at, completed_at: enrollment.completed_at, total_watched_seconds: enrollment.total_watched_seconds },
      user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email },
      course: { id: course.id, title: course.title },
      sessions,
      activity_by_day: [
        { date: "2024-03-10", hours: 0.75 },
        { date: "2024-03-12", hours: 0.63 },
        { date: "2024-03-14", hours: 0.25 },
      ],
    });
  }),

  http.get(`${BASE}/admin/auditoria`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const logs = [
      { id: "a1", created_at: "2024-03-15T09:32:00Z", user: { first_name: "Ana", last_name: "Torres", email: "ana@example.com" }, action: "update", entity_type: "Course", entity_id: "c1", changes: { title: { before: "Derecho Básico", after: "Derecho Laboral Avanzado" } } },
      { id: "a2", created_at: "2024-03-14T14:15:00Z", user: { first_name: "Ana", last_name: "Torres", email: "ana@example.com" }, action: "create", entity_type: "Category", entity_id: "cat3", changes: { name: "Tecnología" } },
      { id: "a3", created_at: "2024-03-13T10:00:00Z", user: { first_name: "Admin", last_name: "Global", email: "admin@escuelaglobal.com" }, action: "create", entity_type: "User", entity_id: "u4", changes: { email: "luis@example.com", role: "marketing" } },
      { id: "a4", created_at: "2024-03-12T16:45:00Z", user: { first_name: "Admin", last_name: "Global", email: "admin@escuelaglobal.com" }, action: "delete", entity_type: "Enrollment", entity_id: "enr_old", changes: {} },
    ];
    return HttpResponse.json({ data: logs.slice((page - 1) * limit, page * limit), total: logs.length });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // MARKETING
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/promociones`, () => HttpResponse.json(MOCK_PROMOCIONES)),

  http.post(`${BASE}/promociones`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "p_new_" + Date.now(), display_order: MOCK_PROMOCIONES.length + 1, created_at: new Date().toISOString(), ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/promociones/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const promo = MOCK_PROMOCIONES.find((p) => p.id === params.id) ?? MOCK_PROMOCIONES[0];
    return HttpResponse.json({ ...promo, ...body });
  }),

  http.delete(`${BASE}/promociones/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Promoción ${params.id} eliminada` });
  }),

  http.get(`${BASE}/sliders`, () => {
    return HttpResponse.json(MOCK_SLIDERS);
  }),

  http.post(`${BASE}/sliders`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "sl_new_" + Date.now(), display_order: MOCK_SLIDERS.length + 1, courses: [], created_at: new Date().toISOString(), ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/sliders/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const slider = MOCK_SLIDERS.find((s) => s.id === params.id) ?? MOCK_SLIDERS[0];
    return HttpResponse.json({ ...slider, ...body });
  }),

  http.delete(`${BASE}/sliders/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Slider ${params.id} eliminado` });
  }),

  // ══════════════════════════════════════════════════════════════════════════════
  // LEGACY — rutas en español mantenidas por compatibilidad
  // ══════════════════════════════════════════════════════════════════════════════

  http.get(`${BASE}/cursos`, ({ request }) => {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    return HttpResponse.json({ data: MOCK_CURSOS, total: MOCK_CURSOS.length, page: Number(params.page) || 1, limit: Number(params.limit) || 10, totalPages: 1 });
  }),

  http.get(`${BASE}/cursos/:id`, ({ params }) => {
    const curso = MOCK_CURSOS.find((c) => c.id === params.id) ?? MOCK_CURSOS[0];
    return HttpResponse.json(curso);
  }),

  http.get(`${BASE}/cursos/:id/contenido`, ({ params }) => {
    const content = MOCK_COURSE_CONTENT[params.id as string] ?? MOCK_COURSE_CONTENT["c1"];
    return HttpResponse.json(content);
  }),

  http.get(`${BASE}/mi-progreso/cursos/:courseId`, ({ params }) => {
    const progress = MOCK_PROGRESS_BY_COURSE[params.courseId as string] ?? { enrollment: { id: "enr_unknown", progress_percent: 0, completed_at: null }, lesson_progress: [], has_review: false };
    return HttpResponse.json(progress);
  }),

  http.put(`${BASE}/mi-progreso/sesiones/:sessionId`, async ({ params, request }) => {
    const body = await request.json() as { watched_seconds: number };
    let durationMinutes = 45;
    for (const courseData of Object.values(MOCK_COURSE_CONTENT)) {
      const c = courseData as { modules: Array<{ sessions: Array<{ id: string; duration_minutes: number }> }> };
      for (const mod of c.modules) {
        const sess = mod.sessions.find((s) => s.id === params.sessionId);
        if (sess) { durationMinutes = sess.duration_minutes; break; }
      }
    }
    const completed = body.watched_seconds >= durationMinutes * 60 * 0.9;
    return HttpResponse.json({ completed, progress_percent: completed ? 80 : 65 });
  }),

  http.get(`${BASE}/cursos/:id/matriculados`, ({ params, request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    const enrolled = MOCK_ENROLLMENTS.filter((e) => e.course_id === params.id);
    return HttpResponse.json({ data: enrolled.slice((page - 1) * limit, page * limit), total: enrolled.length, page, limit, totalPages: Math.ceil(enrolled.length / limit) });
  }),

  http.get(`${BASE}/categorias`, () => HttpResponse.json(MOCK_CATEGORIAS)),

  http.post(`${BASE}/categorias`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "cat_new_" + Date.now(), display_order: MOCK_CATEGORIAS.length + 1, created_at: new Date().toISOString(), ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/categorias/:id`, async ({ params, request }) => {
    const body = await request.json() as Record<string, unknown>;
    const cat = MOCK_CATEGORIAS.find((c) => c.id === params.id) ?? MOCK_CATEGORIAS[0];
    return HttpResponse.json({ ...cat, ...body });
  }),

  http.delete(`${BASE}/categorias/:id`, ({ params }) => {
    return HttpResponse.json({ message: `Categoría ${params.id} eliminada` });
  }),

  http.get(`${BASE}/usuarios`, ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page")) || 1;
    const limit = Number(url.searchParams.get("limit")) || 10;
    return HttpResponse.json({ data: MOCK_USERS, total: MOCK_USERS.length, page, limit, totalPages: 1 });
  }),

  http.get(`${BASE}/usuarios/buscar`, ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").toLowerCase();
    const results = MOCK_USERS.filter((u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    return HttpResponse.json(results);
  }),

  http.post(`${BASE}/usuarios`, async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: "u_new_" + Date.now(), status: "active", email_verified: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...body }, { status: 201 });
  }),

  http.patch(`${BASE}/usuarios/:id/suspender`, ({ params }) => HttpResponse.json({ message: `Usuario ${params.id} suspendido` })),
  http.patch(`${BASE}/usuarios/:id/activar`, ({ params }) => HttpResponse.json({ message: `Usuario ${params.id} activado` })),

  http.get(`${BASE}/estudiantes/mis-inscripciones`, () => {
    return HttpResponse.json(MOCK_ENROLLMENTS.filter((e) => e.user_id === "u1"));
  }),

  http.post(`${BASE}/matriculaciones`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ message: "Matriculación creada", ...body as object }, { status: 201 });
  }),
];
