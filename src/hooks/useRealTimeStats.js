import { useState, useEffect, useCallback, useRef } from "react";
import apiClient from "../utils/apiClient";

/**
 * Hook para actualización automática de estadísticas del dashboard.
 *
 * @param {string} endpoint        - Endpoint a consultar, ej: "/api/jefe/dashboard"
 * @param {number} refreshInterval - Intervalo de refresco en ms (0 = desactivado)
 * @param {Object} defaultStats    - Valores iniciales mientras carga
 */
export function useRealTimeStats(
  endpoint = "/api/asesor/dashboard",
  refreshInterval = 60000, // 60 s por defecto (antes 30 s → demasiado agresivo)
  defaultStats = {
    aceptados: 0,
    total: 0,
    pendientes: 0,
    esperandoLabel: "",
  },
) {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Guardamos defaultStats en un ref para no romper la dependencia de useCallback
  const defaultStatsRef = useRef(defaultStats);

  const fetchStats = useCallback(async () => {
    // Guardia: si endpoint no es un string válido, no hacer nada
    if (!endpoint || typeof endpoint !== "string") return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get(endpoint);

      if (response.ok && response.body?.ok) {
        setStats(response.body.stats || defaultStatsRef.current);
        setLastUpdate(new Date());
      } else {
        // No spamear consola con errores de autorización esperados
        if (response.status !== 401 && response.status !== 403) {
          throw new Error(
            response.body?.mensaje || "Error al cargar estadísticas",
          );
        }
      }
    } catch (err) {
      if (
        !err.message?.includes("Acceso denegado") &&
        !err.message?.includes("Sin token")
      ) {
        console.error("[useRealTimeStats] Error:", err.message);
      }
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    fetchStats(); // carga inicial

    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  const refresh = useCallback(() => fetchStats(), [fetchStats]);

  return { stats, loading, error, lastUpdate, refresh };
}
