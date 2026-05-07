# API Endpoints – Plataforma de Cursos de Alta Especialización

> Generado desde Api_endpoints.xlsx · Hoja: API Endpoints  
> Última actualización: según archivo proporcionado

---

## Índice de Módulos

1. [Autenticación y Usuarios](#módulo-autenticación-y-usuarios-rf-001-a-rf-005)
2. [Catálogo de Cursos](#módulo-catálogo-de-cursos-rf-006-a-rf-008)
3. [Gestión de Categorías](#módulo-gestión-de-categorías-rf-009)
4. [Gestión de Cursos – Soporte](#módulo-gestión-de-cursos---soporte-rf-010-a-rf-013)
5. [Estructura de Contenido](#módulo-estructura-de-contenido-rf-014-a-rf-016)
6. [Área del Estudiante](#módulo-área-del-estudiante-rf-017-a-rf-020)
7. [Carrito y Compras](#módulo-carrito-y-compras-rf-021-a-rf-024)
8. [Certificados y Reseñas](#módulo-certificados-y-reseñas-rf-025-a-rf-029)
9. [Marketing y Promociones](#módulo-marketing-y-promociones-rf-030-rf-031)
10. [Dashboard Administrativo](#módulo-dashboard-administrativo-rf-032-a-rf-034)
11. [Notificaciones](#módulo-notificaciones-rf-035-a-rf-037)
12. [Endpoints Utilitarios](#módulo-endpoints-utilitarios)

---

## MÓDULO: AUTENTICACIÓN Y USUARIOS (RF-001 a RF-005)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 1 | POST | /api/auth/register | Registro de estudiante. Crea usuario con rol "estudiante", envía email de verificación con token válido 24h. | NO | `{fisrt_name, full_name, email, phone, country?, password, password_confirmation }` | `{ success, message: "Email de verificación enviado", user: { id, first_name, full_name, email, role } }` |
| 2 | POST | /api/auth/verify-email | Verifica email del estudiante al hacer click en link. Activa cuenta y redirige a dashboard. | NO | `{ token }` | `{ success, message: "Cuenta activada", access_token, user: { id, role } }` |
| 3 | POST | /api/auth/login | Login con email y contraseña. Máx 5 intentos → bloqueo 15 min. "Recordarme" = 30 días, sino 24h. | NO | `{ email, password, remember_me: boolean }` | `{ access_token, refresh_token, expires_in, user: { id, first_name, full_name, email, role, profile_photo_url } }` |
| 4 | POST | /api/auth/logout | Cierra sesión del usuario, invalida el token actual. | SI | (vacío) | `{ success, message: "Sesión cerrada" }` |
| 5 | POST | /api/auth/refresh-token | Renueva access_token usando refresh_token. | NO | `{ refresh_token }` | `{ access_token, refresh_token, expires_in }` |
| 6 | POST | /api/auth/forgot-password | Envía email con link de reset (válido 1h). Token de un solo uso + Captcha. | NO | `{ email, captcha_token }` | `{ success, message: "Email de recuperación enviado" }` |
| 7 | POST | /api/auth/reset-password | Establece nueva contraseña con token de reset. Envía confirmación por email. | NO | `{ token, password, password_confirmation }` | `{ success, message: "Contraseña actualizada" }` |
| 8 | GET | /api/auth/check-email | Valida si email ya existe (registro en tiempo real). | NO | query: `?email=carlos@email.com` | `{ available: boolean }` |
| 9 | GET | /api/profile | Obtiene datos del perfil del usuario autenticado. | SI | (vacío) | `{ id, full_name, email, phone, country, profile_photo_url, role, created_at }` |
| 10 | PUT | /api/profile | Actualiza datos personales del perfil. | SI | `{ full_name, phone, country }` | `{ success, user: { id, full_name, phone, country, updated_at } }` |
| 11 | POST | /api/profile/photo | Sube foto de perfil (max 2MB, JPG/PNG). Multipart form. | SI | FormData: `{ photo: File }` | `{ success, profile_photo_url }` |
| 12 | PUT | /api/profile/password | Cambia contraseña. Requiere contraseña actual. | SI | `{ current_password, new_password, new_password_confirmation }` | `{ success, message: "Contraseña actualizada" }` |
| 13 | POST | /api/admin/users | Crea usuario manualmente (soporte/admin). Envía email con credenciales. | SI | `{ full_name, email, phone, country, role, temp_password }` | `{ success, user: { id, full_name, email, role, created_at } }` |
| 14 | GET | /api/admin/users | Listado de usuarios con filtros, búsqueda y paginación. | SI | query: `?role=estudiante&status=active&search=carlos&page=1&limit=20` | `{ data: [{ id, full_name, email, role, status, created_at }], total, page, limit }` |
| 15 | GET | /api/admin/users/:id | Detalle completo de un usuario específico. | SI | params: id (UUID) | `{ id, full_name, email, phone, country, role, status, profile_photo_url, created_at, created_by }` |
| 16 | PUT | /api/admin/users/:id | Edita datos de un usuario existente. | SI | `{ full_name, phone, country, role, status }` | `{ success, user: { id, full_name, role, status, updated_at } }` |
| 17 | PATCH | /api/admin/users/:id/suspend | Suspende un usuario (status → suspended). | SI | params: id (UUID) | `{ success, message: "Usuario suspendido" }` |
| 18 | DELETE | /api/admin/users/:id | Elimina usuario (soft delete). | SI | params: id (UUID) | `{ success, message: "Usuario eliminado" }` |

---

## MÓDULO: CATÁLOGO DE CURSOS (RF-006 a RF-008)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 19 | GET | /api/courses | Catálogo público con filtros, ordenamiento y paginación (12/pág). URL persistente. | NO | query: `?category=economia&price_min=0&price_max=500&duration=10-30&sort=popular&software=autocad&page=1&limit=12` | `{ data: [{ id, title, slug, tagline, thumbnail_url, category, price, discount_price, currency, total_duration_minutes, enrolled_count, avg_rating, instructors: [{ full_name }] }], total, page, limit, filters_applied }` |
| 20 | GET | /api/courses/search | Búsqueda en tiempo real (autocompletado desde 3 chars). Busca en título, descripción, docente, software. | NO | query: `?q=estadistica&limit=5` | `{ results: [{ id, title, slug, thumbnail_url, price, currency }], total_count }` |
| 21 | GET | /api/courses/:slug | Ficha completa de curso por slug. Incluye módulos, sesiones (solo nombres), docentes, reseñas. | NO | params: slug | `{ id, title, slug, tagline, description, category, level, software_tools, price, discount_price, currency, access_duration, prerequisites, outcomes, thumbnail_url, avg_rating, review_count, enrolled_count, total_duration_minutes, instructors: [...], modules: [{ title, sessions_count, duration_minutes, sessions: [{ title, duration_minutes }] }], reviews: [{ user_name, photo, rating, comment, date }] (últimas 5) }` |

---

## MÓDULO: GESTIÓN DE CATEGORÍAS (RF-009)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 22 | GET | /api/categories | Lista pública de todas las categorías (con conteo de cursos). | NO | (vacío) | `{ data: [{ id, name, slug, icon, color, description, course_count, display_order }] }` |
| 23 | POST | /api/soporte/categories | Crea nueva categoría. Slug auto-generado. Soporte/Admin. | SI | `{ name, slug?, icon, color, description }` | `{ success, category: { id, name, slug, icon, color, display_order } }` |
| 24 | PUT | /api/soporte/categories/:id | Edita categoría existente. Valida slug único. | SI | `{ name, slug, icon, color, description }` | `{ success, category: { id, name, slug, updated } }` |
| 25 | DELETE | /api/soporte/categories/:id | Elimina categoría. Solo si no tiene cursos asignados. | SI | params: id (UUID) | `{ success, message }` ó `{ error: "Categoría tiene X cursos asignados" }` |
| 26 | PUT | /api/soporte/categories/reorder | Reordena categorías (drag-and-drop). | SI | `{ order: [{ id, display_order }] }` | `{ success }` |

---

## MÓDULO: GESTIÓN DE CURSOS - SOPORTE (RF-010 a RF-013)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 27 | POST | /api/soporte/courses | Crea nuevo curso con tabs: info básica, pricing, docentes, contenido, config. Valida slug único, ≥1 docente, precio>0. | SI | `{ title, slug?, tagline, description, category_id, level, thumbnail (File), software_tools: [], price, discount_price?, currency, access_duration, instructors: [{ full_name, title, description, photo? }], prerequisites: [], outcomes: [], status: "draft"\|"published" }` | `{ success, course: { id, title, slug, status, created_at } }` |
| 28 | PUT | /api/soporte/courses/:id | Edita curso existente. Misma estructura que crear. Genera log de auditoría. | SI | (mismos campos que POST, los que cambian) | `{ success, course: { id, title, slug, status, updated_at } }` |
| 29 | DELETE | /api/soporte/courses/:id | Elimina curso (soft delete). Si tiene matriculados, advierte y ofrece archivar. | SI | params: id. query: `?force=true` | `{ success, message }` ó `{ warning: "Curso tiene X matriculados", enrolled_count, suggest: "archive" }` |
| 30 | GET | /api/soporte/courses | Listado admin de todos los cursos con filtros y paginación. | SI | query: `?category=&status=published&search=&software=&date_from=&date_to=&page=1&limit=20&sort=created_at:desc` | `{ data: [{ id, title, thumbnail_url, category_name, price, enrolled_count, status, created_at }], total, page }` |
| 31 | PATCH | /api/soporte/courses/:id/status | Cambia estado del curso (borrador/publicado/archivado). | SI | `{ status: "draft"\|"published"\|"archived", published_at? }` | `{ success, course: { id, status, published_at } }` |
| 32 | POST | /api/soporte/courses/:id/thumbnail | Sube/actualiza thumbnail del curso (max 2MB). | SI | FormData: `{ thumbnail: File }` | `{ success, thumbnail_url }` |

---

## MÓDULO: ESTRUCTURA DE CONTENIDO (RF-014 a RF-016)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 33 | GET | /api/soporte/courses/:courseId/modules | Lista módulos del curso con sesiones. Vista panel izquierdo. | SI | params: courseId | `{ data: [{ id, title, description, display_order, sessions_count, total_duration }] }` |
| 34 | POST | /api/soporte/courses/:courseId/modules | Crea módulo dentro de un curso. Orden auto-asignado. | SI | `{ title, description? }` | `{ success, module: { id, title, display_order } }` |
| 35 | PUT | /api/soporte/modules/:id | Edita módulo existente. | SI | `{ title, description }` | `{ success, module: { id, title, updated_at } }` |
| 36 | DELETE | /api/soporte/modules/:id | Elimina módulo. Advierte si tiene sesiones. | SI | params: id | `{ success }` ó `{ warning: "Módulo tiene X sesiones" }` |
| 37 | PUT | /api/soporte/courses/:courseId/modules/reorder | Reordena módulos (drag-and-drop). | SI | `{ order: [{ id, display_order }] }` | `{ success }` |
| 38 | GET | /api/soporte/modules/:moduleId/sessions | Lista sesiones de un módulo con thumbnail de YouTube. | SI | params: moduleId | `{ data: [{ id, title, description, youtube_url, youtube_video_id, duration_minutes, display_order, materials_count }] }` |
| 39 | POST | /api/soporte/modules/:moduleId/sessions | Crea sesión. Valida URL YouTube. Extrae video_id. Orden auto. | SI | `{ title, description?, youtube_url, duration_minutes }` | `{ success, session: { id, title, youtube_video_id, display_order } }` |
| 40 | PUT | /api/soporte/sessions/:id | Edita sesión existente. | SI | `{ title, description, youtube_url, duration_minutes }` | `{ success, session: { id, title, updated_at } }` |
| 41 | DELETE | /api/soporte/sessions/:id | Elimina sesión. Se elimina progreso de estudiantes. | SI | params: id | `{ success, message: "Sesión y progreso asociado eliminados" }` |
| 42 | PUT | /api/soporte/modules/:moduleId/sessions/reorder | Reordena sesiones dentro del módulo. | SI | `{ order: [{ id, display_order }] }` | `{ success }` |
| 43 | GET | /api/soporte/sessions/:sessionId/materials | Lista materiales de una sesión. | SI | params: sessionId | `{ data: [{ id, name, drive_url, type }] }` |
| 44 | POST | /api/soporte/sessions/:sessionId/materials | Agrega material (link Drive). Valida URL drive.google.com. | SI | `{ name, drive_url, type: "PDF"\|"Excel"\|"Word"\|"Otro" }` | `{ success, material: { id, name, drive_url, type } }` |
| 45 | PUT | /api/soporte/materials/:id | Edita material existente. | SI | `{ name, drive_url, type }` | `{ success, material: { id, name, updated_at } }` |
| 46 | DELETE | /api/soporte/materials/:id | Elimina material. | SI | params: id | `{ success }` |

---

## MÓDULO: ÁREA DEL ESTUDIANTE (RF-017 a RF-020)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 47 | GET | /api/student/dashboard | Dashboard del estudiante: cursos matriculados con progreso, estadísticas. | SI | query: `?tab=in_progress\|completed\|not_started` | `{ courses: [{ enrollment_id, course: { id, title, thumbnail_url }, progress_percent, last_session: { id, title }, last_accessed_at }], stats: { total_enrolled, completed, study_hours }, pending_reviews: [{ course_id, title }] }` |
| 48 | GET | /api/student/courses/:courseId | Vista completa del curso para el estudiante. Solo si matriculado. Módulos, sesiones con estado de progreso. | SI | params: courseId | `{ course: { id, title }, enrollment: { progress_percent, completed_at }, modules: [{ id, title, sessions: [{ id, title, duration_minutes, youtube_video_id, status: "completed"\|"in_progress"\|"not_started", watched_seconds, materials: [{ id, name, drive_url, type }] }] }], current_session_id, total_sessions, completed_sessions }` |
| 49 | GET | /api/student/courses/:courseId/sessions/:sessionId | Carga sesión específica: video, materiales, navegación prev/next. | SI | params: courseId, sessionId | `{ session: { id, title, description, youtube_video_id, duration_minutes, materials: [...] }, progress: { watched_seconds, completed }, navigation: { prev_session_id, next_session_id, is_first, is_last } }` |
| 50 | PUT | /api/student/progress/sessions/:sessionId | Tracking cada 30s. Envía watched_seconds. Auto-completa al 90%. Recalcula progreso curso. | SI | `{ watched_seconds: integer }` | `{ success, completed: boolean, course_progress_percent, course_completed: boolean }` |

---

## MÓDULO: CARRITO Y COMPRAS (RF-021 a RF-024)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 51 | GET | /api/cart | Obtiene items del carrito. Logueado: BD. Invitado: session_token. | NO | header: Authorization (opcional). query: `?session_token=abc` (invitado) | `{ items: [{ id, course: { id, title, thumbnail_url, price, discount_price, currency } }], subtotal, item_count }` |
| 52 | POST | /api/cart | Agrega curso al carrito. | NO | `{ course_id, session_token? (invitado) }` | `{ success, cart_item: { id, course_id }, item_count }` |
| 53 | DELETE | /api/cart/:itemId | Elimina curso del carrito. | NO | params: itemId | `{ success, item_count }` |
| 54 | DELETE | /api/cart | Vacía todo el carrito. | NO | (vacío o session_token) | `{ success, message: "Carrito vaciado" }` |
| 55 | POST | /api/cart/merge | Merge carrito invitado → BD al hacer login. | SI | `{ session_token }` | `{ success, item_count }` |
| 56 | POST | /api/checkout | Procesa compra completa. Valida datos, crea orden, procesa pago, crea enrollments, genera factura PDF. | SI | `{ billing: { name, email, country, dni_ruc? }, payment_method: "stripe"\|"niubiz", payment_token (del iframe), save_card?: boolean }` | `{ success, order: { id, order_number, total, currency, payment_status, invoice_pdf_url, courses: [{ id, title }] } }` |
| 57 | GET | /api/orders/:orderId | Detalle de orden post-compra (confirmación). | SI | params: orderId | `{ id, order_number, subtotal, total, currency, payment_method, payment_status, invoice_pdf_url, items: [{ course_id, title, unit_price, final_price }], created_at }` |
| 58 | GET | /api/orders/:orderId/invoice | Descarga factura PDF de la orden. | SI | params: orderId | Archivo PDF (Content-Type: application/pdf) |
| 59 | POST | /api/soporte/enrollments | Matriculación manual. No crea Order. Envía email al estudiante. | SI | `{ user_id, course_ids: [], offline_payment_method: "transferencia"\|"efectivo"\|"cortesia"\|"otro", offline_amount?, internal_notes? }` | `{ success, enrollments: [{ id, user_id, course_id, enrolled_at }], email_sent: true }` |
| 60 | GET | /api/soporte/enrollments | Historial de matriculaciones manuales. | SI | query: `?page=1&limit=20&search=` | `{ data: [{ id, student_name, student_email, course_title, offline_payment_method, enrolled_at, enrolled_by_name }], total }` |
| 61 | GET | /api/soporte/users/search | Busca estudiantes para matriculación (autocompletado). | SI | query: `?q=carlos&role=estudiante` | `{ results: [{ id, full_name, email }] }` |

---

## MÓDULO: CERTIFICADOS Y RESEÑAS (RF-025 a RF-029)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 62 | POST | /api/student/courses/:courseId/reviews | Deja reseña (obligatorio para certificado). 1-5 estrellas, 50-500 chars. Dispara generación de certificado. | SI | `{ rating: 1-5, comment: string (50-500 chars) }` | `{ success, review: { id, rating, comment }, certificate: { id, verification_code, pdf_url } }` |
| 63 | GET | /api/courses/:slug/reviews | Lista pública de reseñas del curso con filtros y paginación. | NO | query: `?rating=5&sort=recent\|best&page=1&limit=10` | `{ data: [{ user_name, profile_photo_url, rating, comment, created_at }], summary: { avg_rating, total, distribution: { 5: n, 4: n, 3: n, 2: n, 1: n } }, total, page }` |
| 64 | GET | /api/student/certificates | Lista certificados del estudiante autenticado. | SI | (vacío) | `{ data: [{ id, course_title, verification_code, pdf_url, issued_at }] }` |
| 65 | GET | /api/student/certificates/:enrollmentId | Descarga/vista previa certificado por enrollment. | SI | params: enrollmentId | `{ id, verification_code, pdf_url, course_title, student_name, issued_at, total_hours, instructors }` |
| 66 | GET | /api/verify/:uuid | Verificación pública de certificado (sin login). Para empleadores/universidades. | NO | params: uuid (verification_code) | `{ valid: true, student_name, course_title, issued_at, total_hours, pdf_url }` ó `{ valid: false, message: "Certificado no encontrado" }` |
| 67 | GET | /api/soporte/certificate-templates | Lista plantillas de certificados. Solo una activa. | SI | (vacío) | `{ data: [{ id, name, background_image_url, is_active, created_at }] }` |
| 68 | POST | /api/soporte/certificate-templates | Crea nueva plantilla con posiciones de campos. | SI | FormData: `{ name, background_image (File), student_name_position: JSON, course_name_position: JSON, dates_position: JSON, verification_code_position: JSON, qr_position: JSON, font_family, font_sizes: JSON }` | `{ success, template: { id, name, is_active } }` |
| 69 | PUT | /api/soporte/certificate-templates/:id | Edita plantilla existente. | SI | (mismos campos que POST) | `{ success, template: { id, name, updated_at } }` |
| 70 | PATCH | /api/soporte/certificate-templates/:id/activate | Activa plantilla → desactiva las demás. | SI | params: id | `{ success, message: "Plantilla activada" }` |
| 71 | DELETE | /api/soporte/certificate-templates/:id | Elimina plantilla (solo si no está activa). | SI | params: id | `{ success }` ó `{ error: "No se puede eliminar plantilla activa" }` |

---

## MÓDULO: MARKETING Y PROMOCIONES (RF-030, RF-031)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 72 | GET | /api/homepage/promotions | Lista pública de promociones activas para el index. | NO | (vacío) | `{ data: [{ id, image_url, destination_url, destination_course_slug, display_order }] }` |
| 73 | GET | /api/marketing/promotions | Lista admin de todas las publicaciones con estado. | SI | (vacío) | `{ data: [{ id, title, image_url, destination_url, display_order, status, starts_at, ends_at }] }` |
| 74 | POST | /api/marketing/promotions | Crea publicación promocional. Upload imagen 1920x600. | SI | FormData: `{ title, image (File), destination_url?, destination_course_id?, display_order, status, starts_at?, ends_at? }` | `{ success, promotion: { id, title, image_url, status } }` |
| 75 | PUT | /api/marketing/promotions/:id | Edita publicación existente. | SI | (mismos campos que POST) | `{ success, promotion: { id, title, updated_at } }` |
| 76 | DELETE | /api/marketing/promotions/:id | Elimina publicación. | SI | params: id | `{ success }` |
| 77 | PUT | /api/marketing/promotions/reorder | Reordena publicaciones (drag-and-drop). | SI | `{ order: [{ id, display_order }] }` | `{ success }` |
| 78 | GET | /api/homepage/sliders | Lista pública de sliders activos con cursos asociados. | NO | (vacío) | `{ data: [{ id, title, type, position_on_page, image_url?, destination_url?, courses?: [{ id, title, slug, thumbnail_url, price, avg_rating }] }] }` |
| 79 | GET | /api/marketing/sliders | Lista admin de todos los sliders. | SI | (vacío) | `{ data: [{ id, title, type, display_order, status, position_on_page }] }` |
| 80 | POST | /api/marketing/sliders | Crea slider (tipo cursos o banner). | SI | `{ title, type: "courses"\|"banner", course_ids?: [] (max 10), image_url? (banner), destination_url?, position_on_page, status }` | `{ success, slider: { id, title, type } }` |
| 81 | PUT | /api/marketing/sliders/:id | Edita slider existente. | SI | (mismos campos que POST) | `{ success, slider: { id, title, updated_at } }` |
| 82 | DELETE | /api/marketing/sliders/:id | Elimina slider. | SI | params: id | `{ success }` |

---

## MÓDULO: DASHBOARD ADMINISTRATIVO (RF-032 a RF-034)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 83 | GET | /api/admin/dashboard | KPIs principales: ingresos (manual vs online), estudiantes, cursos activos, tasa finalización. Gráficos. | SI | query: `?date_from=&date_to=&category_id=` | `{ kpis: { revenue: { total, month, prev_month, change_pct, online, manual }, students: { total, new_month, change_pct }, active_courses: { total, new_month }, completion_rate: { avg_pct, trend } }, charts: { revenue_monthly: [...], top_courses: [...], category_distribution: [...], active_vs_inactive: [...] }, tables: { top_completion: [...], top_students: [...] } }` |
| 84 | GET | /api/admin/courses/:id/enrollments | Reporte de matriculados por curso. Filtros por estado, progreso, pago. Export CSV. | SI | query: `?status=active&progress_min=0&progress_max=100&payment_method=online&search=&page=1&limit=20` | `{ course: { title, total_enrolled, avg_progress, active_7d, completion_rate }, data: [{ student_name, email, enrolled_at, progress_percent, last_activity, status, payment_method }], total }` |
| 85 | GET | /api/admin/courses/:id/enrollments/export | Exporta matriculados a CSV/Excel. | SI | query: `?format=csv\|xlsx` (+ mismos filtros) | Archivo CSV/XLSX (Content-Disposition: attachment) |
| 86 | GET | /api/admin/students/:userId/courses/:courseId | Actividad granular de un estudiante en un curso. Sesiones, tiempos, gráfico actividad. | SI | params: userId, courseId | `{ enrollment: { enrolled_at, progress_percent, last_activity, total_study_time }, sessions: [{ module_title, session_title, duration_minutes, watched_seconds, watch_pct, status, last_watched_at }], activity_chart: [{ date, hours }] }` |

---

## MÓDULO: NOTIFICACIONES (RF-035 a RF-037)

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 87 | GET | /api/notifications | Centro de notificaciones in-app. Tabs: todas / no leídas. | SI | query: `?read=false&page=1&limit=20` | `{ data: [{ id, type, title, body, is_read, redirect_url, created_at }], unread_count, total }` |
| 88 | PATCH | /api/notifications/:id/read | Marca notificación como leída. | SI | params: id | `{ success, unread_count }` |
| 89 | PATCH | /api/notifications/read-all | Marca todas las notificaciones como leídas. | SI | (vacío) | `{ success, updated_count }` |
| 90 | GET | /api/notifications/unread-count | Obtiene conteo de no leídas (para badge en header). | SI | (vacío) | `{ unread_count }` |
| 91 | GET | /api/profile/notification-preferences | Obtiene preferencias de notificaciones. | SI | (vacío) | `{ promotions: boolean, reminders: boolean, in_app: boolean }` |
| 92 | PUT | /api/profile/notification-preferences | Actualiza preferencias de notificaciones. | SI | `{ promotions: boolean, reminders: boolean, in_app: boolean }` | `{ success, preferences: { ... } }` |

---

## MÓDULO: ENDPOINTS UTILITARIOS

| # | Método | Endpoint / Ruta | Explicación de la Conexión | Token? | Parámetros / Body (Frontend envía) | Respuesta JSON (Backend devuelve) |
|---|--------|-----------------|----------------------------|--------|-----------------------------------|-----------------------------------|
| 93 | GET | /api/homepage | Datos completos del homepage: sliders, promociones, cursos destacados, categorías. | NO | (vacío) | `{ sliders: [...], promotions: [...], featured_courses: [...], categories: [...], stats: { students, courses, instructors, avg_rating } }` |
| 94 | POST | /api/upload/image | Upload genérico de imagen (thumbnails, fotos). Retorna URL de S3. | SI | FormData: `{ image: File, context: "course"\|"profile"\|"promotion"\|"template" }` | `{ success, url, filename }` |
| 95 | GET | /api/admin/audit-logs | Logs de auditoría (quién editó qué y cuándo). | SI | query: `?entity_type=Course&entity_id=&user_id=&page=1` | `{ data: [{ id, user_name, entity_type, entity_id, action, changes, created_at }], total }` |

---

## LEYENDA

| Método | Descripción |
|--------|-------------|
| GET | Obtener/consultar datos del servidor |
| POST | Crear nuevo recurso o ejecutar acción |
| PUT | Actualizar recurso completo |
| PATCH | Actualizar parcialmente un recurso |
| DELETE | Eliminar recurso |

| Token? | Descripción |
|--------|-------------|
| SI | Requiere header `Authorization: Bearer <access_token>` |
| NO | Endpoint público, no requiere autenticación |

| Convenciones | Significado |
|--------------|-------------|
| `:id`, `:slug`, `:uuid` | Parámetros dinámicos en la URL |
| `query: ?param=val` | Parámetros enviados como query string en la URL |
| `params: id` | Parámetro en la ruta de la URL |
| FormData | Envío multipart/form-data (para archivos) |
| `{ campo }` | JSON en el body de la petición (Content-Type: application/json) |

| Roles que acceden | Permisos |
|-------------------|----------|
| `/api/admin/*` | Solo rol: admin |
| `/api/soporte/*` | Roles: soporte, admin |
| `/api/marketing/*` | Roles: marketing, admin |
| `/api/student/*` | Rol: estudiante |
| `/api/*` | Público o según token |