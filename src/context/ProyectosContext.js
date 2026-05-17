import { createContext, useContext, useState, useEffect } from "react";
import { getAuthToken } from "./AuthContext";

const ProyectosCtx = createContext(null);

// ── STATUSES NORMALIZADOS ────────────────────────────────────────────────────
// "Aceptado"    — revisado y aprobado por el asesor
// "Pendiente"   — enviado por el residente, esperando revisión
// "Por corregir"— rechazado, requiere reenvío con correcciones
// ─────────────────────────────────────────────────────────────────────────────

// Fallback: datos iniciales por si no hay conexión a BD
const INITIAL_PROJECTS = [
  {
    id: "p1",
    title: "App de Logística Interna",
    company: "AutoParts Globales",
    phase: "desarrollo",
    priority: "Alta",
    residentes: [
      { nombre: "Carlos Ramírez", iniciales: "CR", rol: "Fullstack Developer" },
      { nombre: "Ana López", iniciales: "AL", rol: "Backend Developer" },
    ],
    residentesRequeridos: 3,
    habilidades: ["React Native", "Node.js", "MongoDB"],
    asesor: "Dr. Marco Reyes",
    asesorId: "asesor1",
    horasDocumentadas: 320,
    horasTotales: 480,
    fechaInicio: "2025-08-15",
    fechaFin: "2026-06-15",
    reportes: [
      // ── Carlos Ramírez ──────────────────────────────────────────────────
      {
        id: "r1",
        titulo: "Reporte Preliminar",
        residente: "Carlos Ramírez",
        fase: "Preliminar",
        status: "Aceptado",
        score: 92,
        fecha: "2025-09-10",
        feedback: "Planteamiento inicial sólido. Procede con los parciales.",
        fechaRevision: "2025-09-12",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r2",
        titulo: "Reporte Parcial 1",
        residente: "Carlos Ramírez",
        fase: "Parcial 1",
        status: "Aceptado",
        score: 88,
        fecha: "2025-10-15",
        feedback: "Excelente diagnóstico inicial. Metas claras y medibles.",
        fechaRevision: "2025-10-17",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r3",
        titulo: "Reporte Parcial 2",
        residente: "Carlos Ramírez",
        fase: "Parcial 2",
        status: "Aceptado",
        score: 85,
        fecha: "2025-11-12",
        feedback: "Buen avance. Profundizar en documentación técnica.",
        fechaRevision: "2025-11-14",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r4",
        titulo: "Reporte Parcial 3",
        residente: "Carlos Ramírez",
        fase: "Parcial 3",
        status: "Pendiente",
        score: null,
        fecha: "2026-05-08",
        feedback: null,
        fechaRevision: null,
        historial: [],
        cumpleObjetivos: null,
        cumpleDiagnostico: null,
        cumplePlanTrabajo: null,
        archivo: null,
      },
      // ── Ana López ────────────────────────────────────────────────────────
      {
        id: "r5",
        titulo: "Reporte Preliminar",
        residente: "Ana López",
        fase: "Preliminar",
        status: "Aceptado",
        score: 90,
        fecha: "2025-09-09",
        feedback: "Diagnóstico claro y bien justificado.",
        fechaRevision: "2025-09-11",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r6",
        titulo: "Reporte Parcial 1",
        residente: "Ana López",
        fase: "Parcial 1",
        status: "Aceptado",
        score: 91,
        fecha: "2025-10-14",
        feedback: "Muy buen avance en backend. Sigue así.",
        fechaRevision: "2025-10-16",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r7",
        titulo: "Reporte Parcial 2",
        residente: "Ana López",
        fase: "Parcial 2",
        status: "Aceptado",
        score: 87,
        fecha: "2025-11-10",
        feedback: "Buen progreso. Agregar pruebas de integración.",
        fechaRevision: "2025-11-13",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r8",
        titulo: "Reporte Parcial 3",
        residente: "Ana López",
        fase: "Parcial 3",
        status: "Pendiente",
        score: null,
        fecha: "2026-05-12",
        feedback: null,
        fechaRevision: null,
        historial: [],
        cumpleObjetivos: null,
        cumpleDiagnostico: null,
        cumplePlanTrabajo: null,
        archivo: null,
      },
    ],
    reuniones: [
      {
        titulo: "Revisión semanal",
        fecha: "2026-05-20",
        hora: "10:00",
        modalidad: "Presencial",
      },
      {
        titulo: "Entrega parcial 3",
        fecha: "2026-06-01",
        hora: "11:00",
        modalidad: "Virtual",
      },
    ],
  },
  {
    id: "p2",
    title: "Portal de Clientes",
    company: "Distribuidora Nacional",
    phase: "revision",
    priority: "Media",
    residentes: [
      { nombre: "María Torres", iniciales: "MT", rol: "Frontend Developer" },
    ],
    residentesRequeridos: 2,
    habilidades: ["React", "TypeScript", "Firebase"],
    asesor: "Dr. Marco Reyes",
    asesorId: "asesor1",
    horasDocumentadas: 410,
    horasTotales: 480,
    fechaInicio: "2025-07-01",
    fechaFin: "2026-05-30",
    reportes: [
      {
        id: "r9",
        titulo: "Reporte Preliminar",
        residente: "María Torres",
        fase: "Preliminar",
        status: "Aceptado",
        score: 95,
        fecha: "2025-07-15",
        feedback: "Excelente planteamiento.",
        fechaRevision: "2025-07-17",
        historial: [],
        cumpleObjetivos: true,
        cumpleDiagnostico: true,
        cumplePlanTrabajo: true,
        archivo: null,
      },
      {
        id: "r10",
        titulo: "Reporte Parcial 1",
        residente: "María Torres",
        fase: "Parcial 1",
        status: "Pendiente",
        score: null,
        fecha: "2026-05-10",
        feedback: null,
        fechaRevision: null,
        historial: [],
        cumpleObjetivos: null,
        cumpleDiagnostico: null,
        cumplePlanTrabajo: null,
        archivo: null,
      },
    ],
    reuniones: [],
  },
];

