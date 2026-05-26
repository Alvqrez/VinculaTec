import { View, Text, Image, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

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

export default function MobileTopBar({
  usuario,
  role,
  fotoPerfil,
  onNavigate,
  onLogout,
}) {
  const { colors: C } = useTheme();

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
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
      }}
    >
      {/* Perfil compacto */}
      <TouchableOpacity
        onPress={() => onNavigate && onNavigate("utilerias")}
        style={{
          flexDirection: "row",
          alignItems: "center",
          flex: 1,
        }}
        activeOpacity={0.8}
      >
        {fotoPerfil ? (
          <Image
            source={{ uri: fotoPerfil }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: C.teal,
            }}
          />
        ) : (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: C.teal,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
              {initials}
            </Text>
          </View>
        )}
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text
            style={{
              fontSize: 12,
              color: C.textLight,
              marginBottom: 2,
            }}
          >
            {getSaludo()}
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: C.text,
            }}
            numberOfLines={1}
          >
            {usuario?.nombre || "Usuario"}
          </Text>
          <Text
            style={{
              fontSize: 10,
              color: C.teal,
              fontWeight: "500",
            }}
          >
            {getRolLabel(role)}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Botón logout */}
      <TouchableOpacity
        onPress={onLogout}
        style={{
          padding: 8,
          marginLeft: 8,
        }}
        activeOpacity={0.7}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Feather name="log-out" size={22} color={C.red || "#EF4444"} />
      </TouchableOpacity>
    </View>
  );
}
