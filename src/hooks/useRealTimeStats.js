import { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";

/**
 * Hook para actualización automática de estadísticas del dashboard
 * @param {string} endpoint - Endpoint a consultar (ej: "/api/asesor/dashboard")
 * @param {number} refreshInterval - Intervalo de refresco en ms (0 para desactivar)
 * @param {Object} defaultStats - Valores por defecto para stats
 */
export function useRealTimeStats(
  endpoint = "/api/asesor/dashboard",
  refreshInterval = 30000,
  defaultStats = {
    aceptados: 0,
    total: 0,
    pendientes: 0,
    esperandoLabel: "",
  }
) {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = useCallback(async () => {
    // Si no hay endpoint, no hacer nada
    if (!endpoint) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get(endpoint);
      
      if (response.ok && response.body?.ok) {
        setStats(response.body.stats || defaultStats);
        setLastUpdate(new Date());
      } else {
        // No loggear error de autorización en consola para no spammear
        if (response.status !== 401 && response.status !== 403) {
          throw new Error(response.body?.mensaje || "Error al cargar estadísticas");
        }
      }
    } catch (err) {
      // Solo loggear errores de red, no de autorización
      if (!err.message?.includes("Acceso denegado") && !err.message?.includes("Sin token")) {
        console.error("Error fetching real-time stats:", err);
      }
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, [endpoint, defaultStats]);

  // Efecto para actualización periódica
  useEffect(() => {
    fetchStats(); // Carga inicial
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  // Función para refresco manual
  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    lastUpdate,
    refresh,
  };
}
