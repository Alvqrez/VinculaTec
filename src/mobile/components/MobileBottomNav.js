import { View, TouchableOpacity, Text, ScrollView, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useState, useRef, useEffect } from "react";

// Flatten nav items (expand groups)
const flattenNavItems = (items) => {
  const result = [];
  items.forEach((item) => {
    if (item.group && item.children) {
      result.push(...item.children);
    } else {
      result.push(item);
    }
  });
  return result;
};

export default function MobileBottomNav({
  activeNav,
  setActiveNav,
  navItems = [],
  onMorePress,
}) {
  const { colors: C } = useTheme();
  const { unreadCount } = useNotificaciones() || { unreadCount: 0 };
  const [showMore, setShowMore] = useState(false);

  const flatItems = flattenNavItems(navItems);
  // Mostrar máximo 5 items principales, el resto va en "Más"
  const mainItems = flatItems.slice(0, 4);
  const moreItems = flatItems.slice(4);
  const hasMore = moreItems.length > 0;

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: showMore ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  }, [showMore]);

  const handleNavPress = (id) => {
    setShowMore(false);
    setActiveNav(id);
  };

  return (
    <View>
      {/* Menú expandible "Más" */}
      {showMore && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 70,
            left: 12,
            right: 12,
            backgroundColor: C.card,
            borderRadius: 16,
            padding: 12,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
            elevation: 8,
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <ScrollView style={{ maxHeight: 280 }}>
            {moreItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => handleNavPress(item.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius: 8,
                  backgroundColor: activeNav === item.id ? `${C.teal}20` : "transparent",
                }}
              >
                <Feather
                  name={item.icon}
                  size={18}
                  color={activeNav === item.id ? C.teal : C.textLight}
                />
                <Text
                  style={{
                    marginLeft: 12,
                    fontSize: 14,
                    color: activeNav === item.id ? C.teal : C.text,
                    fontWeight: activeNav === item.id ? "600" : "400",
                  }}
                >
                  {item.label}
                </Text>
                {item.id === "notificaciones" && unreadCount > 0 && (
                  <View
                    style={{
                      marginLeft: "auto",
                      minWidth: 20,
                      height: 20,
                      backgroundColor: C.red,
                      borderRadius: 10,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 10, fontWeight: "700" }}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Bottom Navigation Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          paddingVertical: 8,
          paddingHorizontal: 4,
          backgroundColor: C.card,
          borderTopWidth: 1,
          borderTopColor: C.border,
          paddingBottom: 20, // Safe area for notch
        }}
      >
        {mainItems.map((item) => {
          const isActive = activeNav === item.id;
          const count = item.id === "notificaciones" ? unreadCount : 0;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => handleNavPress(item.id)}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 4,
                paddingHorizontal: 8,
                minWidth: 56,
                minHeight: 44, // Touch target mínimo
              }}
              activeOpacity={0.7}
            >
              <View style={{ position: "relative" }}>
                <Feather
                  name={item.icon}
                  size={22}
                  color={isActive ? C.teal : C.textLight}
                />
                {count > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -8,
                      minWidth: 16,
                      height: 16,
                      backgroundColor: C.red,
                      borderRadius: 8,
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 9, fontWeight: "700" }}>
                      {count > 99 ? "99+" : count}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 2,
                  color: isActive ? C.teal : C.textLight,
                  fontWeight: isActive ? "600" : "400",
                }}
                numberOfLines={1}
              >
                {item.label}
              </Text>
              {isActive && (
                <View
                  style={{
                    position: "absolute",
                    bottom: -4,
                    width: 4,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: C.teal,
                  }}
                />
              )}
            </TouchableOpacity>
          );
        })}

        {/* Botón "Más" si hay items adicionales */}
        {hasMore && (
          <TouchableOpacity
            onPress={() => setShowMore(!showMore)}
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingVertical: 4,
              paddingHorizontal: 8,
              minWidth: 56,
              minHeight: 44,
            }}
            activeOpacity={0.7}
          >
            <Feather
              name={showMore ? "x" : "more-horizontal"}
              size={22}
              color={showMore ? C.teal : C.textLight}
            />
            <Text
              style={{
                fontSize: 10,
                marginTop: 2,
                color: showMore ? C.teal : C.textLight,
                fontWeight: showMore ? "600" : "400",
              }}
            >
              Más
            </Text>
            {showMore && (
              <View
                style={{
                  position: "absolute",
                  bottom: -4,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: C.teal,
                }}
              />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
