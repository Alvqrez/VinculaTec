import { useState, useEffect, useRef } from "react";
import { View, Platform, Animated, ScrollView } from "react-native";
import C from "../../constants/colors";
import { useTheme } from "../../context/ThemeContext";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useProyectos } from "../../context/ProyectosContext";

import DashAsesor from "./DashAsesor";
import ProyectosAsesor from "./ProyectosAsesor";
import SeguimientoAsesor from "../../screens/SeguimientoAsesor";
import Utilerias from "../../screens/Utilerias";
import Notificaciones from "../../screens/Notificaciones";
import CalendarioCitas from "../../screens/CalendarioCitas";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "seguimiento", label: "Reportes", icon: "file-text" },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
  { id: "utilerias", label: "Utilerías", icon: "tool" },
];

export default function AsesorApp({ usuario, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const { getFoto, setFoto, initUser } = useFotos();
  const { reload: reloadNotifs } = useNotificaciones();
  const { reload: reloadProyectos } = useProyectos();

  const { isDark } = useTheme();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const navigateTo = (id) => {
    if (id === activeNav) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start(() => {
      setActiveNav(id);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    });
  };

  useEffect(() => {
    initUser(usuario?.id);
    reloadNotifs();
    reloadProyectos();
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const views = {
    dashboard: <DashAsesor onNavigate={navigateTo} />,
    proyectos: <ProyectosAsesor />,
    seguimiento: <SeguimientoAsesor />,
    notificaciones: <Notificaciones onNavigate={navigateTo} />,
    calendario: <CalendarioCitas />,
    utilerias: (
      <Utilerias
        fotoPerfil={fotoPerfil}
        setFotoPerfil={setFotoPerfil}
        usuario={usuario}
        role="Asesor"
      />
    ),
  };

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
        setActiveNav={navigateTo}
        role="Asesor"
        navItems={NAV}
        onLogout={onLogout}
        usuario={usuario}
        fotoPerfil={fotoPerfil}
      />
      <View style={{ flex: 1, flexDirection: "column" }}>
        <TopBar
          activeNav={activeNav}
          setActiveNav={navigateTo}
          navItems={NAV}
          role="Asesor"
          onLogout={onLogout}
          usuario={usuario}
          fotoPerfil={fotoPerfil}
        />
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 24 }}
          >
            {views[activeNav] || views.dashboard}
          </ScrollView>
        </Animated.View>
      </View>
    </View>
  );
}
