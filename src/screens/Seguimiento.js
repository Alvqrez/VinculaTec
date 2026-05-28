import { useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, StatCard, Badge, ProgressBar } from "../components";
import { useReportes } from "../context/ReportesContext";
import { useNotificaciones } from "../context/NotificacionesContext";

// ── Helpers ───────────────────────────────────────────────────────────────────
const statusStyle = (status, C) =>
  ({
    Aceptado: { color: C.green, bg: C.greenLight },
    "Por corregir": { color: C.red, bg: C.redLight },
    Pendiente: { color: C.amber, bg: C.amberLight },
    Entregado: { color: C.blue, bg: C.blueLight },
  })[status] || { color: C.textMuted, bg: C.bg };
const todayStr = () => {
  const d = new Date();
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Seguimiento() {
  const { colors: C } = useTheme();
  const { reports, updateReport, preliminarAprobado, finalDesbloqueado } =
    useReportes() || {};
  const { setNotifications } = useNotificaciones() || {};
  const [selected, setSelected] = useState(null);
  const [viewingReport, setViewing] = useState(null);

  // ── Display groups ────────────────────────────────────────────────────────
  const preliminar = reports?.find((r) => r.id === "preliminar");
  const parciales = reports?.filter((r) => typeof r.id === "number") || [];
  const final = reports?.find((r) => r.id === "final");

  const parcialesAceptados = parciales.filter(
    (r) => r.status === "Aceptado",
  ).length;

  // ── Actions ───────────────────────────────────────────────────────────────
  const deliverReport = (id) => {
    const report = reports?.find((r) => r.id === id);
    updateReport(id, { status: "Pendiente", submitted: todayStr() });

    if (setNotifications) {
      setNotifications((prev) => [
        {
          id: Date.now(),
          icon: "file-text",
          iconBg: C.blueLight,
          iconColor: C.blue,
          title: `Nuevo reporte entregado: ${report?.title || "Reporte"}`,
          body: "Un residente ha entregado un reporte que requiere tu revisión.",
          time: "Ahora",
          unread: true,
          type: "Reporte",
          typeBg: C.blueLight,
          typeColor: C.blue,
          proyecto: "App de Logística Interna",
          fase: "desarrollo",
          actionScreen: "seguimiento",
          actionLabel: "Revisar reporte",
        },
        ...(prev || []),
      ]);
    }

    Alert.alert(
      "Reporte entregado",
      "Queda pendiente de revisión por tu asesor.",
    );
  };

  const exportReports = () => {
    const rows = (reports || [])
      .map(
        (r) =>
          `<tr><td>${r.title}</td><td>${r.status}</td><td>${r.submitted ?? "Sin entregar"}</td><td>${r.reviewer}</td></tr>`,
      )
      .join("");
    const html = `<html><head><title>Seguimiento</title><style>body{font-family:Arial;padding:32px}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #CBD5E1;padding:10px}th{background:#F1F5F9}</style></head><body><h1>Seguimiento de Reportes</h1><table><thead><tr><th>Reporte</th><th>Estado</th><th>Envío</th><th>Revisor</th></tr></thead><tbody>${rows}</tbody></table></body></html>`;
    if (globalThis?.window?.open) {
      const win = globalThis.window.open("", "_blank");
      if (!win) {
        Alert.alert("Exportar", "Permite ventanas emergentes.");
        return;
      }
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    } else {
      Alert.alert("Exportar", "Disponible en la versión web.");
    }
  };

  // ── Report card renderer ──────────────────────────────────────────────────
  const ReportCard = ({ report, canDeliver = false }) => {
    const isOpen = selected === report.id;
    const { color, bg } = statusStyle(report.status, C);
    const statusIcon =
      report.status === "Aceptado"
        ? "check"
        : report.status === "Por corregir"
          ? "x"
          : "clock";
    return (
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <TouchableOpacity
          onPress={() => setSelected(isOpen ? null : report.id)}
          activeOpacity={0.85}
          style={{ padding: 18 }}
        >
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Row style={{ flex: 1, gap: 12, alignItems: "flex-start" }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: bg,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={statusIcon} size={16} color={color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: C.text }}
                >
                  {report.title}
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}
                >
                  {report.subtitle}
                </Text>
                {report.submitted && (
                  <Row style={{ alignItems: "center", gap: 5, marginTop: 5 }}>
                    <Feather name="calendar" size={11} color={C.textLight} />
                    <Text style={{ fontSize: 11, color: C.textLight }}>
                      Enviado: {report.submitted}
                    </Text>
                  </Row>
                )}
              </View>
            </Row>
            <Row style={{ alignItems: "center", gap: 10 }}>
              <Badge text={report.status} color={color} bg={bg} />
              <Feather
                name={isOpen ? "chevron-up" : "chevron-down"}
                size={16}
                color={C.textMuted}
              />
            </Row>
          </Row>
        </TouchableOpacity>

        {isOpen && (
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: C.borderLight,
              padding: 18,
              backgroundColor: C.bgDark,
            }}
          >
            {/* Checklist */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: C.textSub,
                marginBottom: 10,
              }}
            >
              Secciones
            </Text>
            <View style={{ gap: 7, marginBottom: 14 }}>
              {report.items.map((item, idx) => (
                <Row key={idx} style={{ alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: 5,
                      backgroundColor: item.done ? C.green : C.bg,
                      borderWidth: item.done ? 0 : 1,
                      borderColor: C.border,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {item.done && (
                      <Feather name="check" size={11} color="white" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 12,
                      color: item.done ? C.textSub : C.textMuted,
                      fontWeight: item.done ? "600" : "400",
                    }}
                  >
                    {item.label}
                  </Text>
                </Row>
              ))}
            </View>

            {/* Feedback */}
            {report.feedback && report.status !== "Pendiente" && (
              <View
                style={{
                  backgroundColor: C.tealLighter,
                  borderRadius: 10,
                  borderLeftWidth: 3,
                  borderLeftColor: C.teal,
                  padding: 13,
                  marginBottom: 14,
                }}
              >
                <Row style={{ alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Feather name="message-square" size={13} color={C.teal} />
                  <Text
                    style={{ fontSize: 12, fontWeight: "700", color: C.teal }}
                  >
                    Retroalimentación · {report.reviewer}
                  </Text>
                </Row>
                <Text
                  style={{ fontSize: 12, color: C.textSub, lineHeight: 18 }}
                >
                  {report.feedback}
                </Text>
              </View>
            )}

            {/* Actions */}
            <Row style={{ gap: 8, justifyContent: "flex-end" }}>
              <TouchableOpacity
                onPress={() => setViewing(report)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 8,
                  backgroundColor: C.card,
                }}
              >
                <Feather name="eye" size={12} color={C.textMuted} />
                <Text
                  style={{
                    fontSize: 12,
                    color: C.textMuted,
                    fontWeight: "600",
                  }}
                >
                  Ver reporte
                </Text>
              </TouchableOpacity>
              {canDeliver &&
                report.status === "Pendiente" &&
                !report.submitted && (
                  <TouchableOpacity
                    onPress={() => deliverReport(report.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: C.teal,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: 8,
                    }}
                  >
                    <Feather name="upload" size={12} color="white" />
                    <Text
                      style={{
                        fontSize: 12,
                        color: "white",
                        fontWeight: "700",
                      }}
                    >
                      Entregar
                    </Text>
                  </TouchableOpacity>
                )}
            </Row>
          </View>
        )}
      </Card>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <Row
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
            Seguimiento de Reportes
          </Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
            Residencia Industrial · 2024-B
          </Text>
        </View>
        <TouchableOpacity
          onPress={exportReports}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            borderWidth: 1,
            borderColor: C.teal,
            paddingHorizontal: 14,
            paddingVertical: 9,
            borderRadius: 9,
            backgroundColor: C.tealLighter,
          }}
        >
          <Feather name="download" size={13} color={C.teal} />
          <Text style={{ color: C.teal, fontWeight: "700", fontSize: 13 }}>
            Exportar
          </Text>
        </TouchableOpacity>
      </Row>

      {/* Stat Cards */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard
          label="Parciales Aceptados"
          value={`${parcialesAceptados}/3`}
          icon="check-circle"
          iconBg={C.greenLight}
          iconColor={C.green}
          sub={`${Math.round((parcialesAceptados / 3) * 100)}% completado`}
        />
        <StatCard
          label="Reporte Final"
          value={finalDesbloqueado ? "Desbloqueado" : "Bloqueado"}
          icon={finalDesbloqueado ? "unlock" : "lock"}
          iconBg={finalDesbloqueado ? C.greenLight : C.amberLight}
          iconColor={finalDesbloqueado ? C.green : C.amber}
        />
        <StatCard
          label="Preliminar"
          value={preliminarAprobado ? "Aceptado" : "Pendiente"}
          icon="file"
          iconBg={preliminarAprobado ? C.greenLight : C.bg}
          iconColor={preliminarAprobado ? C.green : C.textMuted}
        />
      </Row>

      {/* Progress bar */}
      <Card style={{ marginBottom: 18 }}>
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
            Progreso General
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "700", color: C.teal }}>
            {Math.round((parcialesAceptados / 3) * 100)}%
          </Text>
        </Row>
        <ProgressBar pct={(parcialesAceptados / 3) * 100} color={C.teal} />
        <Row style={{ justifyContent: "space-between", marginTop: 10 }}>
          <Text style={{ fontSize: 11, color: C.textMuted }}>
            {parcialesAceptados} de 3 parciales aceptados
          </Text>
          <Text style={{ fontSize: 11, color: C.textMuted }}>
            {finalDesbloqueado
              ? "Reporte Final desbloqueado ✓"
              : "Reporte Final bloqueado"}
          </Text>
        </Row>
      </Card>

      {/* ── Preliminar ── */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C.textMuted,
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Reporte Preliminar
      </Text>
      <View style={{ marginBottom: 20 }}>
        {preliminar && <ReportCard report={preliminar} canDeliver={false} />}
      </View>

      {/* ── Parciales ── */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C.textMuted,
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Reportes Parciales
      </Text>
      {!preliminarAprobado ? (
        <Card
          style={{
            marginBottom: 20,
            backgroundColor: C.amberLight,
            borderWidth: 1,
            borderColor: C.amber,
          }}
        >
          <Row style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.amber,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="lock" size={18} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "800", color: "#92400e" }}
              >
                Parciales bloqueados
              </Text>
              <Text style={{ fontSize: 12, color: "#92400e", marginTop: 2 }}>
                Tu Reporte Preliminar debe ser aceptado por tu asesor antes de
                que puedas entregar los reportes parciales.
              </Text>
            </View>
          </Row>
        </Card>
      ) : (
        <View style={{ gap: 12, marginBottom: 20 }}>
          {parciales.map((r) => (
            <ReportCard key={r.id} report={r} canDeliver={true} />
          ))}
        </View>
      )}

      {/* ── Final status ── */}
      <Text
        style={{
          fontSize: 13,
          fontWeight: "800",
          color: C.textMuted,
          marginBottom: 10,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Reporte Final
      </Text>
      {!finalDesbloqueado ? (
        <Card
          style={{
            backgroundColor: C.bgDark,
            borderWidth: 1,
            borderColor: C.border,
            borderStyle: "dashed",
          }}
        >
          <Row style={{ alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: C.bg,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="lock" size={18} color={C.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 14, fontWeight: "700", color: C.textMuted }}
              >
                Reporte Final · Bloqueado
              </Text>
              <Text style={{ fontSize: 12, color: C.textLight, marginTop: 2 }}>
                {!preliminarAprobado
                  ? "Requiere: Preliminar aceptado + los 3 parciales aceptados."
                  : `Requiere: ${3 - parcialesAceptados} parcial(es) más aceptado(s).`}
              </Text>
            </View>
            <Badge text="Bloqueado" color={C.textMuted} bg={C.bg} />
          </Row>
        </Card>
      ) : (
        final && <ReportCard report={final} canDeliver={false} />
      )}

      {/* ── Detail Modal ── */}
      <Modal visible={!!viewingReport} transparent animationType="fade">
        <Pressable
          onPress={() => setViewing(null)}
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.45)",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              width: "100%",
              maxWidth: 620,
              backgroundColor: C.card,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: C.border,
              padding: 22,
            }}
          >
            {viewingReport && (
              <>
                <Row
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 14,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                  >
                    {viewingReport.title}
                  </Text>
                  <TouchableOpacity onPress={() => setViewing(null)}>
                    <Feather name="x" size={20} color={C.textMuted} />
                  </TouchableOpacity>
                </Row>
                <Text
                  style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}
                >
                  {viewingReport.subtitle}
                </Text>
                <Row style={{ gap: 8, marginBottom: 14 }}>
                  <Badge
                    text={viewingReport.status}
                    color={statusStyle(viewingReport.status, C).color}
                    bg={statusStyle(viewingReport.status, C).bg}
                  />
                </Row>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: C.textSub,
                    marginBottom: 8,
                  }}
                >
                  Secciones
                </Text>
                <View style={{ gap: 6, marginBottom: 14 }}>
                  {viewingReport.items.map((item, idx) => (
                    <Row key={idx} style={{ alignItems: "center", gap: 8 }}>
                      <Feather
                        name={item.done ? "check-circle" : "circle"}
                        size={14}
                        color={item.done ? C.green : C.textLight}
                      />
                      <Text style={{ fontSize: 12, color: C.textSub }}>
                        {item.label}
                      </Text>
                    </Row>
                  ))}
                </View>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "700",
                    color: C.textSub,
                    marginBottom: 8,
                  }}
                >
                  Retroalimentación
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textMuted, lineHeight: 18 }}
                >
                  {viewingReport.status !== "Pendiente" &&
                  viewingReport.feedback
                    ? viewingReport.feedback
                    : "Este reporte todavía no tiene retroalimentación."}
                </Text>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
