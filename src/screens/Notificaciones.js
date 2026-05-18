import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card, StatCard, Badge } from "../components";
import { useNotificaciones } from "../context/NotificacionesContext";

const NOTIFICATIONS = [
  {
    id: 1,
    icon: "file-text",
    iconBg: C.blueLight,
    iconColor: C.blue,
    title: "Reporte Parcial 3 pendiente",
    body: "Tu reporte parcial 3 vence el 15 de diciembre. Recuerda subirlo a tiempo para evitar penalizaciones.",
    time: "Hace 2 horas",
    unread: true,
    type: "Reporte",
    typeBg: C.blueLight,
    typeColor: C.blue,
    actionScreen: "seguimiento",
    actionLabel: "Ir a Seguimiento",
  },
  {
    id: 2,
    icon: "check-circle",
    iconBg: C.greenLight,
    iconColor: C.green,
    title: "Reporte Parcial 2 aprobado",
    body: "El Dr. Martínez ha aprobado tu Reporte Parcial 2 con una calificación de 88/100.",
    time: "Hace 5 horas",
    unread: true,
    type: "Aprobación",
    typeBg: C.greenLight,
    typeColor: C.green,
    actionScreen: "seguimiento",
    actionLabel: "Ver retroalimentación",
  },
  {
    id: 3,
    icon: "calendar",
    iconBg: C.purpleLight,
    iconColor: C.purple,
    title: "Cita agendada con asesor",
    body: "Se ha confirmado tu cita con el Dr. Martínez el 18 de diciembre a las 10:00 AM en sala 204.",
    time: "Ayer 3:30 PM",
    unread: true,
    type: "Cita",
    typeBg: C.purpleLight,
    typeColor: C.purple,
    actionScreen: "calendario",
    actionLabel: "Ver calendario",
  },
  {
    id: 4,
    icon: "alert-triangle",
    iconBg: C.amberLight,
    iconColor: C.amber,
    title: "Convenio próximo a vencer",
    body: "El convenio de SoftSolutions SA vence el 15 de noviembre. Contacta a vinculación para renovarlo.",
    time: "Ayer 9:00 AM",
    unread: true,
    type: "Alerta",
    typeBg: C.amberLight,
    typeColor: C.amber,
  },
  {
    id: 5,
    icon: "message-circle",
    iconBg: C.tealLight,
    iconColor: C.teal,
    title: "Retroalimentación del asesor",
    body: "El Dr. Martínez ha dejado comentarios en tu Reporte Parcial 2. Revisa los puntos de mejora.",
    time: "12 Nov 2024",
    unread: false,
    type: "Mensaje",
    typeBg: C.tealLight,
    typeColor: C.teal,
  },
  {
    id: 6,
    icon: "award",
    iconBg: C.greenLight,
    iconColor: C.green,
    title: "Evaluación intermedia completada",
    body: "Has completado exitosamente tu evaluación intermedia con un promedio de 91.5 puntos.",
    time: "10 Nov 2024",
    unread: false,
    type: "Logro",
    typeBg: C.greenLight,
    typeColor: C.green,
  },
];

