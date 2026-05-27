import { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken } from "./AuthContext";
import { API_BASE } from "../config/api";
import { useWebSocket } from "./WebSocketContext";

const ReportesCtx = createContext(null);

// ── Datos iniciales con todos los campos que necesitan las pantallas ──────────
const INITIAL_REPORTS = [
  {
    id: "preliminar",
    tipo: "preliminar",
    title: "Reporte Preliminar",
    subtitle: "Anteproyecto · Plan de trabajo",
    status: "Pendiente",
    submitted: null,
    feedback: null,
    archivo: null,
    reviewer: "Asesor",
    items: [
      { label: "Datos del proyecto", done: false },
      { label: "Objetivos", done: false },
      { label: "Plan de trabajo", done: false },
      { label: "Cronograma", done: false },
    ],
  },
  {
    id: 1,
    tipo: "parcial1",
    title: "Reporte Parcial 1",
    subtitle: "Bimestre 1 · Diagnóstico e inicio",
    status: "Pendiente",
    submitted: null,
    feedback: null,
    archivo: null,
    reviewer: "Asesor",
    items: [
      { label: "Actividades realizadas", done: false },
      { label: "Avance en objetivos", done: false },
      { label: "Problemas encontrados", done: false },
    ],
  },
  {
    id: 2,
    tipo: "parcial2",
    title: "Reporte Parcial 2",
    subtitle: "Bimestre 2 · Desarrollo del proyecto",
    status: "Pendiente",
    submitted: null,
    feedback: null,
    archivo: null,
    reviewer: "Asesor",
    items: [
      { label: "Actividades realizadas", done: false },
      { label: "Avance en objetivos", done: false },
      { label: "Problemas encontrados", done: false },
    ],
  },
  {
    id: 3,
    tipo: "parcial3",
    title: "Reporte Parcial 3",
    subtitle: "Bimestre 3 · Avance final",
    status: "Pendiente",
    submitted: null,
    feedback: null,
    archivo: null,
    reviewer: "Asesor",
    items: [
      { label: "Actividades realizadas", done: false },
      { label: "Avance en objetivos", done: false },
      { label: "Problemas encontrados", done: false },
    ],
  },
  {
    id: "final",
    tipo: "final",
    title: "Reporte Final",
    subtitle: "Informe de cierre · Conclusiones",
    status: "Pendiente",
    submitted: null,
    feedback: null,
    archivo: null,
    reviewer: "Asesor",
    items: [
      { label: "Resumen ejecutivo", done: false },
      { label: "Descripción del proyecto", done: false },
      { label: "Resultados obtenidos", done: false },
      { label: "Conclusiones", done: false },
    ],
  },
];

