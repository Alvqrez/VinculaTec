import { createContext, useContext, useEffect, useState } from "react";
import C from "../constants/colors";
import apiClient from "../utils/apiClient";

const Ctx = createContext(null);

export function NotificacionesProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // unreadCount siempre derivado de notifications — nunca hardcodeado
  const unreadCount = notifications
    ? notifications.filter((n) => n.unread).length
    : 0;

  // Cargar notificaciones desde el backend y exponer estado real
  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await apiClient.get("/api/notificaciones");
        if (response.ok && response.body?.ok) {
          setNotifications(response.body.notificaciones ?? []);
          setError(null);
        } else {
          setNotifications([]);
          setError(
            response.body?.mensaje || response.error?.message ||
              "Error al cargar notificaciones",
          );
        }
      } catch (err) {
        setNotifications([]);
        setError("Error de conexión con el servidor");
        console.error("Notificaciones fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Función para marcar una notificación como leída
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev
        ? prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
        : prev,
    );
    try {
      await apiClient.put(`/api/notificaciones/${id}`, { leida: true });
    } catch {
      // Silencioso: el update optimista ya está aplicado
    }
  };

  // Función para marcar todas como leídas
  const markAllAsRead = async () => {
    setNotifications((prev) =>
      prev ? prev.map((n) => ({ ...n, unread: false })) : prev,
    );
    try {
      await apiClient.put("/api/notificaciones/marcar-todas-leidas");
    } catch {
      // Silencioso
    }
  };

  // Función para eliminar una notificación
  const dismissNotification = async (id) => {
    setNotifications((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
    try {
      await apiClient.delete(`/api/notificaciones/${id}`);
    } catch {
      // Silencioso
    }
  };

  // Función para crear una nueva notificación (para uso interno del sistema)
  const createNotification = async (notificationData) => {
    const newNotif = {
      id: `local-${Date.now()}`,
      unread: true,
      time: "Ahora",
      type: "Sistema",
      typeBg: C.tealLight,
      typeColor: C.teal,
      ...notificationData,
    };
    setNotifications((prev) => (prev ? [newNotif, ...prev] : [newNotif]));

    try {
      await apiClient.post("/api/notificaciones", notificationData);
    } catch {
      // Silencioso
    }
  };

  return (
    <Ctx.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        createNotification,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useNotificaciones() {
  return useContext(Ctx);
}
