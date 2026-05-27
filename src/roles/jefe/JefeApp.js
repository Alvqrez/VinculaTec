import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { AdaptiveLayout } from "../../mobile";
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";

import DashJefe from "./DashJefe";
import GestionEmpresas from "../../screens/GestionEmpresas";
import GestionProyectos from "../../screens/GestionProyectos";
import SeguimientoJefe from "../../screens/SeguimientoJefe";
import AsignacionJefe from "../../screens/AsignacionJefe";
import RegistrarUsuario from "../../screens/RegistrarUsuario";
import Utilerias from "../../screens/Utilerias";
import Notificaciones from "../../screens/Notificaciones";
import CalendarioCitas from "../../screens/CalendarioCitas";
import EstadisticasPeriodo from "../../screens/EstadisticasPeriodo";
import AdminSistema from "../jefe/AdminSistema";

// Sección de administración como grupo colapsable en el sidebar
const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "empresas", label: "Empresas", icon: "briefcase" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "asignacion", label: "Asignación", icon: "user-plus" },
  { id: "registrar", label: "Registrar", icon: "user-plus" },
  { id: "seguimiento", label: "Seguimiento", icon: "file-text" },
  { id: "estadisticas", label: "Estadísticas", icon: "bar-chart" },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
  {
    id: "admin",
    label: "Administración",
    icon: "settings",
    group: true,
    children: [
      { id: "admin_residentes", label: "Residentes", icon: "users" },
      { id: "admin_asesores", label: "Asesores", icon: "user-check" },
      { id: "admin_periodos", label: "Períodos", icon: "calendar" },
      {
        id: "admin_empresas_periodo",
        label: "Empresas / Período",
        icon: "briefcase",
      },
    ],
  },
  { id: "utilerias", label: "Utilerías", icon: "tool" },
];

// Mapea IDs de subnav a la sección (tab) que mostrará AdminSistema
const ADMIN_SECTION_MAP = {
  admin_residentes: "residentes",
  admin_asesores: "asesores",
  admin_periodos: "periodos",
  admin_empresas_periodo: "empresas_periodo",
};

export default function JefeApp({ usuario, onLogout }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const { getFoto, setFoto, initUser } = useFotos();
  const { reload: reloadNotifs } = useNotificaciones();
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
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const adminSection = ADMIN_SECTION_MAP[activeNav];

  const views = {
    dashboard: <DashJefe onNavigate={navigateTo} />,
    empresas: <GestionEmpresas />,
    proyectos: <GestionProyectos />,
    asignacion: <AsignacionJefe />,
    registrar: <RegistrarUsuario />,
    seguimiento: <SeguimientoJefe />,
    estadisticas: <EstadisticasPeriodo />,
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
    <AdaptiveLayout
      activeNav={activeNav}
      setActiveNav={navigateTo}
      role="Jefe de Vinculación"
      navItems={NAV}
      onLogout={onLogout}
      usuario={usuario}
      fotoPerfil={fotoPerfil}
      fadeAnim={fadeAnim}
    >
      {adminSection ? (
        <AdminSistema section={adminSection} />
      ) : (
        views[activeNav] || views.dashboard
      )}
    </AdaptiveLayout>
  );
}
