import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "../../context/ThemeContext";
import { Row, Card, StatCard, Badge, SectionTitle } from "../../components";
import { useNotificaciones } from "../../context/NotificacionesContext";
import { NotificationBadge } from "../../components/NotificationBadge";
import { useRealTimeStats } from "../../hooks/useRealTimeStats";
import apiClient from "../../utils/apiClient";

const screenWidth = Dimensions.get("window").width;

export default function DashJefe({ onNavigate }) {
  const { colors: C } = useTheme();
  const { unreadCount } = useNotificaciones();
  const {
    stats: realTimeStats,
    loading: statsLoading,
    refresh,
  } = useRealTimeStats("/api/jefe/dashboard", 60000);

  const STATUS_STYLE = {
    Activa: { color: C.green, bg: C.greenLight },
    "Por Vencer": { color: C.amber, bg: C.amberLight },
    Nueva: { color: C.blue, bg: C.blueLight },
    Inactiva: { color: C.red, bg: C.redLight },
  };

  // ── Datos generales (sin filtro de período) ────────────────────────────────
  const [stats, setStats] = useState({
    totalResidentes: 0,
    empresasVinculadas: 0,
    proyectosActivos: 0,
    reportesPendientes: 0,
  });

  const [graficaReportes, setGraficaReportes] = useState({
    entregados: 0,
    pendientes: 0,
  });

  const [topEmpresas, setTopEmpresas] = useState([]);

  // ── Períodos dinámicos desde la BD ────────────────────────────────────────
  const [periodos, setPeriodos] = useState([]);
  const [periodoSeleccionado, setPeriodo] = useState("Todos");
  const [statsPeriodo, setStatsPeriodo] = useState(null);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);

  // ── Carga inicial: stats globales + lista de períodos ─────────────────────
  useEffect(() => {
    // Stats generales
    apiClient.get("/api/jefe/dashboard").then((res) => {
      if (res.ok && res.body?.ok) {
        setStats(res.body.stats);
        setTopEmpresas(res.body.topEmpresas || []);
      }
    });

    apiClient.get("/api/jefe/grafica-reportes").then((res) => {
      if (res.ok && res.body?.ok) {
        setGraficaReportes({
          entregados: res.body.entregados,
          pendientes: res.body.pendientes,
        });
      }
    });
    // Períodos disponibles en la BD
    apiClient.get("/api/jefe/estadisticas-por-periodo").then((res) => {
      if (res.ok && res.body?.ok) {
        const lista = (res.body.periodos || [])
          .map((p) => p.periodo)
          .filter(Boolean);
        setPeriodos(lista);
      }
    });
  }, []);

  // ── Cada vez que cambia el período, pedir stats filtradas ─────────────────
  const cargarStatsPeriodo = useCallback(async (periodo) => {
    if (periodo === "Todos") {
      setStatsPeriodo(null);
      return;
    }
    setLoadingPeriodo(true);
    const res = await apiClient.get(
      `/api/jefe/estadisticas-por-periodo?periodo=${encodeURIComponent(periodo)}`,
    );
    if (res.ok && res.body?.ok) {
      setStatsPeriodo(res.body.estadisticas);
    }
    setLoadingPeriodo(false);
  }, []);

  const handlePeriodo = (p) => {
    setPeriodo(p);
    cargarStatsPeriodo(p);
  };

  // Stats que se muestran: período filtrado si hay selección, globales si "Todos"
  const statsActuales =
    periodoSeleccionado !== "Todos" && statsPeriodo
      ? {
          totalResidentes:
            statsPeriodo.totalResidentes ?? stats.totalResidentes,
          empresasVinculadas:
            statsPeriodo.totalEmpresas ?? stats.empresasVinculadas,
          proyectosActivos:
            statsPeriodo.proyectosActivos ?? stats.proyectosActivos,
          reportesPendientes: stats.reportesPendientes, // siempre global (sin filtro por período)
        }
      : stats;

  // ── Datos para gráfica de pastel ─────────────────────────────
  const pieData = [
    {
      name: "Entregados",
      population: graficaReportes.entregados,
      color: "#14B8A6",
      legendFontColor: C.text,
      legendFontSize: 13,
    },
    {
      name: "Pendientes",
      population: graficaReportes.pendientes,
      color: "#EF4444",
      legendFontColor: C.text,
      legendFontSize: 13,
    },
  ];

  const alertas = [
    {
      icono: "alert-triangle",
      color: C.red,
      bg: C.redLight,
      titulo: "Reportes Pendientes",
      descripcion: `${stats.reportesPendientes} reporte(s) pendiente(s) de revisión por asesores.`,
      accion: "Ver seguimiento",
      screen: "seguimiento",
    },
    {
      icono: "user-plus",
      color: C.purple,
      bg: C.purpleLight,
      titulo: "Asignaciones",
      descripcion:
        "Gestiona la asignación de asesores y residentes a proyectos.",
      accion: "Ir a Asignación",
      screen: "asignacion",
    },
    {
      icono: "calendar",
      color: C.blue,
      bg: C.blueLight,
      titulo: "Calendario",
      descripcion: "Revisa las citas y reuniones programadas.",
      accion: "Ver calendario",
      screen: "calendario",
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Filtro por período — botones generados desde la BD */}
      <Row style={{ gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {/* Botón "Todos" siempre visible */}
        <TouchableOpacity
          onPress={() => handlePeriodo("Todos")}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: periodoSeleccionado === "Todos" ? C.teal : C.border,
            backgroundColor:
              periodoSeleccionado === "Todos" ? C.tealLight : C.card,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: periodoSeleccionado === "Todos" ? C.teal : C.textMuted,
            }}
          >
            Todos
          </Text>
        </TouchableOpacity>

        {/* Períodos reales de la BD */}
        {periodos.map((periodo) => (
          <TouchableOpacity
            key={periodo}
            onPress={() => handlePeriodo(periodo)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: periodoSeleccionado === periodo ? C.teal : C.border,
              backgroundColor:
                periodoSeleccionado === periodo ? C.tealLight : C.card,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: periodoSeleccionado === periodo ? C.teal : C.textMuted,
              }}
            >
              {periodo}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Si no hay períodos registrados aún */}
        {periodos.length === 0 && (
          <Text
            style={{ fontSize: 12, color: C.textMuted, alignSelf: "center" }}
          >
            Sin períodos registrados
          </Text>
        )}
      </Row>

      {/* ── Fila principal: Gráfica izquierda + Stats derecha ── */}
      <Row style={{ gap: 16, marginBottom: 20, alignItems: "flex-start" }}>
        {/* Gráfica de reportes — lado izquierdo */}
        <Card style={{ flex: 1, minWidth: 260 }}>
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
                Entrega de Reportes
              </Text>
              <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                Estado general de residentes
              </Text>
            </View>
            <View
              style={{
                backgroundColor: C.tealLight,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 20,
              }}
            >
              <Text style={{ color: C.teal, fontWeight: "700", fontSize: 11 }}>
                {graficaReportes.entregados + graficaReportes.pendientes}{" "}
                residentes
              </Text>
            </View>
          </Row>

          <PieChart
            data={[
              {
                name: "Entregados",
                population: graficaReportes.entregados,
                color: "#10B981",
                legendFontColor: "#374151",
                legendFontSize: 12,
              },
              {
                name: "Pendientes",
                population: graficaReportes.pendientes,
                color: "#EF4444",
                legendFontColor: "#374151",
                legendFontSize: 12,
              },
            ]}
            width={320}
            height={160}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
            absolute
            hasLegend={true}
            chartConfig={{
              backgroundColor: C.card,
              backgroundGradientFrom: C.card,
              backgroundGradientTo: C.card,
              decimalPlaces: 0,
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

          <Row style={{ justifyContent: "space-around", marginTop: 8, gap: 8 }}>
            <View
              style={{
                backgroundColor: "#ECFDF5",
                padding: 10,
                borderRadius: 10,
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#10B981", fontWeight: "700", fontSize: 18 }}
              >
                {graficaReportes.entregados}
              </Text>
              <Text style={{ color: "#065F46", fontSize: 11, marginTop: 2 }}>
                Entregados
              </Text>
            </View>
            <View
              style={{
                backgroundColor: "#FEF2F2",
                padding: 10,
                borderRadius: 10,
                flex: 1,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#EF4444", fontWeight: "700", fontSize: 18 }}
              >
                {graficaReportes.pendientes}
              </Text>
              <Text style={{ color: "#991B1B", fontSize: 11, marginTop: 2 }}>
                Pendientes
              </Text>
            </View>
          </Row>
        </Card>

        {/* Stat Cards 2x2 — lado derecho */}
        {loadingPeriodo ? (
          <ActivityIndicator color={C.teal} style={{ marginTop: 40 }} />
        ) : (
          <View style={{ flex: 1, minWidth: 260 }}>
            <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Residentes Totales"
                  value={String(statsActuales.totalResidentes)}
                  icon="users"
                  iconBg={C.tealLight}
                  iconColor={C.teal}
                />
              </View>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Empresas Vinculadas"
                  value={String(statsActuales.empresasVinculadas)}
                  icon="briefcase"
                  iconBg={C.blueLight}
                  iconColor={C.blue}
                />
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Proyectos Activos"
                  value={String(statsActuales.proyectosActivos)}
                  icon="folder"
                  iconBg={C.purpleLight}
                  iconColor={C.purple}
                />
              </View>
              <View style={{ flex: 1 }}>
                <StatCard
                  label="Reportes Pendientes"
                  value={String(stats.reportesPendientes)}
                  icon="alert-circle"
                  iconBg={C.redLight}
                  iconColor={C.red}
                />
              </View>
            </View>
          </View>
        )}
      </Row>

      {/* Empresas Más Activas */}
      <Card style={{ marginBottom: 20 }}>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>
            Empresas Más Activas
          </Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("empresas")}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: C.teal,
            }}
          >
            <Text style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}>
              Ver todas
            </Text>
          </TouchableOpacity>
        </Row>
        <Row
          style={{
            paddingHorizontal: 10,
            paddingVertical: 8,
            backgroundColor: C.bg,
            borderRadius: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              flex: 2,
              fontSize: 12,
              fontWeight: "600",
              color: C.textMuted,
            }}
          >
            EMPRESA
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: "600",
              color: C.textMuted,
              textAlign: "center",
            }}
          >
            PROYECTOS
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: "600",
              color: C.textMuted,
              textAlign: "center",
            }}
          >
            RESIDENTES
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              fontWeight: "600",
              color: C.textMuted,
              textAlign: "center",
            }}
          >
            ESTADO
          </Text>
        </Row>
        {topEmpresas.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: C.textMuted }}>
              Sin empresas registradas
            </Text>
          </View>
        ) : (
          topEmpresas.map((e, i) => {
            const st = STATUS_STYLE[e.estado] || STATUS_STYLE.Activa;
            return (
              <Row
                key={e.id}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 13,
                  borderBottomWidth: i < topEmpresas.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                  alignItems: "center",
                }}
              >
                <Row style={{ flex: 2, gap: 10, alignItems: "center" }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: C.blueLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.blue }}
                    >
                      {e.nombre?.[0] ?? "?"}
                    </Text>
                  </View>
                  <Text
                    style={{ fontSize: 14, color: C.text, fontWeight: "600" }}
                  >
                    {e.nombre}
                  </Text>
                </Row>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: C.text,
                    textAlign: "center",
                  }}
                >
                  {e.proyectos}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: C.text,
                    textAlign: "center",
                  }}
                >
                  {e.residentes}
                </Text>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Badge text={e.estado} color={st.color} bg={st.bg} />
                </View>
              </Row>
            );
          })
        )}
      </Card>

      {/* Alertas */}
      <Card>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>
            Alertas y Acciones Requeridas
          </Text>
          {stats.reportesPendientes > 0 && (
            <Badge
              text={`${stats.reportesPendientes} pendiente(s)`}
              color={C.red}
              bg={C.redLight}
            />
          )}
        </Row>
        <Row style={{ gap: 16, flexWrap: "wrap" }}>
          {alertas.map((a, i) => (
            <View
              key={i}
              style={{
                flex: 1,
                minWidth: 220,
                backgroundColor: a.bg,
                borderRadius: 12,
                padding: 16,
                borderLeftWidth: 4,
                borderLeftColor: a.color,
              }}
            >
              <Row style={{ gap: 10, alignItems: "center", marginBottom: 10 }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: a.color + "33",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={a.icono} size={18} color={a.color} />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: C.text,
                    flex: 1,
                  }}
                >
                  {a.titulo}
                </Text>
              </Row>
              <Text
                style={{
                  fontSize: 13,
                  color: C.textMuted,
                  lineHeight: 19,
                  marginBottom: 14,
                }}
              >
                {a.descripcion}
              </Text>
              <TouchableOpacity
                onPress={() => onNavigate && onNavigate(a.screen)}
                style={{
                  backgroundColor: a.color,
                  borderRadius: 8,
                  paddingVertical: 8,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}
                >
                  {a.accion}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </Row>
      </Card>
    </ScrollView>
  );
}