export default function Notificaciones({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("Todas");
  const {
    notifications: contextNotifications,
    setNotifications: setContextNotifications,
    unreadCount,
    setUnreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
  } = useNotificaciones() || {};

  const notifications = contextNotifications || [];
  const unread = notifications.filter((n) => n.unread).length;
  const read = notifications.filter((n) => !n.unread).length;
  const visibleNotifications = notifications.filter((notif) => {
    if (activeTab === "Sin Leer") return notif.unread;
    if (activeTab === "Reportes") return notif.type === "Reporte";
    if (activeTab === "Citas") return notif.type === "Cita";
    if (activeTab === "Alertas") return notif.type === "Alerta";
    return true;
  });

  const handleMarkAllRead = () => {
    if (markAllAsRead) {
      markAllAsRead();
    } else if (setContextNotifications) {
      setContextNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
      setUnreadCount && setUnreadCount(0);
    }
  };

  const handleMarkRead = (id) => {
    if (markAsRead) {
      markAsRead(id);
    } else if (setContextNotifications) {
      setContextNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, unread: false } : n,
        );
        const newCount = updated.filter((n) => n.unread).length;
        setUnreadCount && setUnreadCount(newCount);
        return updated;
      });
    }
  };

  const handleDismiss = (id) => {
    if (dismissNotification) {
      dismissNotification(id);
    } else if (setContextNotifications) {
      setContextNotifications((prev) => {
        const item = prev.find((n) => n.id === id);
        const updated = prev.filter((n) => n.id !== id);
        if (item?.unread)
          setUnreadCount &&
            setUnreadCount(updated.filter((n) => n.unread).length);
        return updated;
      });
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <Row
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
            Notificaciones
          </Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            Centro de avisos y alertas
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 9,
            backgroundColor: C.card,
          }}
        >
          <Feather name="check-square" size={13} color={C.textMuted} />
          <Text style={{ fontSize: 12, color: C.textMuted, fontWeight: "600" }}>
            Marcar todo como leído
          </Text>
        </TouchableOpacity>
      </Row>

      {/* Stats */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard
          label="Sin Leer"
          value={String(unread)}
          icon="bell"
          iconBg={C.redLight}
          iconColor={C.red}
        />
        <StatCard
          label="Leídas"
          value={String(read)}
          icon="bell-off"
          iconBg={C.greenLight}
          iconColor={C.green}
        />
        <StatCard
          label="Total"
          value={String(notifications.length)}
          icon="list"
          iconBg={C.blueLight}
          iconColor={C.blue}
        />
      </Row>

      {/* Filter tabs */}
      <Row style={{ gap: 8, marginBottom: 18 }}>
        {["Todas", "Sin Leer", "Reportes", "Citas", "Alertas"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              paddingHorizontal: 13,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: tab === activeTab ? C.teal : C.card,
              borderWidth: 1,
              borderColor: tab === activeTab ? C.teal : C.border,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: tab === activeTab ? "white" : C.textMuted,
              }}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </Row>

      {/* Notification Cards */}
      <View style={{ gap: 10 }}>
        {visibleNotifications.map((notif) => (
          <Card
            key={notif.id}
            style={{
              padding: 0,
              overflow: "hidden",
              borderLeftWidth: notif.unread ? 4 : 1,
              borderLeftColor: notif.unread ? notif.iconColor : C.border,
            }}
          >
            <View style={{ padding: 16 }}>
              <Row style={{ gap: 12, alignItems: "flex-start" }}>
                {/* Icon */}
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    backgroundColor: notif.iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Feather
                    name={notif.icon}
                    size={18}
                    color={notif.iconColor}
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <Row
                    style={{
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 4,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8, flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: notif.unread ? "800" : "600",
                          color: notif.unread ? C.text : C.textSub,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {notif.title}
                      </Text>
                      {notif.unread && (
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: notif.iconColor,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Row>
                    <Row style={{ gap: 6, marginLeft: 10 }}>
                      <Badge
                        text={notif.type}
                        color={notif.typeColor}
                        bg={notif.typeBg}
                      />
                    </Row>
                  </Row>

                  <Text
                    style={{
                      fontSize: 12,
                      color: C.textMuted,
                      lineHeight: 17,
                      marginBottom: 4,
                    }}
                  >
                    {notif.body}
                  </Text>
                  {(notif.proyecto || notif.fase) && (
                    <Row style={{ gap: 8, marginBottom: 6 }}>
                      {notif.proyecto && (
                        <Row style={{ alignItems: "center", gap: 4 }}>
                          <Feather name="folder" size={10} color={C.teal} />
                          <Text style={{ fontSize: 10, color: C.teal, fontWeight: "600" }}>{notif.proyecto}</Text>
                        </Row>
                      )}
                      {notif.fase && (
                        <Row style={{ alignItems: "center", gap: 4 }}>
                          <Feather name="layers" size={10} color={C.purple} />
                          <Text style={{ fontSize: 10, color: C.purple, fontWeight: "600" }}>Fase: {notif.fase}</Text>
                        </Row>
                      )}
                    </Row>
                  )}

                  <Row
                    style={{
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 5 }}>
                      <Feather name="clock" size={11} color={C.textLight} />
                      <Text style={{ fontSize: 11, color: C.textLight }}>
                        {notif.time}
                      </Text>
                    </Row>
                    <Row style={{ gap: 8 }}>
                      {notif.unread && (
                        <TouchableOpacity
                          onPress={() => handleMarkRead(notif.id)}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 7,
                            backgroundColor: C.tealLighter,
                            borderWidth: 1,
                            borderColor: C.tealLight,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: C.teal,
                              fontWeight: "700",
                            }}
                          >
                            Marcar como leído
                          </Text>
                        </TouchableOpacity>
                      )}
                      {notif.actionScreen && onNavigate && (
                          <TouchableOpacity
                            onPress={() => { handleMarkRead(notif.id); onNavigate(notif.actionScreen); }}
                            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: C.teal }}
                          >
                            <Feather name="arrow-right" size={11} color="white" />
                            <Text style={{ fontSize: 11, color: "white", fontWeight: "700" }}>{notif.actionLabel}</Text>
                          </TouchableOpacity>
                        )}
                      <TouchableOpacity
                        onPress={() => handleDismiss(notif.id)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          backgroundColor: C.bg,
                          borderWidth: 1,
                          borderColor: C.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="x" size={13} color={C.textLight} />
                      </TouchableOpacity>
                    </Row>
                  </Row>
                </View>
              </Row>
            </View>
          </Card>
        ))}
      </View>

      {visibleNotifications.length === 0 && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 20,
              backgroundColor: C.greenLight,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <Feather name="bell-off" size={26} color={C.green} />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: C.text,
              marginBottom: 6,
            }}
          >
            Sin notificaciones
          </Text>
          <Text style={{ fontSize: 13, color: C.textMuted }}>
            Estás al día con todo
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
