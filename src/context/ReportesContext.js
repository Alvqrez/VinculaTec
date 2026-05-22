import { createContext, useContext, useState } from "react";
import apiClient from "../utils/apiClient";

const ReportesCtx = createContext(null);

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

const TIPO_MAP = {
  preliminar: "preliminar",
  1: "parcial1",
  2: "parcial2",
  3: "parcial3",
  final: "final",
};

export function ReportesProvider({ children }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parcialesDesbloqueados, setParcialesDesbloqueados] = useState(
    new Set(),
  );

  // NO auto-fetch en mount: el token aún no existe en ese momento.
  // Llamar reload() desde ResidenteApp.useEffect, después del login.
  const reload = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/residente/reportes");
      if (response.ok && response.body?.ok) {
        const data = response.body.reportes;
        setReports(data);
        setParcialesDesbloqueados(derivarDesbloqueados(data));
      }
    } catch (err) {
      console.error("Error al cargar reportes:", err);
    } finally {
      setLoading(false);
    }
  };

  /** Actualiza campos de un reporte (optimista) */
  const updateReport = async (id, changes) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    );
    // Eliminado: La petición PUT automática causaba que el archivo se borrara
    // Por qué: Cuando el residente subía un archivo, esta función hacía una petición PUT sin cuerpo,
    // lo que enviaba archivo=null y nombre_archivo=undefined al backend, borrando el archivo.
    // Para qué: El archivo ahora se envía correctamente desde ReportePreliminar.js sin duplicar la petición.
  };

  /** El Asesor desbloquea un parcial para que el Residente pueda entregarlo */
  const desbloquearParcial = (id) =>
    setParcialesDesbloqueados((prev) => new Set([...prev, id]));

  /**
   * Registra la revisión del Asesor en el contexto del Residente.
   */
  const reviewReport = (id, { status, feedback, reviewer = "Asesor" }) => {
    const today = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, status, feedback, reviewer, fechaRevision: today }
          : r,
      ),
    );
    // Si el asesor aceptó un parcial, auto-registrar que PODRÍA desbloquear el siguiente
    // (el asesor aún tiene que presionar el botón explícito)
  };

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
        reload,
        updateReport,
        reviewReport,
        desbloquearParcial,
        parcialesDesbloqueados,
        preliminarAprobado,
        todosParcialesAprobados,
        finalDesbloqueado,
        loading,
      }}
    >
      {children}
    </ReportesCtx.Provider>
  );
}

export function useReportes() {
  return useContext(ReportesCtx);
}
