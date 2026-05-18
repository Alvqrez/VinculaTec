import { View, ScrollView, Platform } from "react-native";
import C from "../../constants/colors";
import Sidebar from "../../components/Sidebar";
import TopBar from "../../components/TopBar";
import { useState, useEffect } from "react";
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";

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

  useEffect(() => {
    initUser(usuario?.id);
    reloadNotifs();
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const views = {
    dashboard: <DashResidente onNavigate={setActiveNav} />,
    seguimiento: <Seguimiento />,
    "reporte-preliminar": <ReportePreliminar />,
    "reportes-parciales": <ReportesParciales />,
    "reporte-final": <ReporteFinal />,
    notificaciones: <Notificaciones onNavigate={setActiveNav} />,
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
        setActiveNav={setActiveNav}
        role="Residente"
        navItems={NAV}
        onLogout={onLogout}
        usuario={usuario}
        fotoPerfil={fotoPerfil}
      />
      <View style={{ flex: 1, flexDirection: "column" }}>
        <TopBar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          navItems={NAV}
          role="Residente"
          onLogout={onLogout}
          usuario={usuario}
          fotoPerfil={fotoPerfil}
        />
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {views[activeNav] || views.dashboard}
        </ScrollView>
      </View>
    </View>
  );
}
