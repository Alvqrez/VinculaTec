import { createContext, useContext, useEffect, useState } from "react";
import C from "../constants/colors";

const Ctx = createContext(null);

// Función auxiliar para obtener el token de autenticación
const getAuthToken = () => {
  try {
    // Mismo key que usa AuthContext.js
    return globalThis?.localStorage?.getItem("authToken") ?? null;
  } catch {
    return null;
  }
};

// ── Notificaciones de demo (fallback cuando el backend no está disponible) ────
// Se usan SOLO si la API no responde. Se actualizan automáticamente cuando
// el backend esté corriendo.
const FALLBACK_NOTIFICATIONS = [
  {
    id: "f1",
    icon: "file-text",
    iconBg: C.amberLight,
    iconColor: C.amber,
    title: "Reporte Parcial 3 pendiente de revisión",
    body: "Ana García entregó su Reporte Parcial 3. Pendiente de tu revisión.",
    time: "Hace 2 horas",
    unread: true,
    type: "Reporte",
    typeBg: C.amberLight,
    typeColor: C.amber,
    actionScreen: "reportes",
    actionLabel: "Revisar reporte",
  },
  {
    id: "f2",
    icon: "file-text",
    iconBg: C.amberLight,
    iconColor: C.amber,
    title: "Reporte Parcial 3 pendiente de revisión",
    body: "Sofía Martínez entregó su Reporte Parcial 3. Pendiente de tu revisión.",
    time: "Hace 5 horas",
    unread: true,
    type: "Reporte",
    typeBg: C.amberLight,
    typeColor: C.amber,
    actionScreen: "reportes",
    actionLabel: "Revisar reporte",
  },
  {
    id: "f3",
    icon: "calendar",
    iconBg: C.purpleLight,
    iconColor: C.purple,
    title: "Cita confirmada con Ana García",
    body: "La cita del 22 de mayo fue confirmada. Sala 204, 10:00 hrs.",
    time: "Ayer 3:30 PM",
    unread: false,
    type: "Cita",
    typeBg: C.purpleLight,
    typeColor: C.purple,
    actionScreen: "calendario",
    actionLabel: "Ver calendario",
  },
  {
    id: "f4",
    icon: "alert-triangle",
    iconBg: C.redLight,
    iconColor: C.red,
    title: "Convenio próximo a vencer",
    body: "InnovaLogística vence el 20 de junio de 2026. Contacta a vinculación.",
    time: "Ayer 9:00 AM",
    unread: false,
    type: "Alerta",
    typeBg: C.redLight,
    typeColor: C.red,
  },
];

export function NotificacionesProvider({ children }) {
  const [notifications, setNotifications] = useState(null);
  const [loading, setLoading] = useState(true);

  // unreadCount siempre derivado de notifications — nunca hardcodeado
  const unreadCount = notifications
    ? notifications.filter((n) => n.unread).length
    : 0;

  // Cargar notificaciones desde el backend (o usar fallback)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          // Sin token: usar fallback silenciosamente (modo demo/offline)
          setNotifications(FALLBACK_NOTIFICATIONS);
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
        } else {
          // La API respondió pero con error: usar fallback
          setNotifications(FALLBACK_NOTIFICATIONS);
        }
      } catch {
        // Backend no disponible: usar fallback
        setNotifications(FALLBACK_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Función para marcar una notificación como leída
  const markAsRead = async (id) => {
    // Optimistic update primero
    setNotifications((prev) =>
      prev
        ? prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
        : prev,
    );
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
      const token = getAuthToken();
      if (!token) return;
      await fetch(
        "http://localhost:3001/api/notificaciones/marcar-todas-leidas",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      // Silencioso
    }
  };

  // Función para eliminar una notificación
  const dismissNotification = async (id) => {
    setNotifications((prev) => (prev ? prev.filter((n) => n.id !== id) : prev));
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
    } catch {
      // Silencioso
    }
  };

  // Función para crear una nueva notificación (para uso interno del sistema)
  const createNotification = (notificationData) => {
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

    // También intentar persistir en backend si hay token
    try {
      const token = getAuthToken();
      if (!token) return;
      fetch("http://localhost:3001/api/notificaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      }).catch(() => {});
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