const INITIAL_PROPOSED = [
  {
    id: "prop1",
    title: "Sistema de Control de Inventarios",
    company: "Distribuidora Nacional",
    priority: "Alta",
    residentesRequeridos: 2,
    residentesAsignados: [
      { nombre: "María Torres", iniciales: "MT", rol: "Backend Developer" },
    ],
    residentesFaltantes: 1,
    habilidadesRequeridas: ["Java", "Spring Boot", "MySQL"],
    rolRequerido: "Frontend Developer con experiencia en React",
    descripcionAvance:
      "Se tiene el diseño de la base de datos y los wireframes del sistema.",
    asesor: "Dr. Martínez",
    asesorId: "asesor1",
    fechaPropuesta: "2026-05-10",
    status: "Pendiente",
  },
];

export function ProyectosProvider({ children }) {
  const [proyectos, setProyectos] = useState(INITIAL_PROJECTS);
  const [propuestas, setPropuestas] = useState(INITIAL_PROPOSED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar proyectos desde la API al montar el componente
  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        setLoading(true);
        const token = getAuthToken();
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch("http://localhost:3001/api/asesor/proyectos", {
          headers,
        });
        const json = await res.json();

        if (!json.ok) {
          setError(json.mensaje || "Error al cargar proyectos");
          // Usar fallback data
          setProyectos(INITIAL_PROJECTS);
        } else {
          // Mapear datos de API al formato esperado por la app
          const proyectosFormateados = json.proyectos.map((p) => ({
            ...p,
            id: p.id,
            title: p.title,
            company: p.company,
            phase: p.phase,
            priority: p.priority,
            solicitudAvance: p.solicitud_avance || false,
            residentes: p.residentes || [],
            reportes: p.reportes || [],
            reuniones: p.reuniones || [],
          }));
          setProyectos(proyectosFormateados);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching proyectos:", err);
        setError("Error de conexión con el servidor");
        // Usar fallback data
        setProyectos(INITIAL_PROJECTS);
      } finally {
        setLoading(false);
      }
    };

    fetchProyectos();
  }, []);

  const updateProyecto = (id, changes) =>
    setProyectos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );

  const addReporte = (proyectoId, reporte) =>
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyectoId ? { ...p, reportes: [...p.reportes, reporte] } : p,
      ),
    );

  const updateReporte = (proyectoId, reporteId, changes) =>
    setProyectos((prev) =>
      prev.map((p) =>
        p.id === proyectoId
          ? {
              ...p,
              reportes: p.reportes.map((r) =>
                r.id === reporteId ? { ...r, ...changes } : r,
              ),
            }
          : p,
      ),
    );

  /**
   * Llamada cuando el Residente envía (o re-envía) un reporte.
   * Actualiza el status a "Pendiente" en ProyectosContext para que
   * el Asesor lo vea en SeguimientoAsesor.
   * proyectoId y residenteNombre tienen valores demo por defecto.
   */
  const submitReporteFromResidente = (
    fase,
    residenteNombre = "Carlos Ramírez",
    proyectoId = "p1",
  ) => {
    // ISO format: "2026-05-17" — garantiza que new Date(fecha) lo parsee correctamente
    const today = new Date().toISOString().split("T")[0];

    setProyectos((prev) =>
      prev.map((p) => {
        if (p.id !== proyectoId) return p;

        const existing = p.reportes.find(
          (r) => r.fase === fase && r.residente === residenteNombre,
        );

        if (existing) {
          // Re-envío: resetear a Pendiente
          return {
            ...p,
            reportes: p.reportes.map((r) =>
              r.fase === fase && r.residente === residenteNombre
                ? {
                    ...r,
                    status: "Pendiente",
                    fecha: today,
                    feedback: null,
                    fechaRevision: null,
                  }
                : r,
            ),
          };
        }

        // Primera entrega: agregar nuevo reporte
        return {
          ...p,
          reportes: [
            ...p.reportes,
            {
              id: `r_${Date.now()}`,
              titulo: `Reporte ${fase}`,
              residente: residenteNombre,
              fase,
              status: "Pendiente",
              score: null,
              fecha: today,
              feedback: null,
              fechaRevision: null,
              historial: [],
              cumpleObjetivos: null,
              cumpleDiagnostico: null,
              cumplePlanTrabajo: null,
              archivo: null,
            },
          ],
        };
      }),
    );
  };

  const addPropuesta = (propuesta) =>
    setPropuestas((prev) => [
      ...prev,
      { ...propuesta, id: `prop${Date.now()}`, status: "Pendiente" },
    ]);

  const updatePropuesta = (id, changes) =>
    setPropuestas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );

  const aprobarPropuesta = (id) => {
    const prop = propuestas.find((p) => p.id === id);
    if (!prop) return;
    updatePropuesta(id, { status: "Aprobado" });
    const nuevoProyecto = {
      id: `p${Date.now()}`,
      title: prop.title,
      company: prop.company,
      phase: "propuesto",
      priority: prop.priority,
      residentes: prop.residentesAsignados.map((r) => ({
        ...r,
        asignado: true,
      })),
      residentesRequeridos: prop.residentesRequeridos,
      habilidades: prop.habilidadesRequeridas,
      asesor: prop.asesor,
      asesorId: prop.asesorId,
      horasDocumentadas: 0,
      horasTotales: 480,
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFin: null,
      reportes: [],
      reuniones: [],
    };
    setProyectos((prev) => [...prev, nuevoProyecto]);
  };

  const rechazarPropuesta = (id, motivo) =>
    updatePropuesta(id, { status: "Rechazado", motivoRechazo: motivo });

  const solicitarAvanceFase = async (proyectoId) => {
    try {
      const token = getAuthToken();
      const headers = { "Content-Type": "application/json" };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `http://localhost:3001/api/asesor/proyectos/${proyectoId}/solicitar-avance`,
        {
          method: "POST",
          headers,
        },
      );

      const json = await res.json();

      if (json.ok) {
        updateProyecto(proyectoId, { solicitudAvance: true });
        return { ok: true, mensaje: json.mensaje };
      } else {
        return {
          ok: false,
          mensaje: json.mensaje || "Error al solicitar avance",
        };
      }
    } catch (err) {
      console.error("Error al solicitar avance de fase:", err);
      return { ok: false, mensaje: "Error de conexión con el servidor" };
    }
  };

  const aprobarAvanceFase = (proyectoId) => {
    const phases = ["propuesto", "desarrollo", "revision", "concluido"];
    const proyecto = proyectos.find((p) => p.id === proyectoId);
    if (!proyecto) return;
    const currentIdx = phases.indexOf(proyecto.phase);
    if (currentIdx < phases.length - 1) {
      updateProyecto(proyectoId, {
        phase: phases[currentIdx + 1],
        solicitudAvance: false,
      });
    }
  };

  return (
    <ProyectosCtx.Provider
      value={{
        proyectos,
        propuestas,
        setProyectos,
        updateProyecto,
        addReporte,
        updateReporte,
        submitReporteFromResidente,
        addPropuesta,
        updatePropuesta,
        aprobarPropuesta,
        rechazarPropuesta,
        solicitarAvanceFase,
        aprobarAvanceFase,
        loading,
        error,
      }}
    >
      {children}
    </ProyectosCtx.Provider>
  );
}

export function useProyectos() {
  return useContext(ProyectosCtx);
}
