# 🎓 Escuela Global — Plataforma LMS

> **Sistema de Gestión de Aprendizaje (LMS)**
> Programas de Alta Especialización Online — [especializacionesglobal.net](https://especializacionesglobal.net)

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Equipo](#-equipo)
- [Arquitectura](#-arquitectura)
- [Roles del Sistema](#1-roles-del-sistema)
- [Módulo: Gestión de Usuarios](#2-módulo-gestión-de-usuarios)
- [Módulo: Catálogo de Cursos](#3-módulo-catálogo-de-cursos)
- [Módulo: Gestión de Cursos (Soporte)](#4-módulo-gestión-de-cursos-soporte)
- [Módulo: Estructura de Contenido](#5-módulo-estructura-de-contenido)
- [Módulo: Área del Estudiante](#6-módulo-área-del-estudiante)
- [Módulo: Compras y Matriculación](#7-módulo-compras-y-matriculación)
- [Módulo: Certificados y Reseñas](#8-módulo-certificados-y-reseñas)
- [Módulo: Marketing y Promociones](#9-módulo-marketing-y-promociones)
- [Módulo: Dashboard Administrativo](#10-módulo-dashboard-administrativo)
- [Módulo: Notificaciones](#11-módulo-notificaciones)
- [Resumen de Priorización](#12-resumen-de-priorización)
- [Notas Técnicas Importantes](#13-notas-técnicas-importantes)
- [Modelo de Datos — Entidades y Atributos](#14-modelo-de-datos--entidades-y-atributos)
- [Modelo de Datos — Relaciones](#15-modelo-de-datos--relaciones)

---

## 🛠 Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | v22.22.2 |
| Frontend | Next.js | v22.16.0 |
| Backend | Nest.js | v22.20.0 |
| Base de datos | PostgreSQL | — |
| ORM | Prisma | — |
| Arquitectura | Modular | — |

---

## 👥 Equipo

| Rol | Integrantes |
|-----|-------------|
| **Backend** | Ferdinand, Jhon Esau |
| **Frontend** | Cristian, Brayan |

---

## 🏗 Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                 │
│   Visitante │ Estudiante │ Soporte │ Marketing │ Admin│
└──────────────────────┬───────────────────────────────┘
                       │ REST API (JWT)
┌──────────────────────▼───────────────────────────────┐
│                    BACKEND (Nest.js)                  │
│  Auth │ Courses │ Enrollments │ Payments │ Certs │ …  │
└──────┬──────────┬────────────┬───────────┬───────────┘
       │          │            │           │
  PostgreSQL    AWS S3     Stripe/     YouTube
   (Prisma)   (archivos)   NIUBIZ    Player API
                          (pagos)    (videos)
```

---

## 1. Roles del Sistema

### 1.0 Usuario Visitante
- Navegar por las páginas públicas (catálogo, landing pages)

### 1.1 Estudiante
- Navegar catálogo de cursos
- Comprar cursos online
- Acceder a cursos matriculados
- Ver sesiones (videos de YouTube)
- Descargar materiales
- Dejar reseñas
- Descargar certificados

### 1.2 Soporte
- Crear/editar/eliminar categorías
- Crear/editar/eliminar cursos
- Cargar módulos y sesiones
- Subir materiales (links a Drive)
- Crear usuarios
- Matricular estudiantes manualmente
- Gestionar plantillas de certificados
- Soporte técnico a estudiantes

### 1.3 Marketing
- Administrar publicaciones del index (imágenes)
- Gestionar sliders de cursos destacados
- Crear promociones visuales

### 1.4 Administrador
- **Todos los permisos de Soporte + Marketing**
- Ver dashboard con métricas avanzadas
- Crear usuarios con rol: admin, soporte, marketing
- Acceso completo al sistema

---

## 2. Módulo: Gestión de Usuarios

### RF-001: Registro de Estudiante
- **Prioridad:** MUST HAVE
- **Actor:** Usuario no registrado

El sistema debe permitir el registro de nuevos estudiantes.

**Criterios de aceptación:**
- [ ] Formulario con campos: Nombre completo (obligatorio), Email (obligatorio, único), Teléfono (obligatorio), País (opcional), Contraseña (obligatorio, mínimo 8 caracteres), Confirmar contraseña
- [ ] Validación de email único en tiempo real
- [ ] Envío de email de verificación con link
- [ ] Activación de cuenta al hacer click en link (válido 24h)
- [ ] Redirección a dashboard tras verificación
- [ ] Rol asignado automáticamente: `estudiante`

---

### RF-002: Login de Usuario
- **Prioridad:** MUST HAVE
- **Actor:** Usuario registrado

Autenticación de usuarios con email y contraseña.

**Criterios de aceptación:**
- [ ] Formulario con: Email, Contraseña, Checkbox "Recordarme"
- [ ] Validación de credenciales
- [ ] Máximo 5 intentos fallidos → bloqueo temporal 15 minutos
- [ ] Si "Recordarme" está marcado → sesión 30 días, sino 24 horas
- [ ] Redirección según rol:
  - Estudiante → `/dashboard`
  - Soporte → `/soporte/cursos`
  - Marketing → `/marketing/publicaciones`
  - Admin → `/admin/dashboard`
- [ ] Link "Olvidé mi contraseña"
- [ ] Captcha

---

### RF-003: Recuperación de Contraseña
- **Prioridad:** MUST HAVE
- **Actor:** Usuario registrado

Reset de contraseña vía email.

**Criterios de aceptación:**
- [ ] Página `/recuperar-contraseña`
- [ ] Campo: Email
- [ ] Envío de email con link de reset (válido 1 hora)
- [ ] Página para establecer nueva contraseña
- [ ] Confirmación por email del cambio
- [ ] Token de un solo uso
- [ ] Captcha

---

### RF-004: Gestión de Perfil
- **Prioridad:** SHOULD HAVE
- **Actor:** Usuario autenticado

Edición de datos personales del usuario.

**Criterios de aceptación:**
- [ ] Página `/perfil`
- [ ] Campos editables: Nombre completo, Teléfono, País, Foto de perfil (upload)
- [ ] Sección "Cambiar contraseña": Contraseña actual, Nueva contraseña, Confirmar nueva contraseña, Requiere validación de contraseña actual
- [ ] Botón "Guardar cambios"
- [ ] Mensaje de confirmación

---

### RF-005: Creación de Usuarios (Soporte/Admin)
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

Panel para crear usuarios manualmente.

**Criterios de aceptación:**
- [ ] Formulario con campos: Nombre completo, Email, Teléfono, País, Rol (dropdown — Soporte: solo "estudiante"; Admin: todos los roles), Contraseña temporal
- [ ] Validación de email único
- [ ] Envío automático de email con credenciales de acceso y link para cambiar contraseña
- [ ] Listado de usuarios creados: Tabla con Nombre, Email, Rol, Fecha de creación, Estado; Filtros por rol y estado; Búsqueda por nombre/email; Acciones: Editar, Suspender, Eliminar

**Restricción:** Solo admin puede crear usuarios con rol `administrador`, `soporte`, `marketing`.

---

## 3. Módulo: Catálogo de Cursos

### RF-006: Listado de Cursos
- **Prioridad:** MUST HAVE
- **Actor:** Visitante, Usuario autenticado

Catálogo público de cursos con filtros.

**Criterios de aceptación:**
- [ ] Página `/cursos`
- [ ] Vista de grilla responsive: Desktop 3 columnas, Tablet 2, Móvil 1
- [ ] Tarjeta de curso muestra: Thumbnail, Título, Categoría, Precio (con precio tachado si hay descuento), Duración total en horas, Número de estudiantes matriculados, Calificación promedio (estrellas), Docente principal (nombre)
- [ ] Filtros en sidebar: Por categoría (checkboxes), Por rango de precio (slider), Por duración (< 10h, 10-30h, > 30h)
- [ ] Ordenamiento: Más populares, Mejor valorados, Más recientes, Precio asc/desc, Por categoría, Por software
- [ ] Paginación: 12 cursos por página
- [ ] URL persistente: `/cursos?categoria=economia&precio=0-100&orden=populares`

---

### RF-007: Buscador de Cursos
- **Prioridad:** MUST HAVE
- **Actor:** Visitante, Usuario autenticado

Búsqueda en tiempo real de cursos.

**Criterios de aceptación:**
- [ ] Barra de búsqueda en header (visible en todas las páginas)
- [ ] Búsqueda en: Título del curso, Descripción, Nombre del docente, Software
- [ ] Autocompletado desde 3 caracteres
- [ ] Resultados en dropdown con: Thumbnail pequeño, Título, Precio. Click redirige a página del curso
- [ ] Si hay más de 5 resultados → "Ver todos los resultados"
- [ ] Sin resultados → "No encontramos cursos. ¿Quieres ver todos?"

---

### RF-008: Ficha de Curso (Detalle)
- **Prioridad:** MUST HAVE
- **Actor:** Visitante, Usuario autenticado

Página completa de información de un curso.

**Criterios de aceptación:**
- [ ] URL amigable: `/cursos/[slug]`
- [ ] **Sección superior:** Título, Descripción corta (tagline), Categoría (link a filtro), Software, Precio actual y tachado, Botón "Comprar ahora" (sticky en scroll), Botón "Agregar al carrito", Calificación promedio, Número de matriculados
- [ ] **Sección "Acerca del curso":** Descripción completa, Duración total, Número de módulos y sesiones, Requisitos previos (lista), Lo que aprenderás (lista de outcomes)
- [ ] **Sección "Docentes":** Card por docente con Nombre, Profesión/Título, Descripción breve
- [ ] **Sección "Contenido del curso" (Syllabus):** Lista de módulos expandibles (acordeón), Al expandir → lista de sesiones con nombre, duración, ícono de video. Total de sesiones visible
- [ ] **Sección "Reseñas de estudiantes":** Últimas 5 reseñas con nombre, foto, calificación, comentario, fecha. Botón "Ver todas las reseñas" si hay más de 5
- [ ] **Sidebar (sticky):** Thumbnail, Precio, Botones de compra, Info rápida: Duración, Módulos, Sesiones, Nivel, Acceso

---

### RF-009: Gestión de Categorías (Soporte/Admin)
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

CRUD de categorías para organizar cursos.

**Criterios de aceptación:**
- [ ] Página `/soporte/categorias`
- [ ] Listado: Tabla con Nombre, Slug, Ícono, Número de cursos, Acciones
- [ ] Botón "Nueva categoría"
- [ ] Formulario: Nombre (obligatorio), Slug (auto-generado, editable), Ícono (selector predefinido), Color (color picker), Descripción
- [ ] Validación de slug único
- [ ] Eliminar categoría: Solo si no tiene cursos asignados, con confirmación
- [ ] Reordenamiento drag-and-drop

---

## 4. Módulo: Gestión de Cursos (Soporte)

### RF-010: Crear Curso
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

Formulario para dar de alta un nuevo curso.

**Criterios de aceptación:**
- [ ] Página `/soporte/cursos/nuevo`
- [ ] Formulario con pasos/tabs:

**Tab 1 — Información básica:** Título (obligatorio), Slug (auto-generado, editable), Descripción corta (max 150 chars), Descripción completa (WYSIWYG), Categoría (dropdown), Nivel (principiante/intermedio/avanzado), Thumbnail (upload, max 2MB), Softwares

**Tab 2 — Pricing:** Precio (obligatorio), Precio de descuento (opcional), Moneda (USD/PEN), Duración del acceso (1 año / de por vida)

**Tab 3 — Docentes:** Listado de docentes (puede haber varios), Botón "Agregar docente". Por cada docente: Nombre completo (obligatorio), Profesión/Título (obligatorio), Descripción, Foto (opcional), Botón "Eliminar docente"

**Tab 4 — Contenido:** Requisitos previos (lista editable), Lo que aprenderás (lista de outcomes)

**Tab 5 — Configuración:** Estado: Borrador / Publicado / Archivado, Fecha de publicación, Botones "Guardar como borrador" y "Publicar curso"

**Validaciones:** Slug único, Al menos 1 docente, Precio > 0

---

### RF-011: Editar Curso
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

- [ ] Página `/soporte/cursos/[id]/editar`
- [ ] Formulario pre-llenado con datos actuales (misma estructura que RF-010)
- [ ] Cambios guardados con mensaje de confirmación
- [ ] Log de auditoría: Quién editó, Qué cambió, Cuándo

---

### RF-012: Eliminar Curso
- **Prioridad:** SHOULD HAVE
- **Actor:** Soporte, Administrador

Eliminación lógica de cursos.

- [ ] Botón "Eliminar" en listado de cursos con confirmación
- [ ] Si tiene estudiantes matriculados: Advertencia con opción de "Archivar en lugar de eliminar"
- [ ] Eliminación lógica (soft delete): campo `deleted_at`, curso no aparece en catálogo, matriculados mantienen acceso
- [ ] Solo admin puede eliminar permanentemente (hard delete)

---

### RF-013: Listado de Cursos (Soporte)
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

- [ ] Página `/soporte/cursos`
- [ ] Tabla: Thumbnail, Título, Categoría, Precio, Estudiantes matriculados, Estado (Borrador/Publicado/Archivado), Fecha de creación, Acciones (Editar/Ver/Eliminar/Gestionar contenido)
- [ ] Filtros: Por categoría, estado, rango de fechas, software
- [ ] Búsqueda por título, ordenamiento por columnas, paginación
- [ ] Botón destacado "Crear nuevo curso"

---

## 5. Módulo: Estructura de Contenido

### RF-014: Gestionar Módulos de Curso
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

CRUD de módulos dentro de un curso.

- [ ] Página `/soporte/cursos/[id]/contenido`
- [ ] Vista dividida: Sidebar izquierdo (listado de módulos) + Panel derecho (sesiones del módulo seleccionado)
- [ ] Formulario de módulo: Título (obligatorio), Descripción (opcional), Orden (auto-asignado)
- [ ] Listado con: Título, Número de sesiones, Duración total, Acciones (Editar, Eliminar, Subir/Bajar orden)
- [ ] Reordenamiento drag-and-drop
- [ ] Eliminar módulo: Solo si no tiene sesiones, o advertencia

---

### RF-015: Gestionar Sesiones de Módulo
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

CRUD de sesiones (videos) dentro de un módulo.

- [ ] Formulario de sesión: Título (obligatorio), Descripción (opcional), **URL del video de YouTube** (obligatorio, validación de formato `youtube.com/watch?v=` o `youtu.be/`, previsualización embebida), Duración en minutos (obligatorio), Orden (auto-asignado)
- [ ] Listado: Thumbnail de YouTube, Título, Duración, Orden, Acciones
- [ ] Reordenamiento drag-and-drop
- [ ] Eliminar sesión: Confirmación + se elimina el progreso de estudiantes en esa sesión

---

### RF-016: Gestionar Materiales de Sesión
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

Agregar links a materiales complementarios (PDFs en Drive).

- [ ] Dentro del formulario de sesión, sección "Materiales"
- [ ] Por cada material: Nombre (ej: "Presentación Clase 1.pdf"), **URL de Google Drive** (link compartido), Tipo (PDF/Excel/Word/Otro)
- [ ] Validación: URL debe ser de `drive.google.com`

> **Nota:** No se suben archivos, solo se guardan links a Drive. El soporte debe subir previamente el archivo a Drive y compartirlo.

---

## 6. Módulo: Área del Estudiante

### RF-017: Dashboard del Estudiante
- **Prioridad:** MUST HAVE
- **Actor:** Estudiante

Panel principal del estudiante al hacer login.

- [ ] Página `/dashboard`
- [ ] **Sección "Mis cursos":** Grid de cursos matriculados, cada uno con Thumbnail, Título, Barra de progreso (%), Última sesión vista, Botón "Continuar". Tabs: "En progreso", "Completados", "No iniciados"
- [ ] **Sección "Estadísticas personales":** Total matriculados, Cursos completados, Horas de estudio acumuladas
- [ ] **Accesos rápidos:** Mi perfil, Mis certificados, Soporte

---

### RF-018: Visualización de Curso (Estudiante)
- **Prioridad:** MUST HAVE
- **Actor:** Estudiante matriculado

Interfaz para consumir el contenido del curso.

- [ ] Página `/curso/[id]` — Solo accesible si estudiante está matriculado
- [ ] **Columna izquierda (70%):** Reproductor de YouTube embebido (iframe responsive), Botones "Siguiente sesión" y "Sesión anterior", Título y descripción de la sesión, Materiales con botón "Abrir" (abre link de Drive en nueva pestaña)
- [ ] **Columna derecha (30% — Sidebar):** Acordeón con módulos, lista de sesiones con estado (✅ Completada, ▶️ Viendo ahora, ⭕ No iniciada), Click en sesión carga el video, Progreso general (barra %), Sesiones completadas / total

---

### RF-019: Tracking de Progreso de Sesiones
- **Prioridad:** MUST HAVE
- **Actor:** Sistema

Sistema automático de seguimiento de progreso.

- [ ] Al cargar sesión: Primera vez → marca como "iniciada"; Ya vista → recupera último timestamp
- [ ] **Tracking cada 30 segundos:** JavaScript captura tiempo del video de YouTube → `PUT /api/progress/session/[id]` con `watched_seconds`
- [ ] **Auto-completado:** Si `watched_seconds >= (duration_minutes * 60 * 0.9)` (90% del video) → marca `completed = true`, recalcula progreso del curso
- [ ] **Cálculo:** `progress_percent = (sesiones_completadas / total_sesiones) * 100`
- [ ] Al completar última sesión → `progress_percent = 100%` → habilita opción de reseña

> **Notas técnicas:** Usar YouTube Player API. Guardar `watched_seconds` incluso si el usuario cierra la página. RESPETAR LÍMITES DE API (tiene costos si se sobrepasa).

---

### RF-020: Navegación entre Sesiones
- **Prioridad:** MUST HAVE
- **Actor:** Estudiante

- [ ] **"Siguiente sesión":** Carga siguiente sesión del módulo actual → Si última del módulo → primera del siguiente → Si última del curso → mensaje "¡Completaste el curso!"
- [ ] **"Sesión anterior":** Inverso. Si es primera del curso → botón deshabilitado
- [ ] Click en sesión del sidebar carga el video inmediatamente
- [ ] Al terminar un video: Mensaje flotante "¿Continuar con la siguiente sesión?" + auto-avance en 5 segundos

---

## 7. Módulo: Compras y Matriculación

### RF-021: Carrito de Compra
- **Prioridad:** MUST HAVE
- **Actor:** Visitante, Usuario autenticado

- [ ] Ícono de carrito en header con contador
- [ ] Dropdown: Lista de cursos, Precio, Subtotal, Botón "Eliminar", Botón "Ir al carrito", Botón "Proceder al pago"
- [ ] Página `/carrito`: Tabla con Thumbnail, Título, Precio, Botón eliminar. Subtotal, "Vaciar carrito", "Continuar comprando", "Proceder al pago"
- [ ] **Persistencia:** Logueado → carrito en BD; Invitado → localStorage (7 días); Al login → merge de carritos

---

### RF-022: Checkout y Pago Online
- **Prioridad:** MUST HAVE
- **Actor:** Usuario autenticado

Proceso de compra con pasarela de pagos.

- [ ] Página `/checkout` — Requiere login previo
- [ ] **Sección 1 — Resumen del pedido:** Lista de cursos, Precio por curso, Subtotal, Total a pagar
- [ ] **Sección 2 — Datos de facturación:** Nombre (pre-llenado), Email (pre-llenado), País (pre-llenado), DNI/RUC (opcional)
- [ ] **Sección 3 — Método de pago:** Tabs: Tarjeta (Stripe) — Internacional, Tarjeta local (NIUBIZ) — Perú. Formulario de tarjeta (iframe de pasarela). Checkbox "Guardar tarjeta"
- [ ] **Procesamiento:** Valida datos → Procesa pago → Si exitoso: crea `orders`, crea `enrollments`, genera factura PDF, envía email, redirige a `/pedido/confirmacion/[order_id]` → Si falla: mensaje de error, permite reintentar

---

### RF-023: Confirmación de Compra
- **Prioridad:** MUST HAVE
- **Actor:** Estudiante

- [ ] Página `/pedido/confirmacion/[order_id]`
- [ ] Mensaje de éxito con número de orden
- [ ] Detalle: Cursos comprados, Total pagado, Método de pago
- [ ] Botón "Descargar factura" (PDF)
- [ ] Lista de cursos comprados con botón "Ir al curso"
- [ ] Email de confirmación ya enviado automáticamente

---

### RF-024: Matriculación Manual (Soporte)
- **Prioridad:** MUST HAVE
- **Actor:** Soporte, Administrador

Activar curso para estudiante sin pago online.

- [ ] Página `/soporte/matriculaciones`
- [ ] Formulario: Buscar estudiante (email/nombre, autocompletado, "Crear estudiante" si no existe), Seleccionar curso(s) (dropdown múltiple), Método de pago offline (transferencia/efectivo/cortesía/otro), Monto pagado (si aplica), Notas internas
- [ ] Al matricular: Crea `enrollment` (NO crea `order`), Envía email al estudiante con link de acceso
- [ ] Historial de matriculaciones: Tabla con Estudiante, Curso, Método, Fecha, Usuario que matriculó

**Restricción:** Solo se puede matricular a estudiantes ya registrados.

---

## 8. Módulo: Certificados y Reseñas

### RF-025: Dejar Reseña (OBLIGATORIO para certificado)
- **Prioridad:** MUST HAVE
- **Actor:** Estudiante

Sistema de reseñas obligatorias post-finalización.

- [ ] Cuando `progress_percent = 100%`: Banner en página del curso y badge "Pendiente de reseña" en dashboard
- [ ] Modal/Página de reseña: Calificación 1-5 estrellas (obligatorio), Comentario (obligatorio, 50-500 chars con contador)
- [ ] Al enviar: Crea `review`, actualiza `avg_rating` y `review_count` del curso, **habilita certificado inmediatamente**, redirige a descarga

> **⚠️ Restricción crítica:** Sin reseña → **NO** se puede descargar certificado (nunca). Una reseña por estudiante por curso.

---

### RF-026: Generación Automática de Certificado
- **Prioridad:** MUST HAVE
- **Actor:** Sistema

Creación de certificado en PDF al dejar reseña.

- [ ] **Trigger:** Al crear registro en `reviews`
- [ ] Genera certificado con datos dinámicos: Nombre estudiante, Nombre curso, Fechas de inicio/finalización, Duración total, Código de verificación (UUID), Nombres de docentes
- [ ] Diseño: Logo, Firma digital, QR code con link a verificador, Diseño según plantilla activa
- [ ] Sube PDF a S3 → Envía email con certificado adjunto
- [ ] Página de descarga: `/certificado/[enrollment_id]` con vista previa y link para compartir

---

### RF-027: Verificación Pública de Certificados
- **Prioridad:** MUST HAVE
- **Actor:** Cualquier persona (público)

- [ ] Página pública `/verificar/[uuid]`
- [ ] Si existe: ✅ Certificado válido con datos (Estudiante, Curso, Fecha, Horas) + Botón descargar
- [ ] Si NO existe: ❌ "El código ingresado no corresponde a ningún certificado válido"

> Accesible sin login. Para que empleadores/universidades validen autenticidad.

---

### RF-028: Gestión de Plantillas de Certificados (Soporte)
- **Prioridad:** SHOULD HAVE
- **Actor:** Soporte, Administrador

- [ ] Página `/soporte/certificados/plantillas`
- [ ] Listado de plantillas con: Thumbnail, Nombre, Estado (Activa/Inactiva), Fecha, Acciones
- [ ] Formulario: Nombre, Upload de diseño base (PNG 3508x2480px), Configuración de posiciones (X,Y) para cada campo, Fuente, Tamaño por campo
- [ ] Solo UNA plantilla puede estar "Activa". Al activar → desactiva las demás

---

### RF-029: Listado de Reseñas del Curso
- **Prioridad:** SHOULD HAVE
- **Actor:** Visitante, Usuario autenticado

- [ ] Página `/cursos/[slug]/resenas`
- [ ] Filtros: Por calificación, Ordenar por recientes/mejor valoradas
- [ ] Lista con: Foto, Nombre, Calificación, Comentario, Fecha
- [ ] Paginación (10 por página)
- [ ] Resumen en header: Calificación promedio, Distribución de estrellas (gráfico de barras), Total de reseñas

---

## 9. Módulo: Marketing y Promociones

### RF-030: Gestión de Publicaciones del Index
- **Prioridad:** MUST HAVE
- **Actor:** Marketing, Administrador

CRUD de imágenes promocionales en homepage.

- [ ] Página `/marketing/publicaciones`
- [ ] Formulario: Título (interno), Upload imagen (JPG/PNG, max 5MB, 1920x600px), Link de destino (URL externa o curso del catálogo), Posición/orden, Estado (Activa/Inactiva), Fechas de inicio/fin (auto-desactiva)
- [ ] Vista previa antes de publicar
- [ ] Reordenamiento drag-and-drop
- [ ] En homepage: Grid de imágenes clickeables que redirigen al link configurado

---

### RF-031: Gestión de Sliders del Index
- **Prioridad:** MUST HAVE
- **Actor:** Marketing, Administrador

Carrusel de cursos destacados en homepage.

- [ ] Página `/marketing/sliders`
- [ ] **Tipo 1 — Slider de cursos:** Título, Seleccionar hasta 10 cursos, Orden de aparición
- [ ] **Tipo 2 — Banner personalizado:** Upload de imagen, Link de destino
- [ ] Estado (Activo/Inactivo), Posición en la página (Superior/Medio/Inferior)
- [ ] En homepage: Carrusel tipo swiper, navegación con flechas, autoplay 5s, responsive

---

## 10. Módulo: Dashboard Administrativo

### RF-032: Dashboard Principal (Admin)
- **Prioridad:** MUST HAVE
- **Actor:** Administrador

Panel con métricas clave del negocio.

- [ ] Página `/admin/dashboard`
- [ ] **KPIs principales:** Ingresos totales (mes actual vs anterior, % cambio, **diferenciando venta manual vs online**), Estudiantes registrados (total + nuevos este mes), Cursos activos (total + nuevos), Tasa de finalización promedio (% + tendencia)
- [ ] **Gráficos:** Ingresos por mes (líneas, últimos 12 meses), Cursos más vendidos (barras horizontales, top 10), Distribución por categoría (pie/donut), Estudiantes activos vs inactivos (barras apiladas)
- [ ] **Tablas:** Cursos con mayor tasa de finalización (top 10), Estudiantes más activos (top 10)
- [ ] **Filtros globales:** Rango de fechas, Por categoría

---

### RF-033: Reporte de Matriculados por Curso
- **Prioridad:** MUST HAVE
- **Actor:** Administrador

- [ ] Página `/admin/cursos/[id]/matriculados`
- [ ] Tabla: Nombre, Email, Fecha matriculación, Progreso (%), Última actividad, Estado (Activo/Completado/Inactivo), Método de pago (Online/Manual)
- [ ] Filtros: Por estado, progreso, método de pago
- [ ] Búsqueda por nombre/email
- [ ] **Export a Excel/CSV**
- [ ] Estadísticas: Total matriculados, Promedio progreso, Activos últimos 7 días, Tasa de finalización

---

### RF-034: Actividad de Estudiante en Curso
- **Prioridad:** SHOULD HAVE
- **Actor:** Administrador

- [ ] Página `/admin/estudiantes/[user_id]/cursos/[course_id]`
- [ ] Info general: Fecha matriculación, Progreso total, Última actividad, Tiempo total de estudio
- [ ] Tabla de sesiones: Módulo, Sesión, Duración, Tiempo visto, % visto, Estado, Última vez vista
- [ ] Gráfico de actividad: Línea de tiempo con días activos y horas por día

---

## 11. Módulo: Notificaciones

### RF-035: Notificaciones por Email
- **Prioridad:** MUST HAVE
- **Actor:** Sistema

Emails transaccionales automáticos:

1. **Bienvenida** — Al registrarse
2. **Confirmación de email** — Link de verificación (válido 24h)
3. **Recuperación de contraseña** — Link de reset (válido 1h)
4. **Confirmación de compra** — Número de orden, cursos, total, factura PDF adjunta
5. **Matriculación manual** — Nombre del curso + link de acceso directo
6. **Certificado disponible** — Certificado PDF adjunto, link de descarga, código de verificación
7. **Recordatorio de inactividad** — Si compró curso y no registra avances en 7 días

**Criterios de aceptación:**
- [ ] Diseño responsive de emails (HTML)
- [ ] Plantillas con logo y colores de marca
- [ ] Variables dinámicas (nombre, curso, etc.)
- [ ] Link de unsubscribe (preferencias)
- [ ] Tracking de apertura (opcional)

---

### RF-036: Centro de Notificaciones (In-app)
- **Prioridad:** SHOULD HAVE
- **Actor:** Usuario autenticado

- [ ] Ícono de campana en header con badge de no leídas
- [ ] Dropdown: Últimas 5 notificaciones con título, descripción, tiempo relativo, estado leída/no leída
- [ ] Página `/notificaciones`: Lista completa, Tabs: Todas / No leídas, Click marca como leída + redirige, "Marcar todas como leídas"
- [ ] Tipos: Nuevo curso disponible, Curso completado, Recordatorio, Actualización de curso

---

### RF-037: Preferencias de Notificaciones
- **Prioridad:** COULD HAVE
- **Actor:** Usuario autenticado

- [ ] Página `/perfil/notificaciones`
- [ ] Tipos con toggles: Bienvenida (obligatorio), Confirmación compra (obligatorio), Certificado (obligatorio), Novedades y promociones (opcional), Recordatorios de cursos (opcional), Notificaciones in-app (opcional)
- [ ] Opción "Desactivar todas las no obligatorias"

---

## 12. Resumen de Priorización

### FASE 1 — MVP (MUST HAVE)

| Área | Requisitos |
|------|-----------|
| **Usuarios** | RF-001 Registro, RF-002 Login, RF-003 Recuperación contraseña, RF-005 Creación usuarios |
| **Cursos** | RF-006 Listado, RF-007 Buscador, RF-008 Ficha, RF-009 Categorías, RF-010 Crear, RF-011 Editar, RF-013 Listado soporte |
| **Contenido** | RF-014 Módulos, RF-015 Sesiones, RF-016 Materiales |
| **Estudiante** | RF-017 Dashboard, RF-018 Visualización, RF-019 Tracking, RF-020 Navegación |
| **Compras** | RF-021 Carrito, RF-022 Checkout, RF-023 Confirmación, RF-024 Matriculación manual |
| **Certificados** | RF-025 Reseña obligatoria, RF-026 Generación, RF-027 Verificación pública |
| **Marketing** | RF-030 Publicaciones, RF-031 Sliders |
| **Admin** | RF-032 Dashboard, RF-033 Reporte matriculados |
| **Notificaciones** | RF-035 Emails transaccionales |

### FASE 2 — POST-LAUNCH (SHOULD HAVE)

RF-004 Gestión de perfil, RF-012 Eliminar curso, RF-028 Plantillas certificados, RF-029 Listado reseñas, RF-034 Actividad estudiante, RF-036 Centro notificaciones in-app

### FASE 3 — FUTURO (COULD HAVE)

RF-037 Preferencias de notificaciones

---

## 13. Notas Técnicas Importantes

### Sobre Videos de YouTube
- **Embeber** videos usando iframe de YouTube
- **Tracking** con YouTube Player API
- **No descargar** videos a S3 (permanecen en YouTube)
- Capturar eventos: `onStateChange`, `onTimeUpdate`

### Sobre Materiales
- **No subir archivos** a la plataforma
- Solo guardar **links de Google Drive**
- Flujo del soporte: 1) Subir archivo a Drive → 2) Obtener link compartido → 3) Pegar link en la plataforma

### Sobre Roles
- **Estudiante:** Solo consume
- **Soporte:** Gestión completa de contenido
- **Marketing:** Solo promociones
- **Admin:** Todo lo anterior + métricas

### Sobre Certificados
- **Obligatorio** dejar reseña para descargar
- Sin reseña = No certificado (nunca se libera automáticamente)
- Una reseña por curso por estudiante

---

## 14. Modelo de Datos — Entidades y Atributos

### User `Core`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `full_name` | string | obligatorio |
| `email` | string | único, obligatorio |
| `phone` | string | obligatorio |
| `country` | string | opcional |
| `password_hash` | string | — |
| `role` | enum | `estudiante`, `soporte`, `marketing`, `admin` |
| `profile_photo_url` | string | nullable |
| `email_verified` | boolean | — |
| `email_verification_token` | string | nullable |
| `email_verified_at` | timestamp | nullable |
| `password_reset_token` | string | nullable |
| `password_reset_expires_at` | timestamp | nullable |
| `failed_login_attempts` | integer | default 0 |
| `locked_until` | timestamp | nullable |
| `status` | enum | `active`, `suspended`, `deleted` |
| `created_by` | UUID | **FK → User**, nullable |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |
| `deleted_at` | timestamp | nullable (soft delete) |

---

### Category `Core`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `name` | string | obligatorio |
| `slug` | string | único |
| `icon` | string | selector predefinido |
| `color` | string | hex |
| `description` | text | nullable |
| `display_order` | integer | — |
| `created_at` | timestamp | — |

---

### Course `Core`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `category_id` | UUID | **FK → Category** |
| `title` | string | obligatorio |
| `slug` | string | único |
| `tagline` | string | max 150 chars |
| `description` | text | WYSIWYG |
| `thumbnail_url` | string | — |
| `level` | enum | `principiante`, `intermedio`, `avanzado` |
| `software_tools` | string[] | array |
| `price` | decimal | > 0 |
| `discount_price` | decimal | nullable |
| `currency` | enum | `USD`, `PEN` |
| `access_duration` | enum | `1_year`, `lifetime` |
| `prerequisites` | string[] | array |
| `outcomes` | string[] | array |
| `status` | enum | `draft`, `published`, `archived` |
| `published_at` | timestamp | nullable |
| `avg_rating` | decimal | calculado |
| `review_count` | integer | calculado |
| `enrolled_count` | integer | calculado |
| `total_duration_minutes` | integer | calculado |
| `created_by` | UUID | **FK → User** |
| `created_at` | timestamp | — |
| `updated_at` | timestamp | — |
| `deleted_at` | timestamp | nullable (soft delete) |

---

### Instructor `Core`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `course_id` | UUID | **FK → Course** |
| `full_name` | string | obligatorio |
| `title` | string | Profesión/Título |
| `description` | text | — |
| `photo_url` | string | nullable |
| `display_order` | integer | — |

---

### Module `Contenido`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `course_id` | UUID | **FK → Course** |
| `title` | string | obligatorio |
| `description` | text | nullable |
| `display_order` | integer | auto-asignado |
| `created_at` | timestamp | — |

---

### Session `Contenido`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `module_id` | UUID | **FK → Module** |
| `title` | string | obligatorio |
| `description` | text | nullable |
| `youtube_url` | string | obligatorio |
| `youtube_video_id` | string | extraído automáticamente |
| `duration_minutes` | integer | obligatorio |
| `display_order` | integer | auto-asignado |
| `created_at` | timestamp | — |

---

### Material `Contenido`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `session_id` | UUID | **FK → Session** |
| `name` | string | obligatorio |
| `drive_url` | string | URL de drive.google.com |
| `type` | enum | `PDF`, `Excel`, `Word`, `Otro` |
| `created_at` | timestamp | — |

---

### Enrollment `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User** |
| `course_id` | UUID | **FK → Course** |
| `order_id` | UUID | **FK → Order**, nullable (matriculación manual) |
| `enrolled_at` | timestamp | — |
| `enrollment_type` | enum | `online`, `manual` |
| `offline_payment_method` | enum | `transferencia`, `efectivo`, `cortesia`, `otro` — nullable |
| `offline_amount` | decimal | nullable |
| `enrolled_by` | UUID | **FK → User**, nullable (soporte/admin que matriculó) |
| `internal_notes` | text | nullable |
| `progress_percent` | decimal | default 0 |
| `completed_at` | timestamp | nullable |
| `last_accessed_at` | timestamp | nullable |

---

### Order `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User** |
| `order_number` | string | único |
| `subtotal` | decimal | — |
| `total` | decimal | — |
| `currency` | enum | `USD`, `PEN` |
| `payment_method` | enum | `stripe`, `niubiz` |
| `payment_status` | enum | `pending`, `paid`, `failed`, `refunded` |
| `gateway_transaction_id` | string | nullable |
| `billing_name` | string | — |
| `billing_email` | string | — |
| `billing_country` | string | — |
| `billing_dni_ruc` | string | nullable |
| `invoice_pdf_url` | string | nullable |
| `created_at` | timestamp | — |

---

### OrderItem `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `order_id` | UUID | **FK → Order** |
| `course_id` | UUID | **FK → Course** |
| `unit_price` | decimal | precio al momento de compra |
| `discount_price` | decimal | nullable |
| `final_price` | decimal | — |

---

### CartItem `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User**, nullable (invitado) |
| `course_id` | UUID | **FK → Course** |
| `session_token` | string | nullable (invitado) |
| `added_at` | timestamp | — |
| `expires_at` | timestamp | nullable (7 días para invitado) |

---

### LessonProgress `Progreso`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `enrollment_id` | UUID | **FK → Enrollment** |
| `session_id` | UUID | **FK → Session** |
| `watched_seconds` | integer | default 0 |
| `completed` | boolean | default false |
| `completed_at` | timestamp | nullable |
| `last_watched_at` | timestamp | — |

---

### Review `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User** |
| `course_id` | UUID | **FK → Course** |
| `enrollment_id` | UUID | **FK → Enrollment** |
| `rating` | integer | 1–5 |
| `comment` | text | 50–500 chars |
| `status` | enum | `approved`, `hidden` |
| `created_at` | timestamp | — |

---

### Certificate `Transaccional`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `enrollment_id` | UUID | **FK → Enrollment** |
| `template_id` | UUID | **FK → CertificateTemplate** |
| `verification_code` | UUID | único |
| `pdf_url` | string | URL en S3 |
| `issued_at` | timestamp | — |

---

### CertificateTemplate `Config`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `name` | string | — |
| `background_image_url` | string | — |
| `student_name_position` | JSON | {x, y} |
| `course_name_position` | JSON | {x, y} |
| `dates_position` | JSON | {x, y} |
| `verification_code_position` | JSON | {x, y} |
| `qr_position` | JSON | {x, y} |
| `font_family` | string | — |
| `font_sizes` | JSON | por campo |
| `is_active` | boolean | solo una activa |
| `created_at` | timestamp | — |

---

### Notification `Config`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User** |
| `type` | enum | `nuevo_curso`, `completado`, `recordatorio`, `matriculacion`, `certificado` |
| `title` | string | — |
| `body` | text | — |
| `is_read` | boolean | default false |
| `redirect_url` | string | nullable |
| `created_at` | timestamp | — |

---

### Promotion `Marketing`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `title` | string | interno |
| `image_url` | string | — |
| `destination_url` | string | nullable |
| `destination_course_id` | UUID | **FK → Course**, nullable |
| `display_order` | integer | — |
| `status` | enum | `active`, `inactive` |
| `starts_at` | timestamp | nullable |
| `ends_at` | timestamp | nullable |
| `created_at` | timestamp | — |

---

### Slider `Marketing`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `title` | string | — |
| `type` | enum | `courses`, `banner` |
| `image_url` | string | nullable (tipo banner) |
| `destination_url` | string | nullable |
| `position_on_page` | enum | `top`, `middle`, `bottom` |
| `display_order` | integer | — |
| `status` | enum | `active`, `inactive` |
| `created_at` | timestamp | — |

---

### SliderCourse `Relación`

| Campo | Tipo | Notas |
|-------|------|-------|
| `slider_id` | UUID | **FK → Slider** |
| `course_id` | UUID | **FK → Course** |
| `display_order` | integer | — |

---

### AuditLog `Sistema`

| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | UUID | **PK** |
| `user_id` | UUID | **FK → User** |
| `entity_type` | string | ej: `"Course"` |
| `entity_id` | UUID | — |
| `action` | enum | `create`, `update`, `delete` |
| `changes` | JSON | before/after |
| `created_at` | timestamp | — |

---

## 15. Modelo de Datos — Relaciones

### Usuarios y Acceso

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| User | 1 — N | User | Soporte/Admin crea cuentas (`created_by` FK autorreferencial) |

### Estructura del Catálogo

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| Category | 1 — N | Course | Una categoría agrupa muchos cursos |
| Course | 1 — N | Instructor | Un curso es dictado por múltiples docentes (embebidos en el curso) |
| Course | 1 — N | Module | Un curso contiene múltiples módulos (ordenados por `display_order`) |
| Module | 1 — N | Session | Un módulo agrupa múltiples sesiones |
| Session | 1 — N | Material | Una sesión tiene materiales adjuntos (links a Google Drive) |
| User | 1 — N | Course | Auditoría: `created_by` FK del usuario soporte/admin que creó el curso |

### Compras y Matriculación

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| User | 1 — N | CartItem | Usuario agrega cursos al carrito (BD si logueado, `session_token` si invitado) |
| Course | 1 — N | CartItem | Un curso puede estar en múltiples carritos |
| User | 1 — N | Order | Un usuario realiza múltiples órdenes (solo autenticados, pago vía Stripe/NIUBIZ) |
| Order | 1 — N | OrderItem | Una orden contiene múltiples items (snapshot de precios al momento de compra) |
| Course | 1 — N | OrderItem | Un curso puede ser comprado en múltiples órdenes |
| User | N — M | Course | Un estudiante se matricula en muchos cursos y viceversa (tabla intermedia: **Enrollment**) |
| Order | 1 — N | Enrollment | Al pago exitoso se crean los enrollments. Matriculación manual NO genera Order |
| User (soporte) | 1 — N | Enrollment | `enrolled_by` FK: registra quién hizo la matriculación manual |

### Progreso del Estudiante

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| Enrollment | 1 — N | LessonProgress | Un registro por cada sesión que el estudiante inicia. Tracking cada 30s con YouTube API |
| Session | 1 — N | LessonProgress | Auto-completado al 90% del video |

### Certificados y Reseñas

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| Enrollment | 1 — 1 | Review | Solo una reseña por enrollment; obligatoria para obtener certificado |
| User | 1 — N | Review | Un estudiante puede tener reseñas en múltiples cursos |
| Course | 1 — N | Review | `avg_rating` y `review_count` se recalculan en Course |
| Review | 1 — 1 | Certificate | Al crearse la reseña se genera automáticamente el certificado PDF en S3 |
| Enrollment | 1 — 1 | Certificate | Cada enrollment tiene asignado un certificado |
| CertificateTemplate | 1 — N | Certificate | Solo una plantilla activa; todos los nuevos certificados usan la activa |

### Notificaciones, Marketing y Auditoría

| Entidad A | Cardinalidad | Entidad B | Descripción |
|-----------|:------------:|-----------|-------------|
| User | 1 — N | Notification | In-app y por email; recordatorio si no hay avances en 7 días |
| Slider | N — M | Course | Tabla intermedia: **SliderCourse**. Un slider tipo "cursos" puede incluir hasta 10 cursos |
| Promotion | N — 1 | Course | `destination_course_id` nullable; puede enlazar a URL externa en su lugar |
| User | 1 — N | AuditLog | Registra quién editó qué y cuándo en cursos y otras entidades críticas |

---

> **📄 Documento generado a partir del levantamiento de requisitos funcionales del proyecto Escuela Global LMS.**