function derivarDesbloqueados(reports) {
  const set = new Set();
  const prelim = reports.find((r) => r.id === "preliminar");
  if (prelim?.status === "Aceptado") set.add(1);
  [1, 2, 3].forEach((id) => {
    const r = reports.find((rep) => rep.id === id);
    if (r?.submitted) set.add(id);
    if (r?.status === "Aceptado") set.add(id + 1);
  });
  return set;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ReportesProvider({ children }) {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [parcialesDesbloqueados, setParcialesDesbloqueados] = useState(() =>
    derivarDesbloqueados(INITIAL_REPORTS),
  );
  const [loading, setLoading] = useState(false);

  /** Actualiza campos de un reporte en el estado local */
  const updateReport = (id, changes) =>
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    );
  // Nota: La petición PUT automática fue eliminada para evitar que el archivo se borrara
  // Por qué: Cuando el residente subía un archivo, una petición PUT sin cuerpo enviaba archivo=null
  // lo que borraba el archivo. Ahora el archivo se envía correctamente desde ReportePreliminar.js.

  /**
   * El Asesor marca la revisión de un reporte.
   * ESTADO PESSIMIST: Primero persiste en BD, solo después actualiza estado local.
   * Devuelve true si tuvo éxito, false si falló.
   *
   * IMPORTANTE: pasa dbReporteId (ID real de la BD desde ProyectosContext)
   * para que la revisión se guarde y el residente la vea tras recargar.
   */
  const reviewReport = async (
    id,
    { status, feedback, reviewer = "Asesor", dbReporteId = null },
  ) => {
    const today = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    // Mapear status frontend → estado de la BD
    const estadoBD = status === "Aceptado" ? "Aprobado" : "Rechazado";

    // PRIMERO: Persistir en la BD si tenemos el ID real
    if (dbReporteId) {
      try {
        const token = getAuthToken();
        const res = await fetch(
          `${API_BASE}/asesor/reportes/${dbReporteId}/revisar`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              estado: estadoBD,
              feedback: feedback || null,
            }),
          },
        );
        const data = await res.json();

        if (!data.ok) {
          console.error("[reviewReport] Error al guardar en BD:", data.mensaje);
          return false; // Falló el guardado en BD
        }

        // SEGUNDO: Solo después de éxito en BD, actualizar estado local
        setReports((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  feedback,
                  reviewedBy: reviewer,
                  reviewedAt: today,
                }
              : r,
          ),
        );

        // Devolver el residenteUsuarioId del backend para que el front cree la notificación al residente correcto
        // Desbloquear siguiente parcial cuando se acepta
        if (status === "Aceptado" && typeof id === "number") {
          setParcialesDesbloqueados((prev) => new Set([...prev, id + 1]));
        }
        if (status === "Aceptado" && id === "preliminar") {
          setParcialesDesbloqueados((prev) => new Set([...prev, 1]));
        }

        return data.residenteUsuarioId || true;
      } catch (err) {
        console.error("[reviewReport] Error de conexión:", err);
        return false; // Falló la conexión
      }
    } else {
      console.warn(
        "[reviewReport] Sin dbReporteId — revisión solo local (no persiste en BD).",
      );

      // Si no hay dbReporteId, actualizamos solo local pero advertimos
      setReports((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status,
                feedback,
                reviewedBy: reviewer,
                reviewedAt: today,
              }
            : r,
        ),
      );

      return true; // Consideramos éxito aunque no persiste en BD
    }
  };

  /** El Asesor desbloquea un parcial */
  const desbloquearParcial = (id) =>
    setParcialesDesbloqueados((prev) => new Set([...prev, id]));

  // ── Cargar desde la BD (usa el endpoint existente /api/residente/reportes) ──
  const reload = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch(`${API_BASE}/residente/reportes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.ok && data.reportes?.length) {
        // Fusionar datos del backend con la estructura inicial (mantiene items, title, etc.)
        setReports((prev) =>
          prev.map((local) => {
            const remote = data.reportes.find((r) => r.id === local.id);
            if (!remote) return local;
            return {
              ...local,
              status: remote.status ?? local.status,
              submitted: remote.submitted ?? local.submitted,
              feedback: remote.feedback ?? local.feedback,
              reviewer: remote.reviewer ?? local.reviewer,
              archivo: remote.nombre_archivo ?? remote.archivo ?? local.archivo,
              // Actualizar items según el status
              items: local.items.map((item) => ({
                ...item,
                done: remote.status === "Aceptado",
              })),
            };
          }),
        );
        // Recalcular desbloqueados
        setReports((current) => {
          setParcialesDesbloqueados(derivarDesbloqueados(current));
          return current;
        });
      }
    } catch (err) {
      console.warn("No se pudo cargar reportes del backend:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Envío a la BD ──────────────────────────────────────────────────────────

  /**
   * Envía un reporte al backend y actualiza el estado local.
   * Usa el endpoint existente PUT /api/residente/reportes/:tipo
   */
  const submitReporte = async (tipoId, archivo = null) => {
    const today = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    // Optimistic update
    updateReport(tipoId, { status: "Pendiente", submitted: today, archivo });

    try {
      const token = getAuthToken();
      if (!token) return { ok: true, offline: true };

      // Determinar el tipo enum a partir del id
      const tipoMap = {
        preliminar: "preliminar",
        1: "parcial1",
        2: "parcial2",
        3: "parcial3",
        final: "final",
      };
      const tipoEnum = tipoMap[tipoId] || String(tipoId);

      const res = await fetch(`${API_BASE}/residente/reportes/${tipoEnum}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ nombre_archivo: archivo }),
      });
      return await res.json();
    } catch (err) {
      console.warn("Backend no disponible, guardado localmente:", err.message);
      return { ok: true, offline: true };
    }
  };

  /** Deshace el envío de un reporte */
  const undoSubmit = async (tipoId) => {
    updateReport(tipoId, {
      status: "Pendiente",
      submitted: null,
      archivo: null,
    });

    try {
      const token = getAuthToken();
      if (!token) return;
      const tipoMap = {
        preliminar: "preliminar",
        1: "parcial1",
        2: "parcial2",
        3: "parcial3",
        final: "final",
      };
      const tipoEnum = tipoMap[tipoId] || String(tipoId);
      await fetch(`${API_BASE}/residente/reportes/${tipoEnum}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ archivo: null, nombre_archivo: null }),
      });
    } catch (err) {
      console.warn("No se pudo deshacer en el backend:", err.message);
    }
  };

  // ── WebSocket: el Residente ve el feedback del Asesor en tiempo real ────────
  const { subscribe } = useWebSocket();
  useEffect(() => {
    const off = subscribe("reporte_revisado", (data) => {
      console.log("[ReportesContext] Reporte revisado:", data);
      // Mapear estado de BD al status del frontend
      const statusMap = { Aprobado: "Aceptado", Rechazado: "Por corregir" };
      const nuevoStatus = statusMap[data.estado] || data.estado;

      setReports((prev) =>
        prev.map((r) => {
          // Comparar por tipo (id del reporte local) no por ID de BD
          // El evento trae reporteId de la BD; buscamos si algún reporte local coincide
          if (String(r.dbId) === String(data.reporteId)) {
            return {
              ...r,
              status: nuevoStatus,
              feedback: data.feedback ?? r.feedback,
            };
          }
          return r;
        }),
      );
    });
    return off;
  }, [subscribe]);

  // ── Derivados ──────────────────────────────────────────────────────────────
  const preliminarAprobado =
    reports.find((r) => r.id === "preliminar")?.status === "Aceptado";
  const parciales = reports.filter((r) => typeof r.id === "number");
  const todosParcialesAprobados = parciales.every(
    (r) => r.status === "Aceptado",
  );
  const finalDesbloqueado = preliminarAprobado && todosParcialesAprobados;

  return (
    <ReportesCtx.Provider
      value={{
        reports,
        loading,
        reload,
        updateReport,
        reviewReport,
        submitReporte,
        undoSubmit,
        desbloquearParcial,
        parcialesDesbloqueados,
        preliminarAprobado,
        todosParcialesAprobados,
        finalDesbloqueado,
      }}
    >
      {children}
    </ReportesCtx.Provider>
  );
}

export function useReportes() {
  return useContext(ReportesCtx);
}
