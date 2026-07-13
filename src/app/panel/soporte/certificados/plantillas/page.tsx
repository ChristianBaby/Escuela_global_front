"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  certificateTemplatesService,
  type CreateCertificateTemplateDto,
} from "@/lib/services/certificates";
import { toast } from "sonner";
import {
  Upload,
  X,
  ImageIcon,
  CheckCircle2,
  Zap,
  Trash2,
  Pencil,
  Crosshair,
  Settings,
} from "lucide-react";
import type { CertificateTemplate, XYPosition } from "@/types";

// ── Dimensiones A4 apaisado @ 300 DPI ────────────────────────────────────────
const CERT_W = 3508;
const CERT_H = 2480;

const FONT_FAMILIES = [
  "Georgia",
  "Times New Roman",
  "Arial",
  "Helvetica",
  "Palatino",
  "Garamond",
  "Verdana",
  "Tahoma",
  "Book Antiqua",
];

type PositionKey = "student_name_position" | "qr_position";

type PageSide = "front" | "back";

const FRONT_FIELDS: {
  key: PositionKey;
  label: string;
  color: string;
  sizeKey?: string;
}[] = [
  {
    key: "student_name_position",
    label: "Nombre del estudiante",
    color: "#084D95",
    sizeKey: "student_name",
  },
];

const BACK_FIELDS: {
  key: PositionKey;
  label: string;
  color: string;
}[] = [{ key: "qr_position", label: "QR Code", color: "#805AD5" }];

interface FormState {
  name: string;
  student_name_position: XYPosition;
  qr_position: XYPosition;
  qr_size: number;
  font_family: string;
  font_sizes: {
    student_name: number;
  };
}

const EMPTY: FormState = {
  name: "",
  student_name_position: { x: 1754, y: 1300 },
  qr_position: { x: 1754, y: 1240 },
  qr_size: 300,
  font_family: "Georgia",
  font_sizes: { student_name: 200 },
};

type ApiError = { response?: { data?: { message?: string } } };
function errMsg(e: unknown) {
  return (e as ApiError)?.response?.data?.message ?? "Ocurrió un error";
}

