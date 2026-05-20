import { useState, useEffect, useRef } from "react";
import { View, Platform, Animated, ScrollView } from "react-native";
import C from "../../constants/colors";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { useReportes } from "../../context/ReportesContext";

import DashResidente from "./DashResidente";
import Seguimiento from "../../screens/Seguimiento";
import ReportePreliminar from "../../screens/ReportePreliminar";
import ReportesParciales from "../../screens/ReportesParciales";
import ReporteFinal from "../../screens/ReporteFinal";
import Utilerias from "../../screens/Utilerias";
import Notificaciones from "../../screens/Notificaciones";
import CalendarioCitas from "../../screens/CalendarioCitas";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "seguimiento", label: "Seguimiento", icon: "file-text" },
  {
    id: "reportes-grupo",
    label: "Reportes",
    icon: "book",
    group: true,
    children: [
      { id: "reporte-preliminar", label: "Reporte Preliminar", icon: "edit" },
      { id: "reportes-parciales", label: "Reportes Parciales", icon: "layers" },
      { id: "reporte-final", label: "Reporte Final", icon: "book-open" },
    ],
  },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
  { id: "utilerias", label: "Utilerías", icon: "tool" },
];

export default function ResidenteApp({ usuario, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const { getFoto, setFoto, initUser } = useFotos();
  const { reload: reloadNotifs } = useNotificaciones();
  const { reload: reloadReportes } = useReportes();

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
    reloadReportes();
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const views = {
    dashboard: <DashResidente onNavigate={navigateTo} />,
    seguimiento: <Seguimiento />,
    "reporte-preliminar": <ReportePreliminar />,
    "reportes-parciales": <ReportesParciales />,
    "reporte-final": <ReporteFinal />,
    notificaciones: <Notificaciones onNavigate={navigateTo} />,
    calendario: <CalendarioCitas />,
    utilerias: (
      <Utilerias
        fotoPerfil={fotoPerfil}
        setFotoPerfil={setFotoPerfil}
        usuario={usuario}
        role="Residente"
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
        role="Residente"
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
          role="Residente"
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
