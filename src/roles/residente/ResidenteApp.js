import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { AdaptiveLayout } from "../../mobile";
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
    "reporte-final": <ReporteFinal usuario={usuario} />,
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
    <AdaptiveLayout
      activeNav={activeNav}
      setActiveNav={navigateTo}
      role="Residente"
      navItems={NAV}
      onLogout={onLogout}
      usuario={usuario}
      fotoPerfil={fotoPerfil}
      fadeAnim={fadeAnim}
    >
      {views[activeNav] || views.dashboard}
    </AdaptiveLayout>
  );
}
