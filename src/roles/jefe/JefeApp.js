import { useState, useEffect, useRef } from "react";
import { View, Platform, Animated } from "react-native";
import C from "../../constants/colors";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";

import DashJefe from "./DashJefe";
import GestionEmpresas from "../../screens/GestionEmpresas";
import GestionProyectos from "../../screens/GestionProyectos";
import SeguimientoJefe from "../../screens/SeguimientoJefe";
import AsignacionJefe from "../../screens/AsignacionJefe";
import Utilerias from "../../screens/Utilerias";
import Notificaciones from "../../screens/Notificaciones";
import CalendarioCitas from "../../screens/CalendarioCitas";
import { ScrollView } from "react-native";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "empresas", label: "Empresas", icon: "briefcase" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "asignacion", label: "Asignación", icon: "user-plus" },
  { id: "seguimiento", label: "Seguimiento", icon: "file-text" },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
  { id: "utilerias", label: "Utilerías", icon: "tool" },
];

function JefeAppInner({ usuario, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const { getFoto, setFoto, initUser } = useFotos();
  const { reload: reloadNotifs } = useNotificaciones();

  // Animación de fade al cambiar de sección
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const navigateTo = (id) => {
    if (id === activeNav) return;
    // Fade out → cambiar vista → fade in
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
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const views = {
    dashboard: <DashJefe onNavigate={navigateTo} />,
    empresas: <GestionEmpresas />,
    proyectos: <GestionProyectos />,
    asignacion: <AsignacionJefe />,
    seguimiento: <SeguimientoJefe />,
    notificaciones: <Notificaciones onNavigate={navigateTo} />,
    calendario: <CalendarioCitas />,
    utilerias: (
      <Utilerias
        fotoPerfil={fotoPerfil}
        setFotoPerfil={setFotoPerfil}
        usuario={usuario}
        role="Jefe de Vinculación"
      />
    ),
  };

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        height: Platform.OS === "web" ? "100vh" : "100%",
        backgroundColor: C.bg,
      }}
    >
      <Sidebar
        activeNav={activeNav}
        setActiveNav={navigateTo}
        role="Jefe de Vinculación"
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
          role="Jefe de Vinculación"
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

export default function JefeApp({ usuario, onLogout }) {
  return <JefeAppInner usuario={usuario} onLogout={onLogout} />;
}
