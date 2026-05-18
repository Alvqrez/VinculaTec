import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";

const ProyectosCtx = createContext(null);

// ── STATUSES NORMALIZADOS ────────────────────────────────────────────────────

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
  const [proyectos, setProyectos] = useState([]);
  const [propuestas, setPropuestas] = useState(INITIAL_PROPOSED);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [desbloqueadosPorResidente, setDesbloqueadosPorResidente] = useState({});

  /** El asesor desbloquea una fase para un residente específico */
  const desbloquearReporteResidente = (residenteNombre, fase) => {
    setDesbloqueadosPorResidente((prev) => {
      const actual = prev[residenteNombre]
        ? new Set(prev[residenteNombre])
        : new Set();
      actual.add(fase);
      return { ...prev, [residenteNombre]: actual };
    });
  };

  useEffect(() => {
    const deriveUnlocks = () => {
      const map = {};
      proyectos.forEach((p) => {
        (p.reportes || []).forEach((r) => {
          if (!map[r.residente]) map[r.residente] = new Set();
          if (r.fecha) map[r.residente].add(r.fase);
        });
      });
      setDesbloqueadosPorResidente(map);
    };

    if (!loading) {
      deriveUnlocks();
    }
  }, [loading, proyectos]);

  // Cargar proyectos desde la API al montar el componente
  useEffect(() => {
    const fetchProyectos = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/api/asesor/proyectos");

        if (!response.ok) {
          setError(
            response.body?.mensaje || response.error?.message ||
              "Error al cargar proyectos",
          );
          setProyectos([]);
          return;
        }

        const payload = response.body;
        if (!payload.ok) {
          setError(payload.mensaje || "Error al cargar proyectos");
          setProyectos([]);
          return;
        }

        const proyectosFormateados = (payload.proyectos || []).map((p) => ({
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
      } catch (err) {
        console.error("Error fetching proyectos:", err);
        setError("Error de conexión con el servidor");
        setProyectos([]);
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
      const response = await apiClient.post(
        `/api/asesor/proyectos/${proyectoId}/solicitar-avance`,
      );

      const resultado = response.body;
      if (response.ok && resultado?.ok) {
        updateProyecto(proyectoId, { solicitudAvance: true });
        return { ok: true, mensaje: resultado.mensaje };
      }

      return {
        ok: false,
        mensaje:
          resultado?.mensaje || response.error?.message ||
          "Error al solicitar avance",
      };
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
        desbloqueadosPorResidente,
        desbloquearReporteResidente,
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