// ── Image Uploader ────────────────────────────────────────────────────────────
function ImageUploader({
  preview,
  onChange,
  label = "Imagen de fondo",
  hint = "",
}: {
  preview: string;
  onChange: (file: File | null, localUrl: string) => void;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("La imagen no debe superar 10 MB");
      return;
    }
    onChange(file, URL.createObjectURL(file));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label}{" "}
        <span className="text-xs text-gray-400 font-normal">
          (PNG recomendado · 3508×2480 px · máx. 10 MB)
          {hint && ` — ${hint}`}
        </span>
      </label>

      {preview ? (
        <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
          <img
            src={preview}
            alt="Vista previa"
            className="w-full object-cover"
            style={{ aspectRatio: "3508/2480" }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-100"
            >
              <Upload size={12} /> Cambiar
            </button>
            <button
              type="button"
              onClick={() => onChange(null, "")}
              className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 hover:bg-red-600"
            >
              <X size={12} /> Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handle(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl cursor-pointer transition-all flex flex-col items-center justify-center gap-3 text-sm min-h-[100px] py-8
            ${dragging
              ? "border-[#084D95] bg-[#084D95]/5"
              : "border-gray-300 hover:border-[#084D95]/50 hover:bg-gray-50"
            }`}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
            <ImageIcon size={18} className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-600">Arrastra aquí o haz clic</p>
            <p className="text-xs text-gray-400 mt-0.5">PNG, JPG · máx. 10 MB</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Position Editor ───────────────────────────────────────────────────────────
function PositionEditor({
  form,
  backgroundPreview,
  backPreview,
  onChangePosition,
}: {
  form: FormState;
  backgroundPreview: string;
  backPreview: string;
  onChangePosition: (key: PositionKey, pos: XYPosition) => void;
}) {
  const [activeSide, setActiveSide] = useState<PageSide>("front");
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState(0);

  useEffect(() => {
    if (!previewRef.current) return;
    const ro = new ResizeObserver((entries) => {
      setPreviewWidth(entries[0].contentRect.width);
    });
    ro.observe(previewRef.current);
    return () => ro.disconnect();
  }, []);

  const fields = activeSide === "front" ? FRONT_FIELDS : BACK_FIELDS;
  const activeField: PositionKey =
    activeSide === "front" ? "student_name_position" : "qr_position";
  const activeDef = fields[0];
  const activePos = form[activeField];
  const currentPreview = activeSide === "front" ? backgroundPreview : backPreview;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width;
      const relY = (e.clientY - rect.top) / rect.height;
      onChangePosition(activeField, {
        x: Math.round(Math.max(0, Math.min(1, relX)) * CERT_W),
        y: Math.round(Math.max(0, Math.min(1, relY)) * CERT_H),
      });
    },
    [activeField, onChangePosition]
  );

  const scale = previewWidth > 0 ? previewWidth / CERT_W : 0;

  return (
    <div className="space-y-4">
      {/* Selector cara / contraportada */}
      <div className="flex gap-2">
        {(
          [
            { key: "front" as PageSide, label: "Cara (portada)" },
            { key: "back" as PageSide, label: "Contraportada" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveSide(key)}
            className={`text-xs px-4 py-2 rounded-lg border transition-all font-medium ${
              activeSide === key
                ? "bg-[#084D95] border-[#084D95] text-white"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Preview interactivo */}
      <div className="space-y-1">
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <Crosshair size={12} />
          Haz clic en la imagen para posicionar:{" "}
          <strong className="ml-1" style={{ color: activeDef.color }}>
            {activeDef.label}
          </strong>
        </p>
        <div
          ref={previewRef}
          className="relative w-full rounded-xl overflow-hidden border border-gray-200 cursor-crosshair select-none"
          style={{ aspectRatio: `${CERT_W}/${CERT_H}` }}
          onClick={handleClick}
        >
          {currentPreview ? (
            <img
              src={currentPreview}
              alt=""
              className="absolute inset-0 w-full h-full object-fill"
              draggable={false}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <p className="text-sm text-gray-400 text-center px-4">
                {activeSide === "front"
                  ? 'Sube la imagen de portada en la pestaña "Configuración"'
                  : 'Sube la imagen de contraportada en la pestaña "Configuración"'}
              </p>
            </div>
          )}

          {/* Marcadores */}
          {fields.map((f) => {
            const pos = form[f.key];
            const leftPct = `${(pos.x / CERT_W) * 100}%`;
            const topPct = `${(pos.y / CERT_H) * 100}%`;

            if (f.key === "student_name_position") {
              const fontSize =
                scale > 0
                  ? Math.max(6, form.font_sizes.student_name * scale)
                  : 12;
              return (
                <div
                  key={f.key}
                  style={{
                    position: "absolute",
                    left: leftPct,
                    top: topPct,
                    transform: "translate(-50%, -50%)",
                    fontSize,
                    fontFamily: form.font_family,
                    color: f.color,
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                    cursor: "pointer",
                    zIndex: 20,
                    outline: `2px dashed ${f.color}88`,
                    outlineOffset: 4,
                    padding: "2px 4px",
                    userSelect: "none",
                  }}
                >
                  Nombre del Estudiante
                </div>
              );
            }

            const qrPx = scale > 0 ? Math.max(12, form.qr_size * scale) : 24;
            return (
              <div
                key={f.key}
                style={{
                  position: "absolute",
                  left: leftPct,
                  top: topPct,
                  transform: "translate(-50%, -50%)",
                  width: qrPx,
                  height: qrPx,
                  border: `2px dashed ${f.color}`,
                  backgroundColor: `${f.color}22`,
                  cursor: "pointer",
                  zIndex: 20,
                  boxShadow: `0 0 0 2px ${f.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    fontSize: Math.max(6, qrPx * 0.2),
                    color: f.color,
                    fontFamily: "monospace",
                    fontWeight: "bold",
                    opacity: 0.8,
                  }}
                >
                  QR
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inputs numéricos del campo activo */}
      <div className="p-3 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
        <p className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: activeDef.color }}
          />
          Posición exacta — {activeDef.label}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs text-gray-500">X (px horizontal)</label>
            <input
              type="number"
              min={0}
              max={CERT_W}
              value={activePos.x}
              onChange={(e) =>
                onChangePosition(activeField, {
                  ...activePos,
                  x: Number(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-gray-500">Y (px vertical)</label>
            <input
              type="number"
              min={0}
              max={CERT_H}
              value={activePos.y}
              onChange={(e) =>
                onChangePosition(activeField, {
                  ...activePos,
                  y: Number(e.target.value),
                })
              }
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
            />
          </div>
        </div>
      </div>

      {/* Resumen posiciones */}
      <div className="grid grid-cols-1 gap-1.5">
        {[...FRONT_FIELDS, ...BACK_FIELDS].map((f) => {
          const pos = form[f.key];
          const side = f.key === "student_name_position" ? "Cara" : "Contra";
          return (
            <div
              key={f.key}
              className={`flex items-center gap-2 text-xs text-gray-600 py-1 px-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
                f.key === activeField ? "bg-gray-100" : ""
              }`}
              onClick={() =>
                setActiveSide(
                  f.key === "student_name_position" ? "front" : "back"
                )
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: f.color }}
              />
              <span className="flex-1 truncate">
                {f.label}{" "}
                <span className="text-gray-400">({side})</span>
              </span>
              <span className="text-gray-400 font-mono text-[11px]">
                {pos.x} , {pos.y}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function PlantillasPage() {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<"config" | "positions">("config");
  const [form, setForm] = useState<FormState>(EMPTY);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [backImageFile, setBackImageFile] = useState<File | null>(null);
  const [backImagePreview, setBackImagePreview] = useState<string>("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // ── Queries ──
  const { data: templates = [], isLoading, isError } = useQuery({
    queryKey: ["certificate-templates"],
    queryFn: certificateTemplatesService.list,
  });

  // ── Mutations ──
  const createMut = useMutation({
    mutationFn: (dto: CreateCertificateTemplateDto) =>
      certificateTemplatesService.create(dto),
    onSuccess: () => {
      toast.success("Plantilla creada correctamente");
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      closeModal();
    },
    onError: (e: unknown) => toast.error(errMsg(e)),
  });

  const updateMut = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateCertificateTemplateDto>;
    }) => certificateTemplatesService.update(id, dto),
    onSuccess: () => {
      toast.success("Plantilla actualizada");
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      closeModal();
    },
    onError: (e: unknown) => toast.error(errMsg(e)),
  });

  const activateMut = useMutation({
    mutationFn: (id: string) => certificateTemplatesService.activate(id),
    onSuccess: () => {
      toast.success("Plantilla activada — se usará en los próximos certificados");
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
    },
    onError: (e: unknown) => toast.error(errMsg(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => certificateTemplatesService.delete(id),
    onSuccess: () => {
      toast.success("Plantilla eliminada");
      queryClient.invalidateQueries({ queryKey: ["certificate-templates"] });
      setConfirmDeleteId(null);
    },
    onError: (e: unknown) => {
      toast.error(errMsg(e));
      setConfirmDeleteId(null);
    },
  });

  // ── Handlers ──
  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview("");
    setBackImageFile(null);
    setBackImagePreview("");
    setActiveTab("config");
    setShowModal(true);
  };

  const openEdit = (t: CertificateTemplate) => {
    setEditing(t);
    setForm({
      name: t.name,
      student_name_position: t.student_name_position,
      qr_position: t.qr_position,
      qr_size: t.qr_size ?? 300,
      font_family: t.font_family,
      font_sizes: t.font_sizes,
    });
    setImageFile(null);
    setImagePreview(t.background_image_url ?? "");
    setBackImageFile(null);
    setBackImagePreview(t.back_image_url ?? "");
    setActiveTab("config");
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(EMPTY);
    setImageFile(null);
    setImagePreview("");
    setBackImageFile(null);
    setBackImagePreview("");
  };

  const handleImageChange = (file: File | null, localUrl: string) => {
    setImageFile(file);
    setImagePreview(localUrl);
  };

  const handleBackImageChange = (file: File | null, localUrl: string) => {
    setBackImageFile(file);
    setBackImagePreview(localUrl);
  };

  const handlePositionChange = useCallback(
    (key: PositionKey, pos: XYPosition) => {
      setForm((prev) => ({ ...prev, [key]: pos }));
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("El nombre de la plantilla es obligatorio");
      setActiveTab("config");
      return;
    }
    if (!imageFile && !imagePreview) {
      toast.error("Debes subir una imagen de fondo");
      setActiveTab("config");
      return;
    }

    const dto: CreateCertificateTemplateDto = {
      name: form.name,
      background_image: imageFile ?? undefined,
      back_image: backImageFile ?? undefined,
      student_name_position: form.student_name_position,
      qr_position: form.qr_position,
      qr_size: form.qr_size,
      font_family: form.font_family,
      font_sizes: form.font_sizes,
    };

    if (editing) {
      updateMut.mutate({ id: editing.id, dto });
    } else {
      createMut.mutate(dto);
    }
  };

  const isPending = createMut.isPending || updateMut.isPending;

  // ── Render ──
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-primary">
            Plantillas de Certificado
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Solo una plantilla puede estar activa — todos los certificados
            nuevos usarán la activa
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-[#084D95] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90 transition-colors"
        >
          + Nueva plantilla
        </button>
      </div>

      {/* Lista */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          Cargando plantillas...
        </div>
      ) : isError ? (
        <div className="text-center py-16 text-red-500 text-sm">
          Error al cargar plantillas. Verifica que el backend esté activo.
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ImageIcon size={24} className="text-gray-400" />
          </div>
          <p className="font-semibold text-gray-700">Sin plantillas todavía</p>
          <p className="text-sm text-gray-400 mt-1">
            Crea la primera plantilla para comenzar a emitir certificados
          </p>
          <button
            onClick={openCreate}
            className="mt-5 bg-[#084D95] text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-[#084D95]/90"
          >
            Crear plantilla
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {templates.map((t) => (
            <TemplateCard
              key={t.id}
              template={t}
              onEdit={openEdit}
              onActivate={(id) => activateMut.mutate(id)}
              onDelete={(id) => setConfirmDeleteId(id)}
              activating={activateMut.isPending}
            />
          ))}
        </div>
      )}

      {/* ── Modal crear / editar ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-semibold text-brand-primary text-base">
                {editing ? "Editar plantilla" : "Nueva plantilla de certificado"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 flex-shrink-0 px-6">
              {(
                [
                  { key: "config", label: "Configuración", Icon: Settings },
                  { key: "positions", label: "Posiciones", Icon: Crosshair },
                ] as const
              ).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    activeTab === key
                      ? "border-[#084D95] text-[#084D95]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Contenido del form */}
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                {activeTab === "config" ? (
                  <ConfigTab
                    form={form}
                    imagePreview={imagePreview}
                    backImagePreview={backImagePreview}
                    onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                    onImageChange={handleImageChange}
                    onBackImageChange={handleBackImageChange}
                  />
                ) : (
                  <PositionEditor
                    form={form}
                    backgroundPreview={imagePreview}
                    backPreview={backImagePreview}
                    onChangePosition={handlePositionChange}
                  />
                )}
              </div>

              {/* Footer del modal */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center flex-shrink-0 bg-white">
                <p className="text-xs text-gray-400">
                  {activeTab === "config"
                    ? "Configura el nombre, fuente e imagen de fondo"
                    : "Haz clic en la imagen para posicionar cada campo"}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  {activeTab === "config" && (
                    <button
                      type="button"
                      onClick={() => setActiveTab("positions")}
                      className="px-4 py-2 text-sm border border-[#084D95] text-[#084D95] rounded-lg hover:bg-[#084D95]/5"
                    >
                      Siguiente →
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-4 py-2 text-sm bg-[#084D95] text-white rounded-lg hover:bg-[#084D95]/90 disabled:opacity-50"
                  >
                    {isPending
                      ? "Guardando..."
                      : editing
                      ? "Guardar cambios"
                      : "Crear plantilla"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmar eliminación ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-brand-primary mb-1">
              ¿Eliminar esta plantilla?
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              Esta acción no se puede deshacer. Las plantillas activas no se
              pueden eliminar.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMut.mutate(confirmDeleteId)}
                disabled={deleteMut.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMut.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TemplateCard ──────────────────────────────────────────────────────────────
function TemplateCard({
  template: t,
  onEdit,
  onActivate,
  onDelete,
  activating,
}: {
  template: CertificateTemplate;
  onEdit: (t: CertificateTemplate) => void;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  activating: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative bg-gray-50" style={{ aspectRatio: "3508/2480" }}>
        {t.background_image_url ? (
          <img
            src={t.background_image_url}
            alt={t.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon size={32} className="text-gray-300" />
          </div>
        )}
        {t.is_active && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 size={11} />
            Activa
          </div>
        )}
      </div>

      {/* Info + acciones */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-brand-primary text-sm leading-tight">
            {t.name}
          </h3>
          <span
            className="text-xs px-2 py-0.5 rounded-full border flex-shrink-0"
            style={
              t.is_active
                ? {
                    color: "#166534",
                    backgroundColor: "#dcfce7",
                    borderColor: "#86efac",
                  }
                : {
                    color: "#6b7280",
                    backgroundColor: "#f3f4f6",
                    borderColor: "#e5e7eb",
                  }
            }
          >
            {t.is_active ? "Activa" : "Inactiva"}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          {new Date(t.created_at).toLocaleDateString("es-PE", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
          {" · "}
          {t.font_family}
        </p>

        <div className="flex gap-2">
          {!t.is_active && (
            <button
              onClick={() => onActivate(t.id)}
              disabled={activating}
              className="flex-1 text-xs py-1.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <Zap size={11} />
              Activar
            </button>
          )}
          <button
            onClick={() => onEdit(t)}
            className="flex-1 text-xs py-1.5 rounded-lg border border-[#084D95]/30 text-[#084D95] hover:bg-[#084D95]/5 transition-colors flex items-center justify-center gap-1"
          >
            <Pencil size={11} />
            Editar
          </button>
          {!t.is_active && (
            <button
              onClick={() => onDelete(t.id)}
              className="flex-1 text-xs py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
            >
              <Trash2 size={11} />
              Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ConfigTab ─────────────────────────────────────────────────────────────────
function ConfigTab({
  form,
  imagePreview,
  backImagePreview,
  onChange,
  onImageChange,
  onBackImageChange,
}: {
  form: FormState;
  imagePreview: string;
  backImagePreview: string;
  onChange: (patch: Partial<FormState>) => void;
  onImageChange: (file: File | null, localUrl: string) => void;
  onBackImageChange: (file: File | null, localUrl: string) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Nombre */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Nombre de la plantilla <span className="text-red-400">*</span>
        </label>
        <input
          required
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Ej: Plantilla Principal 2025"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
        />
      </div>

      {/* Imagen de portada (cara) */}
      <ImageUploader
        preview={imagePreview}
        onChange={onImageChange}
        label="Imagen de portada (cara)"
        hint="Página frontal del certificado con nombre del estudiante"
      />

      {/* Imagen de contraportada */}
      <ImageUploader
        preview={backImagePreview}
        onChange={onBackImageChange}
        label="Imagen de contraportada"
        hint="Página trasera del certificado donde se ubica el código QR"
      />

      {/* Tipografía */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Tipografía</label>
        <select
          value={form.font_family}
          onChange={(e) => onChange({ font_family: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
        >
          {FONT_FAMILIES.map((f) => (
            <option key={f} value={f} style={{ fontFamily: f }}>
              {f}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-400">
          Se aplica a todos los campos de texto del certificado
        </p>
      </div>

      {/* Tamaños de fuente */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-700">
          Tamaño de fuente por campo{" "}
          <span className="text-xs text-gray-400 font-normal">(unidades virtuales)</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              sizeKey: "student_name" as const,
              label: "Nombre del estudiante",
              color: "#084D95",
            },
          ].map(({ sizeKey, label, color }) => (
            <div key={sizeKey} className="space-y-1">
              <label className="text-xs text-gray-600 flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: color }}
                />
                {label}
              </label>
              <input
                type="number"
                min={50}
                max={600}
                value={form.font_sizes[sizeKey]}
                onChange={(e) =>
                  onChange({
                    font_sizes: {
                      ...form.font_sizes,
                      [sizeKey]: Number(e.target.value),
                    },
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
              />
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400">
          Mismo espacio de coordenadas que las posiciones (3508×2480 px virtuales)
        </p>
      </div>

      {/* Tamaño del QR */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Tamaño del código QR{" "}
          <span className="text-xs text-gray-400 font-normal">(unidades virtuales)</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={100}
            max={800}
            step={10}
            value={form.qr_size}
            onChange={(e) => onChange({ qr_size: Number(e.target.value) })}
            className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#084D95]/30"
          />
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#805AD5" }}
          />
          <span className="text-xs text-gray-400">
            Valor por defecto: 300 · se visualiza en la pestaña &quot;Posiciones&quot;
          </span>
        </div>
      </div>
    </div>
  );
}
