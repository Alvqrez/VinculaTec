import { useState, useEffect, useCallback } from "react";
import apiClient from "../utils/apiClient";

/**
 * Hook para actualización automática de estadísticas del dashboard
 * Mantenedor de consistencia con el sistema existente
 */
export function useRealTimeStats(refreshInterval = 30000) {
  const [stats, setStats] = useState({
    aceptados: 0,
    total: 0,
    pendientes: 0,
    esperandoLabel: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get("/api/asesor/dashboard");
      
      if (response.ok && response.body?.ok) {
        setStats(response.body.stats || {
          aceptados: 0,
          total: 0,
          pendientes: 0,
          esperandoLabel: "",
        });
        setLastUpdate(new Date());
      } else {
        throw new Error(response.body?.mensaje || "Error al cargar estadísticas");
      }
    } catch (err) {
      console.error("Error fetching real-time stats:", err);
      setError(err.message || "Error de conexión");
    } finally {
      setLoading(false);
    }
  }, []);

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
