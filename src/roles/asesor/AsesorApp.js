import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { AdaptiveLayout } from "../../mobile";
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
    <AdaptiveLayout
      activeNav={activeNav}
      setActiveNav={navigateTo}
      role="Asesor"
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
