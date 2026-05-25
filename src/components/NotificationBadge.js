import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../context/ThemeContext";

/**
 * Badge para contador de notificaciones no leídas
 * Mantenedor de consistencia visual con el sistema existente
 */
export function NotificationBadge({ count, size = "small" }) {
  const { colors: C } = useTheme();

  if (!count || count <= 0) {
    return null;
  }

  const badgeSize = size === "small" ? 16 : 20;
  const fontSize = size === "small" ? 10 : 12;
  const borderRadius = badgeSize / 2;

  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: C.red,
          width: badgeSize,
          height: badgeSize,
          borderRadius,
          minWidth: badgeSize,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: "white",
            fontSize,
            fontWeight: "600",
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
}

/**
 * Indicador de punto para notificaciones no leídas
 * Más sutil que el badge contador
 */
export function UnreadIndicator({ size = "small" }) {
  const { colors: C } = useTheme();

  const indicatorSize = size === "small" ? 6 : 8;
  const borderRadius = indicatorSize / 2;

  return (
    <View
      style={[
        styles.indicator,
        {
          backgroundColor: C.red,
          width: indicatorSize,
          height: indicatorSize,
          borderRadius,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  indicator: {
    position: "absolute",
    top: 2,
    right: 2,
    zIndex: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  text: {
    textAlign: "center",
    includeFontPadding: false,
  },
});
