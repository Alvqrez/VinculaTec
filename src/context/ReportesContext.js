import { createContext, useContext, useState } from "react";
import { getAuthToken } from "./AuthContext";

const ReportesCtx = createContext(null);

// ── Datos iniciales (fallback offline) ───────────────────────────────────────
const INITIAL_REPORTS = [
  { id: "preliminar", tipo: "preliminar", status: "Pendiente",  submitted: null, feedback: null, archivo: null },
  { id: 1,            tipo: "parcial1",   status: "Pendiente",  submitted: null, feedback: null, archivo: null },
  { id: 2,            tipo: "parcial2",   status: "Pendiente",  submitted: null, feedback: null, archivo: null },
  { id: 3,            tipo: "parcial3",   status: "Pendiente",  submitted: null, feedback: null, archivo: null },
  { id: "final",      tipo: "final",      status: "Pendiente",  submitted: null, feedback: null, archivo: null },
];

// Calcula qué parciales ya estaban desbloqueados con base en el estado actual
function derivarDesbloqueados(reports) {
  const set = new Set();
  const prelim = reports.find((r) => r.id === "preliminar");
  if (prelim?.status === "Aceptado") set.add(1);
  [1, 2, 3].forEach((id) => {
    const r = reports.find((rep) => rep.id === id);
    if (r?.submitted)              set.add(id);
    if (r?.status === "Aceptado")  set.add(id + 1);
  });
  return set;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ReportesProvider({ children }) {
  const [reports, setReports]                           = useState(INITIAL_REPORTS);
  const [parcialesDesbloqueados, setParcialesDesbloqueados] = useState(
    () => derivarDesbloqueados(INITIAL_REPORTS),
  );
  const [loading, setLoading] = useState(false);

  // ── Helpers locales ────────────────────────────────────────────────────────

  /** Actualiza campos de un reporte en el estado local */
  const updateReport = (id, changes) =>
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...changes } : r)));

  /** El Asesor marca la revisión de un reporte */
  const reviewReport = (id, { status, feedback, reviewer = "Asesor" }) => {
    const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, feedback, reviewedBy: reviewer, reviewedAt: today }
          : r,
      ),
    );
  };

  /** El Asesor desbloquea un parcial para que el Residente pueda entregarlo */
  const desbloquearParcial = (id) =>
    setParcialesDesbloqueados((prev) => new Set([...prev, id]));

  // ── Cargar desde la BD ─────────────────────────────────────────────────────

  /** Llama al backend y reemplaza el estado con los reportes reales del residente */
  const reload = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return; // sin sesión activa
      const res  = await fetch("http://localhost:3001/api/reportes/residente", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.ok && data.reportes?.length) {
        // Fusionar los datos del backend con el estado base (para no perder filas no entregadas)
        setReports((prev) =>
          prev.map((local) => {
            const remoto = data.reportes.find((r) => r.id === local.id);
            return remoto ? { ...local, ...remoto } : local;
          }),
        );
        setParcialesDesbloqueados(
          derivarDesbloqueados(
            prev => prev.map((local) => {
              const r = data.reportes.find((r) => r.id === local.id);
              return r ? { ...local, ...r } : local;
            }),
          ),
        );
      }
    } catch (err) {
      console.warn("No se pudo conectar al backend para reportes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Envío a la BD ──────────────────────────────────────────────────────────

  /**
   * Envía un reporte al backend y actualiza el estado local.
   * Retorna { ok, mensaje } para que el componente lo maneje.
   *
   * @param {string|number} tipoId   - id del reporte ("preliminar" | 1 | 2 | 3 | "final")
   * @param {string|null}   archivo  - nombre del archivo seleccionado
   */
  const submitReporte = async (tipoId, archivo = null) => {
    const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });

    // 1. Actualizar estado local inmediatamente (optimistic update)
    updateReport(tipoId, { status: "Pendiente", submitted: today, archivo });

    // 2. Intentar guardar en la BD
    try {
      const token = getAuthToken();
      if (!token) return { ok: true, offline: true };

      const res  = await fetch("http://localhost:3001/api/reportes/submit", {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo: String(tipoId), nombreArchivo: archivo }),
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn("Backend no disponible, reporte guardado localmente:", err.message);
      return { ok: true, offline: true };
    }
  };

  /**
   * Deshace el envío de un reporte (borra en BD y revierte estado local).
   *
   * @param {string|number} tipoId - id del reporte a deshacer
   */
  const undoSubmit = async (tipoId) => {
    // 1. Revertir estado local
    updateReport(tipoId, { status: "Pendiente", submitted: null, archivo: null });

    // 2. Intentar borrar en la BD
    try {
      const token = getAuthToken();
      if (!token) return;
      await fetch("http://localhost:3001/api/reportes/undo", {
        method:  "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify({ tipo: String(tipoId) }),
      });
    } catch (err) {
      console.warn("No se pudo deshacer en el backend:", err.message);
    }
  };

  // ── Derivados ──────────────────────────────────────────────────────────────
  const preliminarAprobado      = reports.find((r) => r.id === "preliminar")?.status === "Aceptado";
  const parciales               = reports.filter((r) => typeof r.id === "number");
  const todosParcialesAprobados = parciales.every((r) => r.status === "Aceptado");
  const finalDesbloqueado       = preliminarAprobado && todosParcialesAprobados;

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
