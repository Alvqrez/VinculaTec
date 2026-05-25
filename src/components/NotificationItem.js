import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { UnreadIndicator } from "./NotificationBadge";

/**
 * Componente de item de notificación con indicadores visuales
 * Mantenedor de consistencia con el diseño existente
 */
export function NotificationItem({ 
  notification, 
  onPress, 
  onMarkAsRead,
  style 
}) {
  const { colors: C } = useTheme();
  
  const isUnread = notification.unread;
  
  const handlePress = () => {
    if (isUnread && onMarkAsRead) {
      onMarkAsRead(notification.id);
    }
    if (onPress) {
      onPress(notification);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: isUnread ? C.grayLight : C.white,
          borderLeftColor: notification.typeColor || C.textMuted
        },
        style
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Indicador de no leído */}
      {isUnread && <UnreadIndicator />}
      
      {/* Icono */}
      <View style={[
        styles.iconContainer,
        { backgroundColor: notification.iconBg || C.grayLight }
      ]}>
        <Feather 
          name={notification.icon || "bell"} 
          size={16} 
          color={notification.iconColor || C.textMuted} 
        />
      </View>
      
      {/* Contenido */}
      <View style={styles.content}>
        <Text style={[
          styles.title,
          { 
            color: C.text,
            fontWeight: isUnread ? "600" : "400"
          }
        ]}>
          {notification.title}
        </Text>
        
        {notification.body && (
          <Text style={[
            styles.body,
            { color: C.textMuted }
          ]} numberOfLines={2}>
            {notification.body}
          </Text>
        )}
        
        <View style={styles.footer}>
          <Text style={[
            styles.time,
            { color: C.textMuted }
          ]}>
            {notification.time}
          </Text>
          
          {notification.actionLabel && (
            <Text style={[
              styles.actionLabel,
              { color: C.primary }
            ]}>
              {notification.actionLabel}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 12,
    marginVertical: 2,
    marginHorizontal: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    fontSize: 11,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
});
