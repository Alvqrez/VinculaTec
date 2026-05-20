import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../../constants/colors";
import { Row, Card, StatCard, Badge, SectionTitle } from "../../components";
import apiClient from "../../utils/apiClient";

const STATUS_STYLE = {
  Activa:      { color: C.green, bg: C.greenLight },
  "Por Vencer":{ color: C.amber, bg: C.amberLight },
  Nueva:       { color: C.blue,  bg: C.blueLight  },
  Inactiva:    { color: C.red,   bg: C.redLight    },
};

export default function DashJefe({ onNavigate }) {
  const [stats, setStats] = useState({ totalResidentes: 0, empresasVinculadas: 0, proyectosActivos: 0, reportesPendientes: 0 });
  const [topEmpresas, setTopEmpresas] = useState([]);
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("Todos");
  
  const PERIODOS = ["Todos", "Ene-Jun 2026", "Ago-Dic 2026", "Ene-Jun 2027", "Ago-Dic 2027"];

  useEffect(() => {
    apiClient.get("/api/jefe/dashboard").then((res) => {
      if (res.ok && res.body?.ok) {
        setStats(res.body.stats);
        setTopEmpresas(res.body.topEmpresas || []);
      }
    });
  }, []);

  const alertas = [
    {
      icono: "alert-triangle", color: C.red, bg: C.redLight,
      titulo: "Reportes Pendientes",
      descripcion: `${stats.reportesPendientes} reporte(s) pendiente(s) de revisión por asesores.`,
      accion: "Ver seguimiento", screen: "seguimiento",
    },
    {
      icono: "user-plus", color: C.purple, bg: C.purpleLight,
      titulo: "Asignaciones",
      descripcion: "Gestiona la asignación de asesores y residentes a proyectos.",
      accion: "Ir a Asignación", screen: "asignacion",
    },
    {
      icono: "calendar", color: C.blue, bg: C.blueLight,
      titulo: "Calendario",
      descripcion: "Revisa las citas y reuniones programadas.",
      accion: "Ver calendario", screen: "calendario",
    },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24 }}>
      <SectionTitle title="Dashboard — Departamento de Sistemas" />

      {/* Filtro por periodo */}
      <Row style={{ gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {PERIODOS.map((periodo) => (
          <TouchableOpacity
            key={periodo}
            onPress={() => setPeriodoSeleccionado(periodo)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: periodoSeleccionado === periodo ? C.teal : C.border,
              backgroundColor: periodoSeleccionado === periodo ? C.tealLight : C.card,
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
      </Row>

      {/* Stat Cards */}
      <Row style={{ gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard label="Residentes Totales"  value={String(stats.totalResidentes)}    icon="users"        iconBg={C.tealLight}   iconColor={C.teal}   />
        <StatCard label="Empresas Vinculadas" value={String(stats.empresasVinculadas)} icon="briefcase"    iconBg={C.blueLight}   iconColor={C.blue}   />
        <StatCard label="Proyectos Activos"   value={String(stats.proyectosActivos)}   icon="folder"       iconBg={C.purpleLight} iconColor={C.purple} />
        <StatCard label="Reportes Pendientes" value={String(stats.reportesPendientes)} icon="alert-circle" iconBg={C.redLight}    iconColor={C.red}    />
      </Row>

      {/* Empresas Más Activas */}
      <Card style={{ marginBottom: 20 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>Empresas Más Activas</Text>
          <TouchableOpacity
            onPress={() => onNavigate && onNavigate("empresas")}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: C.teal }}
          >
            <Text style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}>Ver todas</Text>
          </TouchableOpacity>
        </Row>
        <Row style={{ paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.bg, borderRadius: 8, marginBottom: 4 }}>
          <Text style={{ flex: 2, fontSize: 12, fontWeight: "600", color: C.textMuted }}>EMPRESA</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: C.textMuted, textAlign: "center" }}>PROYECTOS</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: C.textMuted, textAlign: "center" }}>RESIDENTES</Text>
          <Text style={{ flex: 1, fontSize: 12, fontWeight: "600", color: C.textMuted, textAlign: "center" }}>ESTADO</Text>
        </Row>
        {topEmpresas.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center" }}>
            <Text style={{ fontSize: 13, color: C.textMuted }}>Sin empresas registradas</Text>
          </View>
        ) : topEmpresas.map((e, i) => {
          const st = STATUS_STYLE[e.estado] || STATUS_STYLE.Activa;
          return (
            <Row key={e.id} style={{ paddingHorizontal: 10, paddingVertical: 13, borderBottomWidth: i < topEmpresas.length - 1 ? 1 : 0, borderBottomColor: C.border, alignItems: "center" }}>
              <Row style={{ flex: 2, gap: 10, alignItems: "center" }}>
                <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.blueLight, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.blue }}>{e.nombre?.[0] ?? "?"}</Text>
                </View>
                <Text style={{ fontSize: 14, color: C.text, fontWeight: "600" }}>{e.nombre}</Text>
              </Row>
              <Text style={{ flex: 1, fontSize: 14, color: C.text, textAlign: "center" }}>{e.proyectos}</Text>
              <Text style={{ flex: 1, fontSize: 14, color: C.text, textAlign: "center" }}>{e.residentes}</Text>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Badge text={e.estado} color={st.color} bg={st.bg} />
              </View>
            </Row>
          );
        })}
      </Card>

      {/* Alertas */}
      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>Alertas y Acciones Requeridas</Text>
          {stats.reportesPendientes > 0 && (
            <Badge text={`${stats.reportesPendientes} pendiente(s)`} color={C.red} bg={C.redLight} />
          )}
        </Row>
        <Row style={{ gap: 16, flexWrap: "wrap" }}>
          {alertas.map((a, i) => (
            <View key={i} style={{ flex: 1, minWidth: 220, backgroundColor: a.bg, borderRadius: 12, padding: 16, borderLeftWidth: 4, borderLeftColor: a.color }}>
              <Row style={{ gap: 10, alignItems: "center", marginBottom: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: a.color + "33", alignItems: "center", justifyContent: "center" }}>
                  <Feather name={a.icono} size={18} color={a.color} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.text, flex: 1 }}>{a.titulo}</Text>
              </Row>
              <Text style={{ fontSize: 13, color: C.textMuted, lineHeight: 19, marginBottom: 14 }}>{a.descripcion}</Text>
              <TouchableOpacity
                onPress={() => onNavigate && onNavigate(a.screen)}
                style={{ backgroundColor: a.color, borderRadius: 8, paddingVertical: 8, alignItems: "center" }}
              >
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>{a.accion}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </Row>
      </Card>
    </ScrollView>
  );
}
