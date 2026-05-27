import { getAuthToken } from "../../context/AuthContext";
import { API_BASE } from "../../config/api";
import { PieChart } from "react-native-chart-kit";
import { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import {
  Row,
  Card,
  StatCard,
  Badge,
  ProgressBar,
  SectionTitle,
} from "../../components";
import { useProyectos } from "../../context/ProyectosContext";
import { useFotos } from "../../context/FotosContext";

// PieChart usando react-native-chart-kit (librería robusta, misma que usa el Jefe)
// FIXED: El componente anterior usaba un truco CSS de bordes que no renderizaba
//        correctamente para ángulos arbitrarios. Este usa la librería adecuada.

const screenWidth = Dimensions.get('window').width;
const isMobile = screenWidth < 768;

export default function DashAsesor({ onNavigate }) {
  const { colors: C } = useTheme();
  const { getFoto } = useFotos() || { getFoto: () => null };
  const [expandedResidente, setExpandedResidente] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [periodoFilter, setPeriodoFilter] = useState("todo");

  // Estados para datos reales del backend (ÚNICA FUENTE DE VERDAD)
  const [backendData, setBackendData] = useState({
    totalResidentes: 0,
    proyectosActivos: 0,
    reportesPendientes: 0,
    proximasCitas: [],
  });
  const [loadingBackend, setLoadingBackend] = useState(false);
  const [errorBackend, setErrorBackend] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoadingBackend(true);
      try {
        const token = getAuthToken();
        const headers = { "Content-Type": "application/json" };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/asesor/dashboard`, {
          headers,
        });
        const json = await res.json();
        if (!json.ok) {
          setErrorBackend(json.mensaje || "Error al cargar dashboard");
          return;
        }
        setBackendData(json.data || {});
      } catch (err) {
        setErrorBackend("Error de conexión. ¿Backend corriendo en :3001?");
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoadingBackend(false);
      }
    };
    fetchDashboard();
  }, []);

  // Cargar proyectos solo para el listado de residentes (no para gráfica)
  const { proyectos } = useProyectos() || { proyectos: [] };

  const allResidentes = useMemo(() => {
    const res = [];
    proyectos.forEach((p) => {
      (p.residentes || []).forEach((r) => {
        if (!res.find((x) => x.nombre === r.nombre)) {
          res.push({
            ...r,
            proyecto: p.title,
            empresa: p.company,
            proyectoId: p.id,
            fase: p.phase,
          });
        }
      });
    });
    return res;
  }, [proyectos]);

  const allReportes = useMemo(() => {
    const reps = [];
    proyectos.forEach((p) => {
      (p.reportes || []).forEach((r) =>
        reps.push({ ...r, proyecto: p.title, proyectoId: p.id }),
      );
    });
    return reps;
  }, [proyectos]);

  const allReuniones = useMemo(() => {
    const reuniones = [];
    proyectos.forEach((p) => {
      (p.reuniones || []).forEach((r) => reuniones.push({ ...r, proyecto: p.title }));
    });
    return reuniones;
  }, [proyectos]);

  // GRÁFICA: Datos de ESTADO DE REPORTES (no fases de proyectos)
  // Formato para react-native-chart-kit PieChart
  const datosGraficaReal = useMemo(() => {
    // Usar los datos filtrados por período (coherente con las barras inferiores)
    const data = [
      {
        name: "Desarrollo",
        population: enDesarrollo,
        color: "#F59E0B",
        legendFontColor: "#6B7280",
        legendFontSize: 12,
      },
      {
        name: "Revisión",
        population: enRevision,
        color: "#8B5CF6",
        legendFontColor: "#6B7280",
        legendFontSize: 12,
      },
      {
        name: "Concluidos",
        population: concluidos,
        color: "#10B981",
        legendFontColor: "#6B7280",
        legendFontSize: 12,
      },
    ].filter((d) => d.population > 0);

    // Si no hay datos, devolver un placeholder para que la gráfica no crashee
    if (data.length === 0) {
      return [
        {
          name: "Sin reportes",
          population: 1,
          color: "#E5E7EB",
          legendFontColor: C.text,
          legendFontSize: 12,
        },
      ];
    }

    return data;
  }, [filteredAceptados, filteredPendientes, filteredPorCorregir, C.green, C.amber, C.red]);

  // Convertir citas del backend al formato de reuniones
  const proximasReuniones = useMemo(() => {
    return backendData.proximasCitas.map((cita) => ({
      titulo: cita.motivo,
      fecha: new Date(cita.fecha_hora).toLocaleDateString(),
      hora: new Date(cita.fecha_hora).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      modalidad: "Presencial",
      proyecto: "Cita",
    }));
  }, [(backendData.proximasCitas || []).map]);

  // Usar SIEMPRE datos del backend (nunca del Context como fallback)
  const residentesActivos = backendData.totalResidentes;
  const proyectosActivos = backendData.proyectosActivos;
  const reportesPendientes = backendData.reportesPendientes;
  const reportesAceptados = allReportes.filter(
    (r) => r.status === "Aceptado",
  ).length;
  const reportesPorCorregir = allReportes.filter(
    (r) => r.status === "Por corregir",
  ).length;
  const reportesTotal = allReportes.length;
  const promedioAprobacion =
    reportesTotal > 0
      ? Math.round((reportesAceptados / reportesTotal) * 100)
      : 0;

  const alertasRezagados = useMemo(() => {
    const ahora = new Date();
    return allReportes.filter((r) => {
      if (r.status !== "Pendiente") return false;
      if (!r.fecha) return false; // Sin fecha de entrega → aún no enviado
      const fechaEnvio = new Date(r.fecha);
      if (isNaN(fechaEnvio.getTime())) return false; // Fecha inválida
      const diasEnRevision = Math.floor(
        (ahora - fechaEnvio) / (1000 * 60 * 60 * 24),
      );
      return diasEnRevision > 5;
    });
  }, [allReportes]);

  const pieData = [
    { label: "Aceptados", value: reportesAceptados, color: C.green },
    { label: "Pendientes", value: reportesPendientes, color: C.amber },
    { label: "Por corregir", value: reportesPorCorregir, color: C.red },
  ];

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const results = [];
    allResidentes.forEach((r) => {
      if (r.nombre.toLowerCase().includes(q))
        results.push({
          tipo: "Residente",
          nombre: r.nombre,
          sub: r.proyecto,
          icon: "user",
        });
    });
    proyectos.forEach((p) => {
      if (p.title.toLowerCase().includes(q))
        results.push({
          tipo: "Proyecto",
          nombre: p.title,
          sub: p.company,
          icon: "folder",
        });
    });
    allReuniones.forEach((r) => {
      if (r.titulo && r.titulo.toLowerCase().includes(q))
        results.push({
          tipo: "Reunión",
          nombre: r.titulo,
          sub:
            r.fecha ||
            new Date(r.fecha_hora).toLocaleDateString() ||
            "Sin fecha",
          icon: "calendar",
        });
    });
    return results.slice(0, 8);
  }, [searchQuery, allResidentes, proyectos, allReuniones]);

  const filteredReportes = useMemo(() => {
    if (periodoFilter === "todo") return allReportes;
    const now = new Date();
    if (periodoFilter === "mes") {
      const mesAnterior = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate(),
      );
      return allReportes.filter((r) => new Date(r.fecha) >= mesAnterior);
    }
    if (periodoFilter === "semestre") {
      const semestreAnterior = new Date(
        now.getFullYear(),
        now.getMonth() - 6,
        now.getDate(),
      );
      return allReportes.filter((r) => new Date(r.fecha) >= semestreAnterior);
    }
    return allReportes;
  }, [periodoFilter, allReportes]);

  const filteredAceptados = filteredReportes.filter(
    (r) => r.status === "Aceptado",
  ).length;
  const filteredPorCorregir = filteredReportes.filter(
    (r) => r.status === "Por corregir",
  ).length;
  const filteredPendientes = filteredReportes.filter(
    (r) => r.status === "Pendiente",
  ).length;

  if (loadingBackend) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: C.bg,
        }}
      >
        <ActivityIndicator size="large" color={C.teal} />
        <Text style={{ marginTop: 12, color: C.textMuted }}>
          Cargando datos del servidor...
        </Text>
      </View>
    );
  }

  if (errorBackend) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: C.bg,
          padding: 20,
        }}
      >
        <Feather name="alert-circle" size={48} color={C.red} />
        <Text
          style={{
            marginTop: 16,
            fontSize: isMobile ? 14 : 16,
            fontWeight: "600",
            color: C.text,
            textAlign: "center",
          }}
        >
          Error al cargar el dashboard
        </Text>
        <Text
          style={{
            marginTop: 8,
            fontSize: 13,
            color: C.textMuted,
            textAlign: "center",
          }}
        >
          {errorBackend}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: isMobile ? 14 : 24 }}
    >
      {/* Search Bar */}
      <View style={{ marginBottom: 20, position: "relative", zIndex: 50 }}>
        <Row style={{ gap: 12, alignItems: "center" }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: C.card,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              gap: 8,
            }}
          >
            <Feather name="search" size={16} color={C.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={(v) => {
                setSearchQuery(v);
                setShowSearch(true);
              }}
              onFocus={() => setShowSearch(true)}
              placeholder="Buscar residente, proyecto o reunión..."
              placeholderTextColor={C.textLight}
              style={{
                flex: 1,
                paddingVertical: 11,
                fontSize: 13,
                color: C.text,
              }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery("");
                  setShowSearch(false);
                }}
              >
                <Feather name="x" size={14} color={C.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </Row>
        {showSearch && searchResults.length > 0 && (
          <View
            style={{
              position: "absolute",
              top: isMobile ? 52 : 48,
              left: 0,
              right: 0,
              backgroundColor: C.card,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              padding: 8,
              shadowColor: "#000",
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
              zIndex: 100,
            }}
          >
            {searchResults.map((r, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setShowSearch(false);
                  setSearchQuery("");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  borderBottomWidth: i < searchResults.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: C.tealLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={r.icon} size={14} color={C.teal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                  >
                    {r.nombre}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    {r.tipo} · {r.sub}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <SectionTitle title="Dashboard Asesor" />

      <Row style={{ gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard
         style={{
         width: isMobile ? "100%" : undefined,
         }}
          label="Residentes Activos"
          value={String(residentesActivos)}
          sub={`${proyectosActivos} proyectos`}
          icon="users"
          iconBg={C.tealLight}
          iconColor={C.teal}
        />
        <StatCard
         style={{
         width: isMobile ? "100%" : undefined,
         }}
          label="Reportes Pendientes"
          value={String(reportesPendientes)}
          sub="Por revisar"
          icon="file-text"
          iconBg={C.amberLight}
          iconColor={C.amber}
        />
        <StatCard
         style={{
         width: isMobile ? "100%" : undefined,
         }}
          label="Tasa Aceptación"
          value={`${promedioAprobacion}%`}
          sub="Global"
          icon="trending-up"
          iconBg={C.greenLight}
          iconColor={C.green}
        />
        <StatCard
          style={{
          width: isMobile ? "100%" : undefined,
          }}
          label="Próx. Reuniones"
          value={String(proximasReuniones.length)}
          sub={
            proximasReuniones.length > 0
              ? `${proximasReuniones.length} próxima(s)`
              : "Sin reuniones"
          }
          icon="calendar"
          iconBg={C.blueLight}
          iconColor={C.blue}
        />
      </Row>

      <Row style={{ gap: 20, marginBottom: 20, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
        <Card style={{ flex: isMobile ? undefined : 1, width: isMobile ? "100%" : undefined }}>
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: "700", color: C.text }}>
              Estado de Reportes
            </Text>
            <Row style={{ gap: 6, flexWrap: "wrap" }}>
              {[
                { id: "todo", label: "Todo" },
                { id: "mes", label: "Mes" },
                { id: "semestre", label: "Semestre" },
              ].map((f) => (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => setPeriodoFilter(f.id)}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    backgroundColor: periodoFilter === f.id ? C.teal : C.bg,
                    borderWidth: 1,
                    borderColor: periodoFilter === f.id ? C.teal : C.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "700",
                      color: periodoFilter === f.id ? "white" : C.textMuted,
                    }}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Row>
          </Row>
          <PieChart
            data={datosGraficaReal}
            width={isMobile ? screenWidth - 60 : screenWidth * 0.35}
            height={200}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
            hasLegend={true}
            chartConfig={{
             backgroundColor: C.card,
             backgroundGradientFrom: C.card,
             backgroundGradientTo: C.card,
             color: (opacity = 1) =>
             C.text === "#fff"
             ? `rgba(255,255,255,${opacity})`
             : `rgba(0,0,0,${opacity})`,

             labelColor: (opacity = 1) =>
             C.text === "#fff"
             ? `rgba(255,255,255,${opacity})`
             : `rgba(0,0,0,${opacity})`,
            }}
          />
          <View style={{ marginTop: 16, gap: 8 }}>
            <Row style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  flex: filteredAceptados || 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.green,
                }}
              />
              <Text style={{ fontSize: 11, color: C.textMuted, minWidth: 80 }}>
                Aceptados: {filteredAceptados}
              </Text>
            </Row>
            <Row style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  flex: filteredPendientes || 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.amber,
                }}
              />
              <Text style={{ fontSize: 11, color: C.textMuted, minWidth: 80 }}>
                Pendientes: {filteredPendientes}
              </Text>
            </Row>
            <Row style={{ alignItems: "center", gap: 8 }}>
              <View
                style={{
                  flex: filteredPorCorregir || 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: C.red,
                }}
              />
              <Text style={{ fontSize: 11, color: C.textMuted, minWidth: 80 }}>
                Por corregir: {filteredPorCorregir}
              </Text>
            </Row>
          </View>
        </Card>

        <Card style={{ flex: isMobile ? undefined : 1, width: isMobile ? "100%" : undefined }}>
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: "700", color: C.text }}>
              Alertas de Rezagados
            </Text>
            {alertasRezagados.length > 0 && (
              <Badge
                text={String(alertasRezagados.length)}
                color={C.red}
                bg={C.redLight}
              />
            )}
          </Row>
          {alertasRezagados.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 20 }}>
              <Feather
                name="check-circle"
                size={28}
                color={C.green}
                style={{ marginBottom: 8 }}
              />
              <Text style={{ fontSize: 12, color: C.textMuted }}>
                Sin reportes rezagados
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {alertasRezagados.map((r, i) => {
                const fechaEnvio = new Date(r.fecha);
                const dias =
                  !r.fecha || isNaN(fechaEnvio.getTime())
                    ? 0
                    : Math.floor(
                        (new Date() - fechaEnvio) / (1000 * 60 * 60 * 24),
                      );
                return (
                  <View
                    key={i}
                    style={{
                      backgroundColor: C.redLight,
                      borderRadius: 10,
                      padding: 12,
                      borderLeftWidth: 3,
                      borderLeftColor: C.red,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <Feather name="alert-triangle" size={14} color={C.red} />
                      <View style={{ flex: 1, minWidth: 180 }}>
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: C.text,
                          }}
                        >
                          {r.residente || r.residenteNombre || "Residente"}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.textMuted }}>
                          {r.titulo || r.nombre || "Reporte"} · {r.proyecto}
                        </Text>
                      </View>
                      <Badge
                        text={`${dias} días`}
                        color={C.red}
                        bg="#FCA5A522"
                      />
                    </Row>
                  </View>
                );
              })}
            </View>
          )}
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("seguimiento")}
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: C.red,
              borderRadius: 8,
              paddingVertical: 8,
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.red, fontSize: 12, fontWeight: "600" }}>
              Revisar reportes pendientes
            </Text>
          </TouchableOpacity>
        </Card>
      </Row>

      <Card style={{ marginBottom: 20 }}>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: isMobile ? 14 : 16, fontWeight: "700", color: C.text }}>
            Mis Residentes
          </Text>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              backgroundColor: C.tealLighter,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: C.teal }}>
              {allResidentes.length} activos
            </Text>
          </View>
        </Row>

        {allResidentes.map((r, i) => {
          const faseLabel =
            {
              propuesto: "Propuesto",
              desarrollo: "Desarrollo",
              revision: "Revisión",
              concluido: "Concluido",
            }[r.fase] || r.fase;
          const faseColor =
            {
              propuesto: C.blue,
              desarrollo: C.amber,
              revision: C.purple,
              concluido: C.green,
            }[r.fase] || C.textMuted;
          const fotoRes = r.usuarioId ? getFoto(r.usuarioId) : null;
          const isExpanded = expandedResidente === r.nombre;
          const initR =
            r.iniciales ||
            r.nombre
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

          return (
            <View
              key={i}
              style={{
                borderBottomWidth: i < allResidentes.length - 1 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
              {/* Fila principal — clickeable */}
              <TouchableOpacity
                onPress={() =>
                  setExpandedResidente(isExpanded ? null : r.nombre)
                }
                activeOpacity={0.7}
                style={{ paddingVertical: 12, paddingHorizontal: 4 }}
              >
                <Row style={{ alignItems: "center" }}>
                  {/* Foto / avatar */}
                  <View style={{ marginRight: 12 }}>
                    {fotoRes ? (
                      <Image
                        source={{ uri: fotoRes }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: C.teal + "66",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: C.tealLight,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2,
                          borderColor: C.teal + "33",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: C.teal,
                          }}
                        >
                          {initR}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Nombre + proyecto */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, color: C.text, fontWeight: "700" }}
                    >
                      {r.nombre}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}
                    >
                      {r.proyecto} · {r.empresa}
                    </Text>
                  </View>

                  {/* Badge + chevron */}
                  <Row style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <Badge
                      text={faseLabel.toUpperCase()}
                      color={faseColor}
                      bg={faseColor + "22"}
                    />
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={14}
                      color={C.textLight}
                    />
                  </Row>
                </Row>
              </TouchableOpacity>

              {/* Panel expandido */}
              {isExpanded && (
                <View
                  style={{
                    marginHorizontal: 4,
                    marginBottom: 14,
                    backgroundColor: C.bg,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Row style={{ gap: 14, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
                    {/* Foto grande */}
                    {fotoRes ? (
                      <Image
                        source={{ uri: fotoRes }}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          borderWidth: 2.5,
                          borderColor: C.teal,
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                          backgroundColor: C.tealLight,
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 2.5,
                          borderColor: C.teal + "55",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "800",
                            color: C.teal,
                          }}
                        >
                          {initR}
                        </Text>
                      </View>
                    )}

                    <View style={{ flex: 1, gap: 7 }}>
                      {[
                        { icon: "user", label: "Rol", val: r.rol || "—" },
                        { icon: "mail", label: "Correo", val: r.correo || "—" },
                        {
                          icon: "phone",
                          label: "Teléfono",
                          val: r.telefono || "—",
                        },
                        {
                          icon: "book",
                          label: "Carrera",
                          val: r.carrera || "—",
                        },
                        {
                          icon: "hash",
                          label: "Núm. control",
                          val: r.numControl || "—",
                        },
                      ].map(
                        (d, di) =>
                          d.val !== "—" && (
                            <Row
                              key={di}
                              style={{ alignItems: "center", gap: 8, flexWrap: "wrap" }}
                            >
                              <View
                                style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  backgroundColor: C.teal + "18",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Feather
                                  name={d.icon}
                                  size={11}
                                  color={C.teal}
                                />
                              </View>
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: C.textMuted,
                                  fontWeight: "600",
                                  width: 80,
                                }}
                              >
                                {d.label}
                              </Text>
                              <Text
                                style={{ fontSize: 12, color: C.text, flex: 1 }}
                                numberOfLines={1}
                              >
                                {d.val}
                              </Text>
                            </Row>
                          ),
                      )}
                      {r.correo && (
                        <TouchableOpacity
                          onPress={() => {
                            try {
                              window.location.href = `mailto:${r.correo}`;
                            } catch {}
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 4,
                            alignSelf: "flex-start",
                            backgroundColor: C.teal,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 8,
                          }}
                        >
                          <Feather name="mail" size={12} color="white" />
                          <Text
                            style={{
                              fontSize: 11,
                              color: "white",
                              fontWeight: "700",
                            }}
                          >
                            Enviar correo
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </Row>
                </View>
              )}
            </View>
          );
        })}
      </Card>

      <Row style={{ gap: 20, alignItems: "flex-start", flexDirection: isMobile ? "column" : "row" }}>
        <Card style={{ flex: isMobile ? undefined : 1, width: isMobile ? "100%" : undefined }}>
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: "700", color: C.text }}>
              Reportes por Revisar
            </Text>
            <Badge
              text={String(reportesPendientes)}
              color={C.amber}
              bg={C.amberLight}
            />
          </Row>
          <View style={{ gap: 10 }}>
            {allReportes
              .filter((r) => r.status === "Pendiente")
              .slice(0, 5)
              .map((r, i) => (
                <Row
                  key={i}
                  style={{
                    gap: 10,
                    alignItems: "flex-start",
                    backgroundColor: C.bg,
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: C.amber,
                      marginTop: 5,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, color: C.text, fontWeight: "500" }}
                    >
                      {r.residente || r.residenteNombre || "Residente"} —{" "}
                      {r.titulo || r.nombre || "Reporte"}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}
                    >
                      {r.proyecto} · {r.fecha}
                    </Text>
                  </View>
                </Row>
              ))}
          </View>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("seguimiento")}
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: C.teal,
              borderRadius: 8,
              paddingVertical: 9,
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.teal, fontSize: 13, fontWeight: "600" }}>
              Ver todos los reportes
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={{ flex: isMobile ? undefined : 1, width: isMobile ? "100%" : undefined }}>
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: "700", color: C.text }}>
              Próximas Reuniones
            </Text>
            <Badge
              text={String(proximasReuniones.length)}
              color={C.blue}
              bg={C.blueLight}
            />
          </Row>
          <View style={{ gap: 10 }}>
            {proximasReuniones.length === 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                  textAlign: "center",
                  paddingVertical: 16,
                }}
              >
                Sin reuniones en los próximos 5 días
              </Text>
            ) : (
              proximasReuniones.map((r, i) => (
                <Row
                  key={i}
                  style={{
                    gap: 10,
                    alignItems: "center",
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: C.bg,
                    borderRadius: 8,
                  }}
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: C.blueLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather
                      name={r.modalidad === "Virtual" ? "monitor" : "map-pin"}
                      size={14}
                      color={C.blue}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                    >
                      {r.titulo || r.nombre || "Reunión"}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {r.fecha} · {r.hora}
                    </Text>
                  </View>
                  <Badge
                    text={r.modalidad}
                    color={r.modalidad === "Virtual" ? C.purple : C.teal}
                    bg={r.modalidad === "Virtual" ? C.purpleLight : C.tealLight}
                  />
                </Row>
              ))
            )}
          </View>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("calendario")}
            style={{
              marginTop: 14,
              borderWidth: 1,
              borderColor: C.blue,
              borderRadius: 8,
              paddingVertical: 9,
              alignItems: "center",
            }}
          >
            <Text style={{ color: C.blue, fontSize: 13, fontWeight: "600" }}>
              Ver agenda completa
            </Text>
          </TouchableOpacity>
        </Card>
      </Row>

      <Card style={{ marginTop: 20 }}>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: isMobile ? 13 : 15, fontWeight: "700", color: C.text }}>
            Historial de Cambios
          </Text>
          <Feather name="git-branch" size={16} color={C.textMuted} />
        </Row>
        <View style={{ gap: 10 }}>
          {allReportes
            .filter((r) => r.historial && r.historial.length > 1)
            .slice(0, 5)
            .map((r, i) => (
              <View
                key={i}
                style={{ backgroundColor: C.bg, borderRadius: 10, padding: 12 }}
              >
                <Row
                  style={{ justifyContent: "space-between", marginBottom: 6 }}
                >
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                  >
                    {r.residente || r.residenteNombre || "Residente"} —{" "}
                    {r.titulo || r.nombre || "Reporte"}
                  </Text>
                  <Badge
                    text={r.status}
                    color={
                      r.status === "Aceptado"
                        ? C.green
                        : r.status === "Por corregir"
                          ? C.red
                          : C.amber
                    }
                    bg={
                      r.status === "Aceptado"
                        ? C.greenLight
                        : r.status === "Por corregir"
                          ? C.redLight
                          : C.amberLight
                    }
                  />
                </Row>
                {r.historial.map((h, hi) => (
                  <Row
                    key={hi}
                    style={{ alignItems: "center", gap: 6, marginTop: 4 }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor:
                          h.status === "Aceptado" ? C.green : C.red,
                      }}
                    />
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {h.fecha} — {h.status}: {h.comentario}
                    </Text>
                  </Row>
                ))}
              </View>
            ))}
          {allReportes.filter((r) => r.historial && r.historial.length > 1)
            .length === 0 && (
            <Text
              style={{
                fontSize: 12,
                color: C.textMuted,
                textAlign: "center",
                paddingVertical: 12,
              }}
            >
              Sin historial de cambios
            </Text>
          )}
        </View>
      </Card>
    </ScrollView>
  );
}
