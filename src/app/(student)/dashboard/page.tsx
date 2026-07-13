"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { studentService } from "@/lib/services/student";
import {
  BookOpen, Clock, Award, ChevronRight, PlayCircle,
  User, GraduationCap, HeadphonesIcon, Star,
} from "lucide-react";
import Link from "next/link";
import type { Enrollment } from "@/types";

type Tab = "progreso" | "completados" | "sin-iniciar";

function useMyEnrollments() {
  return useQuery({
    queryKey: ["mis-inscripciones"],
    queryFn: studentService.getMyEnrollments,
  });
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: serverEnrollments = [], isLoading } = useMyEnrollments();
  const [tab, setTab] = useState<Tab>("progreso");
  // 🚀 Estado para capturar las compras de la simulación
  const [demoEnrollments, setDemoEnrollments] = useState<Enrollment[]>([]);

  // Cargamos los cursos comprados en la demo al montar el componente
  useEffect(() => {
    const stored = localStorage.getItem("demo_enrollments");
    if (stored) {
      setDemoEnrollments(JSON.parse(stored));
    }
  }, []);

  const firstName = user?.first_name ?? "Estudiante";

  // 🚀 ESCUDO HÍBRIDO: Combinamos inscripciones del servidor con las de la demo (evitando duplicados)
  const enrollments = [...serverEnrollments];
  demoEnrollments.forEach((demoE) => {
    if (!enrollments.some((servE) => servE.course_id === demoE.course_id)) {
      enrollments.push(demoE);
    }
  });

  // Los filtros existentes ahora procesarán la lista combinada automáticamente 💎
  const enProgreso   = enrollments.filter((e) => !e.completed_at && e.progress_percent > 0);
  const completados  = enrollments.filter((e) => !!e.completed_at);
  const sinIniciar   = enrollments.filter((e) => !e.completed_at && e.progress_percent === 0);

  const progresoPromedio = enrollments.length
    ? Math.round(enrollments.reduce((a, e) => a + e.progress_percent, 0) / enrollments.length)
    : 0;

  const totalWatchedSec = enrollments.reduce((a, e) => a + (e.total_watched_seconds ?? 0), 0);
  const horasEstudio = (totalWatchedSec / 3600).toFixed(1);

  const cursoReciente = enProgreso.sort(
    (a, b) => new Date(b.last_accessed_at ?? 0).getTime() - new Date(a.last_accessed_at ?? 0).getTime()
  )[0];

  const tabList: { key: Tab; label: string; count: number }[] = [
    { key: "progreso",    label: "En progreso",  count: enProgreso.length },
    { key: "completados", label: "Completados",  count: completados.length },
    { key: "sin-iniciar", label: "Sin iniciar",  count: sinIniciar.length },
  ];

  const tabData: Record<Tab, Enrollment[]> = {
    progreso:    enProgreso,
    completados: completados,
    "sin-iniciar": sinIniciar,
  };

  return (
    <div className="space-y-8">
      {/* Bienvenida */}
      <div>
        <h1 className="text-2xl font-bold text-brand-primary">Hola, {firstName}</h1>
        <p className="text-gray-500 mt-1">Aquí tienes un resumen de tu aprendizaje.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} className="text-[#084D95]" />}
          label="En progreso"
          value={isLoading ? "—" : enProgreso.length}
          bg="bg-blue-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-[#23AFE5]" />}
          label="Progreso prom."
          value={isLoading ? "—" : `${progresoPromedio}%`}
          bg="bg-cyan-50"
        />
        <StatCard
          icon={<Award size={20} className="text-emerald-600" />}
          label="Completados"
          value={isLoading ? "—" : completados.length}
          bg="bg-emerald-50"
        />
        <StatCard
          icon={<Clock size={20} className="text-violet-500" />}
          label="Horas de estudio"
          value={isLoading ? "—" : `${horasEstudio}h`}
          bg="bg-violet-50"
        />
      </div>

      {/* Continuar aprendiendo */}
      {!isLoading && cursoReciente?.course && (
        <section>
          <h2 className="text-base font-semibold text-brand-primary mb-3">Continuar aprendiendo</h2>
          <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
            <div className="w-20 h-14 rounded-lg bg-[#084D95]/10 flex items-center justify-center shrink-0 overflow-hidden">
              {cursoReciente.course.thumbnail_url
                ? <img src={cursoReciente.course.thumbnail_url} alt="" className="w-full h-full object-cover" />
                : <BookOpen size={24} className="text-[#084D95]" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{cursoReciente.course.title}</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full max-w-xs">
                  <div
                    className="h-1.5 bg-[#084D95] rounded-full transition-all"
                    style={{ width: `${cursoReciente.progress_percent}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 shrink-0">{cursoReciente.progress_percent}%</span>
              </div>
            </div>
            <Link
              href={`/curso/${cursoReciente.course_id}`}
              className="flex items-center gap-2 bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors shrink-0"
            >
              <PlayCircle size={16} />
              Continuar
            </Link>
          </div>
        </section>
      )}

      {/* Mis cursos con tabs */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-brand-primary">Mis cursos</h2>
          <Link href="/mis-cursos" className="text-sm text-[#084D95] hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {tabList.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === key
                  ? "border-[#084D95] text-[#084D95]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {label}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${tab === key ? "bg-[#084D95] text-white" : "bg-gray-100 text-gray-500"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 h-48 animate-pulse" />
            ))}
          </div>
        ) : tabData[tab].length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tabData[tab].slice(0, 6).map((enrollment) => (
              <CourseCard key={enrollment.id} enrollment={enrollment} />
            ))}
          </div>
        )}
      </section>

      {/* Accesos rápidos */}
      <section>
        <h2 className="text-base font-semibold text-brand-primary mb-3">Accesos rápidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <QuickLink
            href="/perfil"
            icon={<User size={20} className="text-[#084D95]" />}
            label="Mi perfil"
            description="Editar datos personales"
            bg="bg-blue-50"
          />
          <QuickLink
            href="/mis-cursos?tab=completados"
            icon={<GraduationCap size={20} className="text-emerald-600" />}
            label="Mis certificados"
            description="Ver y descargar certificados"
            bg="bg-emerald-50"
          />
          <QuickLink
            href="mailto:soporte@escuelaglobal.com"
            icon={<HeadphonesIcon size={20} className="text-violet-500" />}
            label="Soporte"
            description="soporte@escuelaglobal.com"
            bg="bg-violet-50"
          />
        </div>
      </section>
    </div>
  );
}

// ... Los subcomponentes StatCard, QuickLink, CourseCard y EmptyState se mantienen exactamente igual abajo ...
function StatCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, description, bg }: { href: string; icon: React.ReactNode; label: string; description: string; bg: string }) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-gray-900 text-sm">{label}</p>
        <p className="text-xs text-gray-400 truncate">{description}</p>
      </div>
    </Link>
  );
}

function CourseCard({ enrollment }: { enrollment: Enrollment }) {
  const course = enrollment.course;
  if (!course) return null;

  const isCompleted = !!enrollment.completed_at;
  const needsReview = isCompleted && !enrollment.has_review;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="h-28 bg-[#084D95]/10 flex items-center justify-center overflow-hidden relative">
        {course.thumbnail_url
          ? <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
          : <BookOpen size={32} className="text-[#084D95]/40" />
        }
        {needsReview && (
          <div className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star size={10} />
            Reseña pendiente
          </div>
        )}
        {isCompleted && !needsReview && (
          <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            Completado
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{course.title}</p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-[#084D95] rounded-full"
              style={{ width: `${enrollment.progress_percent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 shrink-0">{enrollment.progress_percent}%</span>
        </div>
        {needsReview ? (
          <Link
            href={`/curso/${enrollment.course_id}`}
            className="mt-3 block text-center text-sm font-medium text-amber-600 border border-amber-400 rounded-lg py-1.5 hover:bg-amber-50 transition-colors"
          >
            Dejar reseña
          </Link>
        ) : (
          <Link
            href={`/curso/${enrollment.course_id}`}
            className="mt-3 block text-center text-sm font-medium text-[#084D95] border border-[#084D95] rounded-lg py-1.5 hover:bg-[#084D95] hover:text-white transition-colors"
          >
            {isCompleted ? "Revisar" : enrollment.progress_percent === 0 ? "Empezar" : "Continuar"}
          </Link>
        )}
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; desc: string }> = {
    progreso:      { title: "No tienes cursos en progreso", desc: "Empieza un curso del catálogo." },
    completados:   { title: "Aún no completaste ningún curso", desc: "Sigue avanzando en tus cursos activos." },
    "sin-iniciar": { title: "No tienes cursos sin iniciar", desc: "¡Excelente! Ya has empezado todos tus cursos." },
  };
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-300 py-14 text-center">
      <BookOpen size={36} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 font-medium">{messages[tab].title}</p>
      <p className="text-gray-400 text-sm mt-1">{messages[tab].desc}</p>
      {tab !== "completados" && (
        <Link
          href="/cursos"
          className="inline-block mt-4 bg-[#084D95] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          Explorar catálogo
        </Link>
      )}
    </div>
  );
}