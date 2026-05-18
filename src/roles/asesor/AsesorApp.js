import { useState, useEffect } from "react";//importamos el hook useState de React para manejar el estado de la navegación activa en la aplicación del asesor
import { View, ScrollView, Platform } from "react-native";//importamos los componentes necesarios de React y React Native para construir la interfaz de usuario de la aplicación del asesor
import C from "../../constants/colors"; //no estoy seguro de esto pero creo que son las "constantes de colores" que se usan en la app
import Sidebar from "../../components/Sidebar";//componente de barra lateral que se usa para navegar entre las diferentes secciones de la app
import TopBar from "../../components/TopBar";//componente de barra superior que se usa para mostrar el nombre del usuario y un botón de cerrar sesión
import { useFotos } from "../../context/FotosContext";
import { useNotificaciones } from "../../context/NotificacionesContext";//hook personalizado para manejar las fotos de perfil de los usuarios en la aplicación

import DashAsesor from "./DashAsesor";//componente que muestra el dashboard del asesor con información relevante y accesos rápidos a las diferentes secciones de la app
import ProyectosAsesor from "./ProyectosAsesor";//componente que muestra la lista de proyectos asignados al asesor, con opciones para ver detalles, editar o eliminar cada proyecto
import SeguimientoAsesor from "../../screens/SeguimientoAsesor";
import Utilerias from "../../screens/Utilerias";//componente que muestra herramientas y recursos útiles para el asesor, como tutoriales, guías, plantillas, etc.
import Notificaciones from "../../screens/Notificaciones";//componente que muestra las notificaciones recibidas por el asesor, como mensajes de los estudiantes, recordatorios de reuniones, etc.
import CalendarioCitas from "../../screens/CalendarioCitas";//componente que muestra el calendario de citas del asesor, con opciones para agregar, editar o eliminar citas, y ver detalles de cada cita

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "proyectos", label: "Proyectos", icon: "folder" },
  { id: "seguimiento", label: "Reportes", icon: "file-text" },
  { id: "notificaciones", label: "Notificaciones", icon: "bell" },
  { id: "calendario", label: "Calendario", icon: "calendar" },
  { id: "utilerias", label: "Utilerías", icon: "tool" },
];
/**
 * Componente principal de la aplicación del asesor, que maneja la navegación entre las diferentes secciones y muestra el
 * contenido correspondiente según la sección activa. Recibe el usuario actual y una función para cerrar sesión como props.
 * @param {Object} props - Las propiedades del componente.
 * @param {Object} props.usuario - El usuario actual que ha iniciado sesión.
 * @param {Function} props.onLogout - Función para cerrar sesión.
 * @returns {JSX.Element} El componente de la aplicación del asesor.
 */

/**
 * A lo que entendí (porque ese ultimo comentario de arriba lo puso la IA) es que lo de nav es un arreglo que contiene todos
 * los datos de la navegación de la AsesorApp, cada objeto del arreglo representa una sección de la aplicación o pantalla
 * del asesor, con un id único, una etiqueta para mostrar en la barra lateral y un icono asociado. Este arreglo se utiliza para generar
 * dinámicamente los elementos de navegación en la barra lateral y para determinar qué componente mostrar en el área principal de la aplicación
 * según la sección activa seleccionada por el usuario.
 */

export default function AsesorApp({ usuario, onLogout }) {
  /**a lo que entiendo el usaurio y en onLogout los saca de algún tipo de padre. Usuario es 
   * lo el que ha iniciado sesión y el onLogout es para salirse de AsesorApp.
  */
  const [activeNav, setActiveNav] = useState("dashboard");
  const { getFoto, setFoto, initUser } = useFotos();
  const { reload: reloadNotifs } = useNotificaciones();

  // Cargar foto y notificaciones desde BD al montar (después del login)
  useEffect(() => {
    initUser(usuario?.id);
    reloadNotifs();
  }, [usuario?.id]);

  const fotoPerfil = getFoto(usuario?.id);
  const setFotoPerfil = (foto) => setFoto(usuario?.id, foto);

  const views = {
    dashboard: <DashAsesor onNavigate={setActiveNav} />,
    proyectos: <ProyectosAsesor />,
    seguimiento: <SeguimientoAsesor />,
    notificaciones: <Notificaciones onNavigate={setActiveNav} />,
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
  /**
   * Función que se encargar de setear los componente que se muestran en la parte principal de esta pantalla
   * como parametros tiene usuario
   * 
   * Y la parte de utilerias tiene 
   * para poner la foto de perfil, y todas estas cosas de la foto junto "role=Asesor" que supongo 
   * es para indicar el rol que se está usando.
   */

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        height: Platform.OS === "web" ? "100vh" : "100%",
        backgroundColor: C.bg,
      }}
      /**
       * El componente principal de la aplicación del asesor se estructura como una vista con flexbox en dirección de fila,
       * lo que permite tener una barra lateral fija a la izquierda y un área principal a la derecha.
       * La altura se ajusta para ocupar toda la pantalla, utilizando "100vh" en web y "100%" en otras plataformas.
       * El fondo se establece con un color definido en las constantes de colores (C.bg). Dentro de esta vista
       * se renderiza el componente Sidebar para la navegación y un ScrollView para mostrar el contenido correspondiente
       * a la sección activa seleccionada por el usuario.
       */
    >
      <Sidebar
        activeNav={activeNav}
        setActiveNav={setActiveNav}
        role="Asesor"
        navItems={NAV}
        onLogout={onLogout}
        usuario={usuario}
        fotoPerfil={fotoPerfil}
        //barra lateral
      />
  
      <View style={{ flex: 1, flexDirection: "column" }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 24 }}>
          {views[activeNav] || views.dashboard}
        </ScrollView>
      </View>
    </View>
  );
}
