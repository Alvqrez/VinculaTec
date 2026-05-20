import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import Row from "./Row";
import { useNotificaciones } from "../context/NotificacionesContext";

const groupHasActive = (group, activeNav) =>
  group.children?.some((c) => c.id === activeNav) ?? false;

function getSaludo() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return "¡Buenos días!";
  if (h >= 12 && h < 19) return "¡Buenas tardes!";
  return "¡Buenas noches!";
}

function getRolLabel(role) {
  if (!role) return "Usuario";
  const r = role.toLowerCase();
  if (r === "residente") return "Residente";
  if (r === "asesor") return "Asesor";
  if (r === "jefe") return "Jefe de Vinculación";
  return role;
}

// Item de navegación con animación de fondo al activarse
function NavItem({
  id,
  label,
  icon,
  indent = false,
  activeNav,
  setActiveNav,
  unreadCount,
}) {
  const active = activeNav === id;
  const count = id === "notificaciones" ? unreadCount : 0;

  // Animación del fondo al activarse
  const bgAnim = useRef(new Animated.Value(active ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(bgAnim, {
      toValue: active ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [active]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(13,148,136,0)", "rgba(13,148,136,0.22)"],
  });

  return (
    <TouchableOpacity onPress={() => setActiveNav(id)} activeOpacity={0.75}>
      <Animated.View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 9,
          paddingHorizontal: 12,
          paddingLeft: indent ? 28 : 12,
          borderRadius: 9,
          backgroundColor: bgColor,
          marginBottom: 2,
          // Barra lateral izquierda en el item activo
          borderLeftWidth: active ? 3 : 0,
          borderLeftColor: "#5EEAD4",
          paddingLeft: active ? (indent ? 25 : 9) : indent ? 28 : 12,
        }}
      >
        {indent && (
          <View
            style={{
              width: 2,
              height: 16,
              backgroundColor: active ? "#5EEAD4" : "rgba(255,255,255,0.1)",
              borderRadius: 1,
              marginRight: -2,
            }}
          />
        )}
        <Feather
          name={icon}
          size={15}
          color={active ? "#5EEAD4" : C.textLight}
        />
        <Text
          style={{
            color: active ? "#5EEAD4" : C.textLight,
            fontSize: 13,
            fontWeight: active ? "700" : "500",
            flex: 1,
          }}
        >
          {label}
        </Text>
        {count > 0 && (
          <View
            style={{
              minWidth: 18,
              height: 18,
              backgroundColor: C.red,
              borderRadius: 9,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
              {count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Grupo colapsable con animación del chevron
function GroupItem({
  item,
  activeNav,
  setActiveNav,
  unreadCount,
  openGroups,
  toggleGroup,
}) {
  const isOpen = openGroups[item.id] ?? false;
  const childActive = groupHasActive(item, activeNav);

  // Rotación animada del chevron
  const chevronAnim = useRef(new Animated.Value(isOpen ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(chevronAnim, {
      toValue: isOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOpen]);

  const chevronRotate = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <View>
      <TouchableOpacity
        onPress={() => toggleGroup(item.id)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingVertical: 9,
          paddingHorizontal: 12,
          borderRadius: 9,
          backgroundColor: childActive ? "rgba(13,148,136,0.1)" : "transparent",
          marginBottom: 2,
        }}
      >
        <Feather
          name={item.icon}
          size={15}
          color={childActive ? "#5EEAD4" : C.textLight}
        />
        <Text
          style={{
            flex: 1,
            color: childActive ? "#5EEAD4" : C.textLight,
            fontSize: 13,
            fontWeight: childActive ? "700" : "500",
          }}
        >
          {item.label}
        </Text>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather
            name="chevron-down"
            size={13}
            color={childActive ? "#5EEAD4" : "#3D5A8A"}
          />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={{ marginBottom: 4 }}>
          {item.children.map((child) => (
            <NavItem
              key={child.id}
              {...child}
              indent
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              unreadCount={unreadCount}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function Sidebar({
  activeNav,
  setActiveNav,
  role,
  navItems = [],
  onLogout,
  usuario,
  fotoPerfil,
}) {
  const { unreadCount } = useNotificaciones() || { unreadCount: 0 };

  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    navItems.forEach((item) => {
      if (item.group) init[item.id] = groupHasActive(item, activeNav);
    });
    return init;
  });

  const toggleGroup = (id) =>
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const initials = usuario?.nombre
    ? usuario.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <View
      style={{
        width: 230,
        backgroundColor: C.navy,
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* ── Perfil ── */}
      <TouchableOpacity
        onPress={() => setActiveNav && setActiveNav("utilerias")}
        activeOpacity={0.85}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.07)",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 11,
            fontWeight: "500",
            marginBottom: 3,
          }}
        >
          {getSaludo()}
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 14,
            fontWeight: "800",
            marginBottom: 10,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {usuario?.nombre || "Usuario"}
        </Text>
        {fotoPerfil ? (
          <Image
            source={{ uri: fotoPerfil }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              borderWidth: 2,
              borderColor: C.teal,
              marginBottom: 8,
            }}
          />
        ) : (
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: C.teal,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 8,
              borderWidth: 2,
              borderColor: "rgba(94,234,212,0.35)",
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 18 }}>
              {initials}
            </Text>
          </View>
        )}
        <View
          style={{
            backgroundColor: "rgba(13,148,136,0.2)",
            borderRadius: 20,
            paddingVertical: 3,
            paddingHorizontal: 12,
            marginBottom: 7,
            borderWidth: 1,
            borderColor: "rgba(94,234,212,0.2)",
          }}
        >
          <Text style={{ color: "#5EEAD4", fontSize: 10, fontWeight: "700" }}>
            {getRolLabel(role)}
          </Text>
        </View>
        <Row style={{ alignItems: "center", gap: 3 }}>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>
            Ver perfil
          </Text>
          <Feather name="arrow-right" size={9} color="rgba(255,255,255,0.4)" />
        </Row>
      </TouchableOpacity>

      {/* ── Navegación ── */}
      <ScrollView style={{ flex: 1, padding: 10 }}>
        <Text
          style={{
            fontSize: 9,
            fontWeight: "700",
            color: "#3D5A8A",
            textTransform: "uppercase",
            letterSpacing: 1,
            marginBottom: 8,
            paddingHorizontal: 6,
          }}
        >
          Navegación
        </Text>
        {navItems.map((item) =>
          item.group ? (
            <GroupItem
              key={item.id}
              item={item}
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              unreadCount={unreadCount}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
            />
          ) : (
            <NavItem
              key={item.id}
              {...item}
              activeNav={activeNav}
              setActiveNav={setActiveNav}
              unreadCount={unreadCount}
            />
          ),
        )}
      </ScrollView>

      {/* ── Logout ── */}
      <TouchableOpacity
        onPress={onLogout}
        style={{
          padding: 14,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.07)",
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: "rgba(239,68,68,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="log-out" size={15} color="#EF4444" />
        </View>
        <Text style={{ color: "#EF4444", fontSize: 13, fontWeight: "600" }}>
          Cerrar sesión
        </Text>
      </TouchableOpacity>
    </View>
  );
}
