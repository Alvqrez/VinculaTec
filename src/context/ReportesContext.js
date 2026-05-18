import { createContext, useContext, useState } from "react";

const ReportesCtx = createContext(null);

// Calcula qué parciales ya estaban desbloqueados al abrir la app,
// basándose en el estado inicial de los reportes (para no romper datos previos).
function derivarDesbloqueados(reports) {
  const set = new Set();
  const prelim = reports.find((r) => r.id === "preliminar");
  // Parcial 1 se desbloquea cuando el preliminar es aceptado
  if (prelim?.status === "Aceptado") set.add(1);

  [1, 2, 3].forEach((id) => {
    const r = reports.find((rep) => rep.id === id);
    // Si ya fue entregado alguna vez (submitted), estaba desbloqueado
    if (r?.submitted) set.add(id);
    // Si está aceptado, el siguiente queda pre-desbloqueado en los datos de demo
    if (r?.status === "Aceptado") set.add(id + 1);
  });
  return set;
}

export const INITIAL_REPORTS = [
  {
    id: "preliminar",
    title: "Reporte Preliminar",
    subtitle: "Diagnóstico inicial del proyecto",
    status: "Aceptado",
    submitted: "10 Ene 2026",
    reviewer: "Dr. Marco Reyes",
    feedback:
      "Planteamiento inicial sólido. La fuente del proyecto está debidamente justificada. Procede con los reportes parciales.",
    items: [
      { label: "Identificación del proyecto", done: true },
      { label: "Fuente del proyecto declarada", done: true },
      { label: "Diagnóstico empresarial", done: true },
    ],
  },
  {
    id: 1,
    title: "Reporte Parcial 1",
    subtitle: "Semana 1–4 · Diagnóstico inicial",
    status: "Aceptado",
    submitted: "15 Oct 2024",
    reviewer: "Dr. Marco Reyes",
    feedback:
      "Excelente diagnóstico inicial. Se identificaron correctamente los procesos críticos de la empresa y se establecieron metas claras y medibles para el proyecto.",
    items: [
      { label: "Diagnóstico empresarial", done: true },
      { label: "Objetivos del proyecto", done: true },
      { label: "Plan de trabajo", done: true },
    ],
  },
  {
    id: 2,
    title: "Reporte Parcial 2",
    subtitle: "Semana 5–8 · Desarrollo",
    status: "Aceptado",
    submitted: "12 Nov 2024",
    reviewer: "Dr. Marco Reyes",
    feedback:
      "Buen avance en el desarrollo. Se recomienda profundizar más en la documentación técnica y detallar las pruebas unitarias realizadas.",
    items: [
      { label: "Avance de implementación", done: true },
      { label: "Documentación técnica", done: true },
      { label: "Pruebas unitarias", done: false },
    ],
  },
  {
    id: 3,
    title: "Reporte Parcial 3",
    subtitle: "Semana 9–12 · Integración",
    status: "Pendiente",
    submitted: "05 Dic 2024",
    reviewer: "Dr. Marco Reyes",
    feedback: null,
    items: [
      { label: "Integración de módulos", done: true },
      { label: "Pruebas de integración", done: true },
      { label: "Manual de usuario", done: false },
    ],
  },
  {
    id: "final",
    title: "Reporte Final",
    subtitle: "Semana 13–16 · Cierre",
    status: "Pendiente",
    submitted: null,
    reviewer: "Dr. Marco Reyes",
    feedback: null,
    items: [
      { label: "Resultados obtenidos", done: false },
      { label: "Conclusiones", done: false },
      { label: "Anexos y evidencias", done: false },
    ],
  },
];

export function ReportesProvider({ children }) {
  const [reports, setReports] = useState(INITIAL_REPORTS);
  // Set de IDs de parciales que el asesor ha desbloqueado para entrega
  const [parcialesDesbloqueados, setParcialesDesbloqueados] = useState(() =>
    derivarDesbloqueados(INITIAL_REPORTS),
  );

  /** Actualiza campos de un reporte (usado por el Residente al enviar) */
  const updateReport = (id, changes) =>
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...changes } : r)),
    );

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
        updateReport,
        reviewReport,
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
