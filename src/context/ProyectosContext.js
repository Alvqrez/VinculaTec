/**
 * ProyectosContext
 *
 * FIX: Ya no hace fetch automático al montar. El fetch se dispara
 * únicamente cuando el Asesor llama reload() desde AsesorApp.useEffect,
 * evitando peticiones 403 innecesarias para Residentes y Jefes.
 */
import { createContext, useContext, useEffect, useState } from "react";
import apiClient from "../utils/apiClient";
import { useWebSocket } from "./WebSocketContext";

const ProyectosCtx = createContext(null);

export function ProyectosProvider({ children }) {
  const [proyectos, setProyectos] = useState([]);
  const [propuestas, setPropuestas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [desbloqueadosPorResidente, setDesbloqueadosPorResidente] = useState(
    {},
  );

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
    if (!loading) deriveUnlocks();
  }, [loading, proyectos]);

  const fetchProyectos = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/api/asesor/proyectos");

      if (!response.ok) {
        setError(
          response.body?.mensaje ||
            response.error?.message ||
            "Error al cargar proyectos",
        );
        setProyectos([]);
        return;
      }

      const payload = response.body;
      if (!payload?.ok) {
        setError(payload?.mensaje || "Error al cargar proyectos");
        setProyectos([]);
        return;
      }

      const proyectosFormateados = (payload.proyectos || []).map((p) => ({
        ...p,
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

  const reload = fetchProyectos;

  // ── WebSocket: actualizaciones en tiempo real ──────────────────────────────
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const off1 = subscribe("reporte_revisado", (data) => {
      console.log("[ProyectosContext] Reporte revisado:", data);
      reload();
    });

    const off2 = subscribe("proyecto_fase_aprobada", (data) => {
      console.log("[ProyectosContext] Fase aprobada:", data);
      updateProyecto(data.proyectoId, {
        phase: data.nuevaFase,
        solicitudAvance: false,
      });
    });

    const off3 = subscribe("asesor_asignado", (data) => {
      console.log("[ProyectosContext] Asesor asignado:", data);
      reload();
    });

    return () => {
      off1();
      off2();
      off3();
    };
  }, [subscribe]);

  const updateProyecto = (id, changes) =>
    setProyectos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );

  /** Actualiza un reporte dentro de un proyecto en el estado local */
  const updateReporte = (proyectoId, reporteId, changes) =>
    setProyectos((prev) =>
      prev.map((p) => {
        if (p.id !== proyectoId) return p;
        return {
          ...p,
          reportes: p.reportes.map((r) =>
            r.id === reporteId ? { ...r, ...changes } : r,
          ),
        };
      }),
    );

  // ── Propuestas ─────────────────────────────────────────────────────────────
  const addPropuesta = (propuesta) =>
    setPropuestas((prev) => [...prev, { ...propuesta, id: Date.now() }]);

  const updatePropuesta = (id, changes) =>
    setPropuestas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...changes } : p)),
    );

  const deletePropuesta = (id) =>
    setPropuestas((prev) => prev.filter((p) => p.id !== id));

  const addProyecto = async (proyectoData) => {
    try {
      const response = await apiClient.post(
        "/api/asesor/proyectos",
        proyectoData,
      );
      if (response.ok && response.body?.ok) {
        await fetchProyectos();
        return { ok: true };
      }
      return {
        ok: false,
        mensaje: response.body?.mensaje || "Error al crear proyecto",
      };
    } catch (err) {
      return { ok: false, mensaje: "Error de conexión" };
    }
  };

  return (
    <ProyectosCtx.Provider
      value={{
        proyectos,
        propuestas,
        loading,
        error,
        reload,
        updateProyecto,
        updateReporte,
        addPropuesta,
        updatePropuesta,
        deletePropuesta,
        addProyecto,
        desbloquearReporteResidente,
        desbloqueadosPorResidente,
      }}
    >
      {children}
    </ProyectosCtx.Provider>
  );
}

export function useProyectos() {
  return useContext(ProyectosCtx);
}
