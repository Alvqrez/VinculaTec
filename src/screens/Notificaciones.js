import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card, StatCard, Badge } from "../components";
import { useNotificaciones } from "../context/NotificacionesContext";

const TABS = ["Todas", "Sin Leer", "Reportes", "Citas", "Alertas"];

// Agrupa notificaciones por fecha relativa
function groupByDate(notifications) {
  const groups = {};
  const now = new Date();
  notifications.forEach((n) => {
    let label = "Anteriores";
    if (n.time === "Ahora" || n.time?.startsWith("Hace")) {
      const mins = n.time.match(/(\d+) min/)?.[1];
      const hours = n.time.match(/(\d+) h/)?.[1];
      const days = n.time.match(/(\d+) día/)?.[1];
      if (!days || Number(days) < 1) label = "Hoy";
      else if (Number(days) === 1) label = "Ayer";
      else if (Number(days) < 7) label = "Esta semana";
    } else {
      label = "Anteriores";
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  // Orden de secciones
  const order = ["Hoy", "Ayer", "Esta semana", "Anteriores"];
  return order
    .filter((k) => groups[k])
    .map((k) => ({ label: k, items: groups[k] }));
}

// Tarjeta de notificación individual con animación de fade-out al descartar
function NotifCard({ notif, onMarkRead, onDismiss, onNavigate }) {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onDismiss(notif.id);
    });
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Card
        style={{
          padding: 0,
          overflow: "hidden",
          borderLeftWidth: notif.unread ? 4 : 1,
          borderLeftColor: notif.unread ? notif.iconColor : C.border,
          marginBottom: 0,
        }}
      >
        <View style={{ padding: 16 }}>
          <Row style={{ gap: 12, alignItems: "flex-start" }}>
            {/* Icono */}
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
              <Feather name={notif.icon} size={18} color={notif.iconColor} />
            </View>

            {/* Contenido */}
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
                <Badge
                  text={notif.type}
                  color={notif.typeColor}
                  bg={notif.typeBg}
                />
              </Row>

              <Text
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                  lineHeight: 17,
                  marginBottom: 8,
                }}
              >
                {notif.body}
              </Text>

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
                <Row style={{ gap: 6 }}>
                  {notif.unread && (
                    <TouchableOpacity
                      onPress={() => onMarkRead(notif.id)}
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
                        Leído
                      </Text>
                    </TouchableOpacity>
                  )}
                  {notif.actionScreen && onNavigate && (
                    <TouchableOpacity
                      onPress={() => {
                        onMarkRead(notif.id);
                        onNavigate(notif.actionScreen);
                      }}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 6,
                        backgroundColor: C.teal,
                      }}
                    >
                      <Feather name="arrow-right" size={11} color="white" />
                      <Text
                        style={{
                          fontSize: 11,
                          color: "white",
                          fontWeight: "700",
                        }}
                      >
                        {notif.actionLabel}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    onPress={handleDismiss}
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
    </Animated.View>
  );
}

export default function Notificaciones({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("Todas");
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAllRead,
  } = useNotificaciones() || {};

  const notifs = notifications || [];
  const read = notifs.filter((n) => !n.unread).length;

  const visible = notifs.filter((n) => {
    if (activeTab === "Sin Leer") return n.unread;
    if (activeTab === "Reportes") return n.type === "Reporte";
    if (activeTab === "Citas") return n.type === "Cita";
    if (activeTab === "Alertas") return n.type === "Alerta";
    return true;
  });

  const groups = groupByDate(visible);

  // Contadores para badges en tabs
  const tabCounts = {
    "Sin Leer": notifs.filter((n) => n.unread).length,
    Reportes: notifs.filter((n) => n.type === "Reporte").length,
    Citas: notifs.filter((n) => n.type === "Cita").length,
    Alertas: notifs.filter((n) => n.type === "Alerta").length,
  };

  const handleDismissAllRead = () => {
    if (read === 0) return;
    Alert.alert(
      "Eliminar leídas",
      `¿Eliminar las ${read} notificación(es) ya leídas?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => dismissAllRead?.(),
        },
      ],
    );
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
            {loading
              ? "Cargando…"
              : `${unreadCount} sin leer · ${notifs.length} total`}
          </Text>
        </View>
        <Row style={{ gap: 8 }}>
          {/* Eliminar leídas */}
          {read > 0 && (
            <TouchableOpacity
              onPress={handleDismissAllRead}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 11,
                paddingVertical: 8,
                borderRadius: 9,
                backgroundColor: C.card,
              }}
            >
              <Feather name="trash-2" size={13} color={C.textMuted} />
              <Text
                style={{ fontSize: 12, color: C.textMuted, fontWeight: "600" }}
              >
                Limpiar leídas
              </Text>
            </TouchableOpacity>
          )}
          {/* Marcar todo como leído */}
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllAsRead?.()}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderWidth: 1,
                borderColor: C.teal,
                paddingHorizontal: 11,
                paddingVertical: 8,
                borderRadius: 9,
                backgroundColor: C.tealLighter,
              }}
            >
              <Feather name="check-square" size={13} color={C.teal} />
              <Text style={{ fontSize: 12, color: C.teal, fontWeight: "700" }}>
                Marcar todo leído
              </Text>
            </TouchableOpacity>
          )}
        </Row>
      </Row>

      {/* Stats */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard
          label="Sin Leer"
          value={String(unreadCount)}
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
          value={String(notifs.length)}
          icon="list"
          iconBg={C.blueLight}
          iconColor={C.blue}
        />
      </Row>

      {/* Tabs con badge de cantidad */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 18 }}
      >
        <Row style={{ gap: 8 }}>
          {TABS.map((tab) => {
            const isActive = tab === activeTab;
            const count = tabCounts[tab];
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: isActive ? C.teal : C.card,
                  borderWidth: 1,
                  borderColor: isActive ? C.teal : C.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: isActive ? "white" : C.textMuted,
                  }}
                >
                  {tab}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.3)"
                        : C.red,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text
                      style={{ fontSize: 9, color: "white", fontWeight: "700" }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Row>
      </ScrollView>

      {/* Lista agrupada por fecha */}
      {groups.length === 0 ? (
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
      ) : (
        groups.map((group) => (
          <View key={group.label} style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
            >
              {group.label}
            </Text>
            <View style={{ gap: 10 }}>
              {group.items.map((notif) => (
                <NotifCard
                  key={notif.id}
                  notif={notif}
                  onMarkRead={(id) => markAsRead?.(id)}
                  onDismiss={(id) => dismissNotification?.(id)}
                  onNavigate={onNavigate}
                />
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
