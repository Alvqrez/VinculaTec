import { createContext, useContext, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../utils/apiClient";

const Ctx = createContext(null);

export function NotificacionesProvider({ children }) {
  const { colors: C } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const unreadCount = notifications.filter((n) => n.unread).length;

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
          response.body?.mensaje ||
            response.error?.message ||
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

  const reload = fetchNotifications;

  // Marcar una como leída (optimista + BD)
  const markAsRead = async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
    );
    const res = await apiClient.put(`/api/notificaciones/${id}`, {
      leida: true,
    });
    if (!res.ok) {
      console.error(
        "Error al marcar notificación como leída:",
        res.body?.mensaje,
      );
      // Revertir si falla
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: true } : n)),
      );
    }
  };

  // Marcar todas como leídas (optimista + BD)
  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    const res = await apiClient.put("/api/notificaciones/marcar-todas-leidas");
    if (!res.ok) {
      console.error("Error al marcar todas como leídas:", res.body?.mensaje);
      // Revertir si falla
      fetchNotifications();
    }
  };

  // Eliminar una notificación
  const dismissNotification = async (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const res = await apiClient.delete(`/api/notificaciones/${id}`);
    if (!res.ok)
      console.error("Error al eliminar notificación:", res.body?.mensaje);
  };

  // Eliminar todas las notificaciones ya leídas
  const dismissAllRead = async () => {
    setNotifications((prev) => prev.filter((n) => n.unread));
    const res = await apiClient.delete("/api/notificaciones/todas-leidas");
    if (!res.ok) {
      console.error(
        "Error al eliminar notificaciones leídas:",
        res.body?.mensaje,
      );
      fetchNotifications();
    }
  };

  // Crear una notificación (uso interno del sistema)
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
    setNotifications((prev) => [newNotif, ...prev]);
    try {
      await apiClient.post("/api/notificaciones", notificationData);
    } catch {
      /* silencioso */
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
        reload,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        dismissAllRead,
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
