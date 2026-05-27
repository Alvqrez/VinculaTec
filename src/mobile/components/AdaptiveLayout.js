import { View, Platform, Animated, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../context/ThemeContext";
import { useResponsive } from "../hooks/useResponsive";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import MobileBottomNav from "./MobileBottomNav";
import MobileTopBar from "./MobileTopBar";

export default function AdaptiveLayout({
  activeNav,
  setActiveNav,
  role,
  navItems = [],
  onLogout,
  usuario,
  fotoPerfil,
  children,
  fadeAnim,
}) {
  const { colors: C, isDark } = useTheme();
  const { isMobile } = useResponsive();

  // Layout para Móvil
  if (isMobile) {
    return (
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDark ? "#0D1117" : C.bg },
        ]}
        edges={["top"]}
      >
        {/* Top Bar móvil compacto */}
        <MobileTopBar
          usuario={usuario}
          role={role}
          fotoPerfil={fotoPerfil}
          onNavigate={setActiveNav}
          onLogout={onLogout}
        />

        {/* Contenido principal */}
        <View style={styles.content}>
          <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.mobileContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </View>

        {/* Bottom Navigation */}
        <MobileBottomNav
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          navItems={navItems}
        />
      </SafeAreaView>
    );
  }

  // Layout Desktop/Web (original)
  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        height: Platform.OS === "web" ? "100vh" : "100%",
        backgroundColor: isDark ? "#0D1117" : C.bg,
      }}
    >
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        role={role}
        navItems={navItems}
        onLogout={onLogout}
        usuario={usuario}
        fotoPerfil={fotoPerfil}
      />
      <View style={{ flex: 1, flexDirection: "column" }}>
        <TopBar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          role={role}
          navItems={navItems}
          onLogout={onLogout}
          usuario={usuario}
          fotoPerfil={fotoPerfil}
        />
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={{ flex: 1, backgroundColor: C.bg }}
            contentContainerStyle={{ padding: 24 }}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  mobileContent: {
    padding: 16,
    paddingBottom: 100, // Espacio para bottom nav
  },
});
