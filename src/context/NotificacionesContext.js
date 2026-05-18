import { createContext, useContext, useEffect, useState } from "react";

const Ctx = createContext(null);

// Función auxiliar para obtener el token de autenticación
const getAuthToken = () => {
  try {
    return globalThis?.localStorage?.getItem("vt_token");
  } catch {
    return null;
  }
};

export function NotificacionesProvider({ children, initialUnread = 0 }) {
  const [notifications, setNotifications] = useState(null);
  const [unreadCount, setUnreadCount] = useState(initialUnread);
  const [loading, setLoading] = useState(true);

  // Cargar notificaciones desde el backend
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch("http://localhost:3001/api/notificaciones", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (json.ok) {
          setNotifications(json.notificaciones);
          setUnreadCount(json.notificaciones.filter((n) => n.unread).length);
        }
      } catch (err) {
        console.error("Error al cargar notificaciones:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Actualizar unreadCount cuando cambian las notificaciones
  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter((n) => n.unread).length);
    }
  }, [notifications]);

  // Función para marcar una notificación como leída
  const markAsRead = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch(`http://localhost:3001/api/notificaciones/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ leida: true }),
      });

      // Actualizar estado local
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
      );
    } catch (err) {
      console.error("Error al marcar notificación como leída:", err);
    }
  };

  // Función para marcar todas como leídas
  const markAllAsRead = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch("http://localhost:3001/api/notificaciones/marcar-todas-leidas", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Actualizar estado local
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (err) {
      console.error("Error al marcar todas como leídas:", err);
    }
  };

  // Función para eliminar una notificación
  const dismissNotification = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      await fetch(`http://localhost:3001/api/notificaciones/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Actualizar estado local
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error("Error al eliminar notificación:", err);
    }
  };

  // Función para crear una nueva notificación (para uso interno del sistema)
  const createNotification = async (notificationData) => {
    try {
      const token = getAuthToken();
      if (!token) return;

      const res = await fetch("http://localhost:3001/api/notificaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      });

      const json = await res.json();
      if (json.ok) {
        // Recargar notificaciones
        const resReload = await fetch("http://localhost:3001/api/notificaciones", {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        const jsonReload = await resReload.json();
        if (jsonReload.ok) {
          setNotifications(jsonReload.notificaciones);
          setUnreadCount(jsonReload.notificaciones.filter((n) => n.unread).length);
        }
      }
    } catch (err) {
      console.error("Error al crear notificación:", err);
    }
  };

  return (
    <Ctx.Provider
      value={{
        notifications,
        setNotifications,
        unreadCount,
        setUnreadCount,
        loading,
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
