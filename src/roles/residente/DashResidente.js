import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../../constants/colors";
import {
  Row,
  Card,
  StatCard,
  Badge,
  ProgressBar,
  SectionTitle,
} from "../../components";
import { useReportes } from "../../context/ReportesContext";
import apiClient from "../../utils/apiClient";

// Fecha de fin de residencia (demo — en producción vendría del contexto del usuario)
const FECHA_FIN_RESIDENCIA = new Date("2026-06-15");

export default function DashResidente({ onNavigate }) {
  const { reports } = useReportes() || {};
  const [asesor, setAsesor] = useState(null);

  useEffect(() => {
    apiClient.get("/api/residente/asesor").then((res) => {
      if (res.ok && res.body?.ok && res.body.asesor) setAsesor(res.body.asesor);
    });
  }, []);

  // Derive state from context
  const preliminar = reports?.find((r) => r.id === "preliminar");
  const parciales = reports?.filter((r) => typeof r.id === "number") ?? [];
  const final = reports?.find((r) => r.id === "final");

  const parcialesAceptados = parciales.filter((r) => r.status === "Aceptado");
  const totalParciales = parciales.length;
  const progressPct =
    totalParciales > 0
      ? Math.round((parcialesAceptados.length / totalParciales) * 100)
      : 0;

  // Validación de residencia: solo se valida después de que el reporte final sea aceptado
  const residenciaValidada = final?.status === "Aceptado";

  // Steps: Registro & Asignación are always done; then one per parcial + Final
  const steps = [
    { label: "Registro", done: true, active: false },
    { label: "Asignación", done: true, active: false },
    ...parciales.map((p, i) => ({
      label: `Reporte ${i + 1}`,
      done: p.status === "Aceptado",
      active:
        p.status !== "Aceptado" &&
        parciales.slice(0, i).every((pp) => pp.status === "Aceptado"),
    })),
    {
      label: "Final",
      done: final?.status === "Aceptado",
      active:
        final?.status !== "Aceptado" &&
        parciales.every((p) => p.status === "Aceptado"),
    },
  ];

  // Tabla "Mis Reportes" — sólo parciales
  const reportesTabla = parciales.map((p, i) => {
    const isAceptado = p.status === "Aceptado";
    const isPendiente = p.status === "Pendiente";
    return {
      nombre: `Reporte ${i + 1} — ${p.subtitle.split("·")[1]?.trim() ?? p.subtitle}`,
      fechaLimite: p.submitted ?? "—",
      fechaEntrega: p.submitted ?? "—",
      estado: p.status,
      estadoColor: isAceptado ? C.green : isPendiente ? C.amber : C.blue,
      estadoBg: isAceptado
        ? C.greenLight
        : isPendiente
          ? C.amberLight
          : C.tealLight,
    };
  });

  const [eventos, setEventos] = useState([]);

  useEffect(() => {
    apiClient.get("/api/citas/mis-citas").then((res) => {
      if (res.ok && res.body?.ok) {
        const hoy = new Date();
        const proximos = res.body.citas
          .filter((c) => new Date(c.fecha_hora) >= hoy)
          .slice(0, 4)
          .map((c) => ({
            fecha: new Date(c.fecha_hora).toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
            titulo: c.motivo || c.tipo,
            color: C.blue,
          }));
        setEventos(proximos);
      }
    });
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      <SectionTitle title="Dashboard Residente" />

      {/* Stat Cards */}
      <Row style={{ gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
        <StatCard
          label="Reportes"
          value={`${parcialesAceptados.length}/${totalParciales}`}
          sub={`${totalParciales - parcialesAceptados.length} pendiente(s)`}
          icon="file-text"
          iconBg={C.tealLight}
          iconColor={C.teal}
        />
        <StatCard
          label="Progreso"
          value={`${progressPct}%`}
          sub="Avance de reportes"
          icon="trending-up"
          iconBg={C.greenLight}
          iconColor={C.green}
          trend={`+${parcialesAceptados.length} reporte(s)`}
          trendUp
        />
        <StatCard
          label="Residencia"
          value={residenciaValidada ? "Validada" : "Pendiente"}
          sub={residenciaValidada ? "Completada" : "Esperando reporte final"}
          icon={residenciaValidada ? "check-circle" : "clock"}
          iconBg={residenciaValidada ? C.greenLight : C.amberLight}
          iconColor={residenciaValidada ? C.green : C.amber}
        />
      </Row>

      <Row style={{ gap: 20, alignItems: "flex-start" }}>
        {/* Columna izquierda */}
        <View style={{ flex: 1, gap: 20 }}>
          {/* Progreso de Residencia */}
          <Card>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: C.text,
                marginBottom: 20,
              }}
            >
              Progreso de Residencia
            </Text>
            <Row style={{ alignItems: "center", marginBottom: 24 }}>
              {steps.map((step, index) => (
                <View key={index} style={{ flex: 1, alignItems: "center" }}>
                  <Row style={{ alignItems: "center", width: "100%" }}>
                    {index > 0 && (
                      <View
                        style={{
                          flex: 1,
                          height: 2,
                          backgroundColor: steps[index - 1].done
                            ? C.teal
                            : C.border,
                        }}
                      />
                    )}
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: step.done
                          ? C.teal
                          : step.active
                            ? C.amber
                            : C.bg,
                        borderWidth: step.done || step.active ? 0 : 2,
                        borderColor: C.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {step.done ? (
                        <Feather name="check" size={14} color="#fff" />
                      ) : step.active ? (
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: "#fff",
                          }}
                        />
                      ) : null}
                    </View>
                    {index < steps.length - 1 && (
                      <View
                        style={{
                          flex: 1,
                          height: 2,
                          backgroundColor: step.done ? C.teal : C.border,
                        }}
                      />
                    )}
                  </Row>
                  <Text
                    style={{
                      fontSize: 11,
                      marginTop: 6,
                      textAlign: "center",
                      color: step.done
                        ? C.teal
                        : step.active
                          ? C.amber
                          : C.textMuted,
                      fontWeight: step.active ? "700" : "400",
                    }}
                  >
                    {step.label}
                  </Text>
                </View>
              ))}
            </Row>
            <View
              style={{ backgroundColor: C.bg, borderRadius: 10, padding: 16 }}
            >
              <Row style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                >
                  Avance de Reportes ({progressPct}%)
                </Text>
                <Text style={{ fontSize: 13, color: C.textMuted }}>
                  {parcialesAceptados.length} / {totalParciales}
                </Text>
              </Row>
              <ProgressBar pct={progressPct} color={C.teal} />
              <Row style={{ justifyContent: "space-between", marginTop: 8 }}>
                <Text style={{ fontSize: 12, color: C.teal }}>
                  {parcialesAceptados.length} aceptados
                </Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>
                  {totalParciales - parcialesAceptados.length} pendiente(s)
                </Text>
              </Row>
            </View>
          </Card>

          {/* Mis Reportes */}
          <Card>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: C.text,
                marginBottom: 16,
              }}
            >
              Mis Reportes
            </Text>
            <Row
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: C.bg,
                borderRadius: 8,
                marginBottom: 8,
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
                REPORTE
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
                LÍMITE
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
                ENTREGA
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
            {reportesTabla.map((r, i) => (
              <Row
                key={i}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 14,
                  borderBottomWidth: i < reportesTabla.length - 1 ? 1 : 0,
                  borderBottomColor: C.border,
                  alignItems: "center",
                }}
              >
                <Text style={{ flex: 2, fontSize: 14, color: C.text }}>
                  {r.nombre}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: C.textMuted,
                    textAlign: "center",
                  }}
                >
                  {r.fechaLimite}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: C.textMuted,
                    textAlign: "center",
                  }}
                >
                  {r.fechaEntrega}
                </Text>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Badge
                    text={r.estado}
                    color={r.estadoColor}
                    bg={r.estadoBg}
                  />
                </View>
              </Row>
            ))}
          </Card>
        </View>

        {/* Sidebar derecho */}
        <View style={{ width: 280, gap: 20 }}>
          {/* Mi Asesor */}
          <Card>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.text,
                marginBottom: 16,
              }}
            >
              Mi Asesor
            </Text>
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: C.tealLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{ fontSize: 20, fontWeight: "700", color: C.teal }}
                >
                  {asesor ? asesor.iniciales : "—"}
                </Text>
              </View>
              <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
                {asesor ? asesor.nombre : "Sin asesor asignado"}
              </Text>
              <Text style={{ fontSize: 13, color: C.textMuted }}>
                {asesor ? asesor.departamento : ""}
              </Text>
            </View>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {asesor && [
                ["mail", asesor.correo],
                asesor.extension ? ["phone", `Ext. ${asesor.extension}`] : null,
              ].filter(Boolean).map(([icon, txt], i) => (
                <Row key={i} style={{ gap: 8, alignItems: "center" }}>
                  <Feather name={icon} size={14} color={C.textMuted} />
                  <Text style={{ fontSize: 13, color: C.textMuted }}>
                    {txt}
                  </Text>
                </Row>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => onNavigate && onNavigate("calendario")}
              style={{
                backgroundColor: C.teal,
                borderRadius: 8,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Row style={{ gap: 6, alignItems: "center" }}>
                <Feather name="message-circle" size={15} color="#fff" />
                <Text
                  style={{ color: "#fff", fontSize: 14, fontWeight: "600" }}
                >
                  Agendar Cita
                </Text>
              </Row>
            </TouchableOpacity>
          </Card>

          {/* Próximos Eventos */}
          <Card>
            <Text
              style={{
                fontSize: 15,
                fontWeight: "700",
                color: C.text,
                marginBottom: 14,
              }}
            >
              Próximos Eventos
            </Text>
            <View style={{ gap: 12 }}>
              {eventos.map((ev, i) => (
                <Row key={i} style={{ gap: 12, alignItems: "center" }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 8,
                      backgroundColor: ev.color + "22",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        color: ev.color,
                      }}
                    >
                      {ev.fecha}
                    </Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 13, color: C.text }}>
                    {ev.titulo}
                  </Text>
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: ev.color,
                    }}
                  />
                </Row>
              ))}
            </View>
          </Card>
        </View>
      </Row>
    </ScrollView>
  );
}
