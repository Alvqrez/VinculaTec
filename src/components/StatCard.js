import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Row from "./Row";

export default function StatCard({ label, value, sub, icon, iconBg, iconColor, trend, trendUp }) {
  const { colors: C } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: C.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.border,
        padding: 18,
      }}
    >
      <Row style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 11,
            backgroundColor: iconBg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={icon} size={18} color={iconColor} />
        </View>
        {trend && (
          <Row style={{ alignItems: "center", gap: 3 }}>
            <Feather name={trendUp ? "arrow-up" : "arrow-down"} size={11} color={trendUp ? C.green : C.red} />
            <Text style={{ fontSize: 11, fontWeight: "700", color: trendUp ? C.green : C.red }}>{trend}</Text>
          </Row>
        )}
      </Row>
      <Text style={{ fontSize: 26, fontWeight: "800", color: C.text, lineHeight: 28 }}>{value}</Text>
      <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 4, fontWeight: "500" }}>{label}</Text>
      {sub && <Text style={{ fontSize: 11, color: C.textLight, marginTop: 3 }}>{sub}</Text>}
    </View>
  );
}
