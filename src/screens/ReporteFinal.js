import { useState, useEffect } from "react";
import { Alert, View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card, ProgressBar, Badge } from "../components";
import { useReportes } from "../context/ReportesContext";
import apiClient from "../utils/apiClient";

// Secciones requeridas del reporte final (template fijo — no son datos de BD)
const CHECKLIST_LABELS = [
  "Portada e identificación",
  "Índice de contenidos",
  "Resumen ejecutivo",
  "Introducción y justificación",
  "Marco teórico",
  "Descripción del problema",
  "Objetivos específicos",
  "Metodología aplicada",
  "Resultados obtenidos",
  "Análisis y discusión",
  "Conclusiones",
  "Bibliografía y anexos",
];

// Ponderación de rúbrica (criterios institucionales — no cambian por alumno)
const RUBRIC_TEMPLATE = [
  { label: "Contenido técnico",    pct: 0.40 },
  { label: "Redacción y estilo",   pct: 0.20 },
  { label: "Evidencias y anexos",  pct: 0.20 },
  { label: "Formato y presentación", pct: 0.10 },
  { label: "Originalidad",         pct: 0.10 },
];

export default function ReporteFinal({ usuario }) {
  const {
    finalDesbloqueado,
    todosParcialesAprobados,
    preliminarAprobado,
    updateReport,
    reports,
  } = useReportes() || {};
  const [uploadHover, setUploadHover] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ── Datos reales del residente / asesor / proyecto ─────────────────────
  const [asesor,   setAsesor]   = useState(null);
  const [proyecto, setProyecto] = useState(null);

  useEffect(() => {
    apiClient.get("/api/residente/asesor").then((res) => {
      if (res.ok && res.body?.ok) setAsesor(res.body.asesor);
    });
    apiClient.get("/api/residente/proyecto").then((res) => {
      if (res.ok && res.body?.ok) setProyecto(res.body.proyecto);
    });
  }, []);

  // ── Datos del reporte final ────────────────────────────────────────────
  const finalReport = reports?.find((r) => r.id === "final");
  const fechaLimite = finalReport?.fecha_limite
    ? new Date(finalReport.fecha_limite).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })
    : null;

  // ── CHECKLIST: todas las secciones "done" si el reporte fue aceptado ───
  const finalAceptado = finalReport?.status === "Aceptado";
  const CHECKLIST = CHECKLIST_LABELS.map((label) => ({ label, done: finalAceptado }));
  const doneCount = CHECKLIST.filter((i) => i.done).length;
  const pct = Math.round((doneCount / CHECKLIST.length) * 100);

  // ── TIMELINE: derivado de las fechas reales de los reportes ────────────
  const parciales = reports?.filter((r) => typeof r.id === "number") ?? [];
  const TIMELINE = [
    ...(proyecto?.fecha_inicio
      ? [{ label: "Inicio de residencia", date: new Date(proyecto.fecha_inicio).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" }), done: true }]
      : []),
    ...parciales.map((p, i) => ({
      label: `Reporte Parcial ${i + 1}`,
      date: p.submitted
        ? new Date(p.submitted).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })
        : "Pendiente",
      done: p.status === "Aceptado",
      current: p.status === "Pendiente" && p.submitted,
    })),
    {
      label: "Reporte Final",
      date: fechaLimite || "Por definir",
      done: finalReport?.status === "Aceptado",
      current: finalReport?.status === "Pendiente" && finalReport?.submitted,
    },
  ];

  // ── RÚBRICA: distribuye la calificación real según los pesos ───────────
  const calificacion = finalReport?.calificacion ?? null;
  const RUBRIC = RUBRIC_TEMPLATE.map((r) => ({
    label: r.label,
    max: Math.round(r.pct * 100),
    earned: calificacion !== null ? Math.round(r.pct * calificacion) : 0,
  }));
  const totalEarned = calificacion ?? 0;
  const totalMax    = 100;

  // ── Nombre del residente e iniciales ──────────────────────────────────
  const nombreResidente = usuario
    ? `${usuario.nombre} ${usuario.apellidos}`
    : "—";
  const inicialesResidente = usuario
    ? `${(usuario.nombre || "")[0]}${(usuario.apellidos || "")[0]}`.toUpperCase()
    : "?";

  // ── Nombre del asesor ─────────────────────────────────────────────────
  const nombreAsesor = asesor?.nombre ?? "—";

  // ── Lock screen ──────────────────────────────────────────────────────────
  if (!finalDesbloqueado) {
    const faltaPreliminar = !preliminarAprobado;
    const faltaParciales = preliminarAprobado && !todosParcialesAprobados;
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            backgroundColor: C.amberLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Feather name="lock" size={36} color={C.amber} />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: C.text,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          Reporte Final bloqueado
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: C.textMuted,
            textAlign: "center",
            lineHeight: 22,
            maxWidth: 420,
            marginBottom: 28,
          }}
        >
          {faltaPreliminar
            ? "Necesitas que tu Reporte Preliminar sea aprobado por tu asesor antes de poder entregar el Reporte Final."
            : faltaParciales
              ? "Todos tus reportes parciales deben estar en estado Aprobado para desbloquear el Reporte Final."
              : "Completa todos los requisitos previos para desbloquear el Reporte Final."}
        </Text>
        <View
          style={{
            backgroundColor: C.card,
            borderRadius: 14,
            padding: 20,
            borderWidth: 1,
            borderColor: C.border,
            width: "100%",
            maxWidth: 380,
          }}
        >
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.textSub,
              marginBottom: 12,
            }}
          >
            Requisitos
          </Text>
          {[
            {
              label: "Reporte Preliminar aprobado",
              done: !!preliminarAprobado,
            },
            ...(reports?.filter((r) => typeof r.id === "number") ?? []).map(
              (p) => ({
                label: `${p.title} aprobado`,
                done: p.status === "Aceptado",
              }),
            ),
          ].map((req, i) => (
            <Row
              key={i}
              style={{ alignItems: "center", gap: 10, marginBottom: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  backgroundColor: req.done ? C.green : C.bg,
                  borderWidth: req.done ? 0 : 1,
                  borderColor: C.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {req.done && <Feather name="check" size={12} color="white" />}
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: req.done ? C.textSub : C.textLight,
                  fontWeight: req.done ? "600" : "400",
                }}
              >
                {req.label}
              </Text>
            </Row>
          ))}
        </View>
      </View>
    );
  }

  const selectFile = () => {
    if (!globalThis?.document?.createElement) {
      Alert.alert(
        "Seleccionar archivo",
        "La seleccion de archivos esta disponible en la version web.",
      );
      return;
    }

    const input = globalThis.document.createElement("input");
    input.type = "file";
    input.accept =
      ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    input.onchange = (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || "Documento",
      });
    };
    input.click();
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Dark Navy Banner Header */}
      <View
        style={{
          backgroundColor: C.navy,
          borderRadius: 16,
          padding: 24,
          marginBottom: 20,
          overflow: "hidden",
        }}
      >
        {/* Decorative circle */}
        <View
          style={{
            position: "absolute",
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: C.teal,
            opacity: 0.05,
            top: -60,
            right: -40,
          }}
        />
        <Row
          style={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <View style={{ flex: 1, marginRight: 20 }}>
            <Row style={{ alignItems: "center", gap: 8, marginBottom: 6 }}>
              <View
                style={{
                  backgroundColor: C.teal,
                  borderRadius: 6,
                  paddingHorizontal: 9,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: "white",
                    letterSpacing: 0.5,
                  }}
                >
                  REPORTE FINAL
                </Text>
              </View>
              <Badge
                text="En Progreso"
                color={C.amber}
                bg="rgba(245,158,11,0.2)"
              />
            </Row>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "white",
                lineHeight: 26,
                marginBottom: 4,
              }}
            >
              {proyecto?.titulo ?? "Reporte Final de Residencia"}
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 14,
              }}
            >
              {proyecto?.empresa?.nombre ?? ""}
            </Text>

            {/* Student info */}
            <Row style={{ alignItems: "center", gap: 14, marginBottom: 16 }}>
              <Row style={{ alignItems: "center", gap: 7 }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: C.teal,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{ fontSize: 10, color: "white", fontWeight: "800" }}
                  >
                    {inicialesResidente}
                  </Text>
                </View>
                <Text
                  style={{
                    fontSize: 12,
                    color: "rgba(255,255,255,0.8)",
                    fontWeight: "600",
                  }}
                >
                  {nombreResidente}
                </Text>
              </Row>
              <Row style={{ alignItems: "center", gap: 5 }}>
                <Feather name="user" size={11} color="rgba(255,255,255,0.5)" />
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  {nombreAsesor}
                </Text>
              </Row>
            </Row>

            {/* Deadline */}
            <Row style={{ alignItems: "center", gap: 6 }}>
              <Feather
                name="calendar"
                size={12}
                color="rgba(255,255,255,0.5)"
              />
              <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                Fecha límite:{" "}
                <Text style={{ color: C.amber, fontWeight: "700" }}>
                  {fechaLimite ?? "Por definir"}
                </Text>
              </Text>
            </Row>
          </View>

          {/* Progress Circle (simulated) */}
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                width: 90,
                height: 90,
                borderRadius: 45,
                borderWidth: 8,
                borderColor: C.navyLight,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: C.navyMid,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  borderWidth: 8,
                  borderColor: C.teal,
                  borderRightColor: "transparent",
                  borderBottomColor: "transparent",
                  transform: [{ rotate: "-45deg" }],
                }}
              />
              <Text style={{ fontSize: 20, fontWeight: "800", color: "white" }}>
                {pct}%
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {doneCount}/{CHECKLIST.length} secciones
            </Text>
          </View>
        </Row>

        {/* Progress bar */}
        <View style={{ marginTop: 16 }}>
          <Row style={{ justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              Progreso del reporte
            </Text>
            <Text style={{ fontSize: 11, color: C.teal, fontWeight: "700" }}>
              {pct}% completado
            </Text>
          </Row>
          <View
            style={{
              height: 6,
              backgroundColor: C.navyLight,
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${pct}%`,
                backgroundColor: C.teal,
                borderRadius: 3,
              }}
            />
          </View>
        </View>
      </View>

      {/* Main content: 2 columns */}
      <Row style={{ gap: 18, alignItems: "flex-start" }}>
        {/* Left: Checklist + Upload */}
        <View style={{ flex: 1 }}>
          {/* Checklist */}
          <Card style={{ marginBottom: 16 }}>
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
                Lista de Contenidos
              </Text>
              <Badge
                text={`${doneCount}/${CHECKLIST.length} completados`}
                color={C.teal}
                bg={C.tealLight}
              />
            </Row>
            {/* 2-column grid */}
            <Row style={{ flexWrap: "wrap", gap: 10 }}>
              {CHECKLIST.map((item, i) => (
                <View
                  key={i}
                  style={{
                    width: "47%",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    backgroundColor: item.done ? C.tealLighter : C.bg,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: item.done ? C.tealLight : C.border,
                    padding: 10,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      backgroundColor: item.done ? C.teal : C.card,
                      borderWidth: item.done ? 0 : 1.5,
                      borderColor: C.border,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {item.done && (
                      <Feather name="check" size={12} color="white" />
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 11,
                      color: item.done ? C.teal : C.textMuted,
                      fontWeight: item.done ? "700" : "500",
                      flex: 1,
                    }}
                    numberOfLines={2}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </Row>
          </Card>

          {/* File Upload */}
          <Card>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "800",
                color: C.text,
                marginBottom: 14,
              }}
            >
              Subir Documento
            </Text>
            <TouchableOpacity
              onPress={selectFile}
              onPressIn={() => setUploadHover(true)}
              onPressOut={() => setUploadHover(false)}
              activeOpacity={0.8}
              style={{
                borderWidth: 2,
                borderStyle: "dashed",
                borderColor: uploadHover ? C.teal : C.border,
                borderRadius: 12,
                padding: 28,
                alignItems: "center",
                backgroundColor: uploadHover ? C.tealLighter : C.bg,
                marginBottom: 14,
              }}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 13,
                  backgroundColor: C.tealLight,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Feather name="upload-cloud" size={22} color={C.teal} />
              </View>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "700",
                  color: C.text,
                  marginBottom: 4,
                }}
              >
                Arrastra tu archivo aquí
              </Text>
              <Text
                style={{ fontSize: 12, color: C.textMuted, marginBottom: 10 }}
              >
                o haz clic para seleccionar
              </Text>
              <TouchableOpacity
                onPress={selectFile}
                style={{
                  backgroundColor: C.teal,
                  borderRadius: 8,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                }}
              >
                <Text
                  style={{ fontSize: 12, color: "white", fontWeight: "700" }}
                >
                  Seleccionar archivo
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {selectedFile && (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: C.tealLight,
                  borderRadius: 10,
                  backgroundColor: C.tealLighter,
                  padding: 12,
                  marginBottom: 12,
                }}
              >
                <Row style={{ alignItems: "center", gap: 8 }}>
                  <Feather name="file-text" size={16} color={C.teal} />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 12, fontWeight: "700", color: C.text }}
                    >
                      {selectedFile.name}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {selectedFile.size}
                    </Text>
                  </View>
                  <Badge text="Listo" color={C.green} bg={C.greenLight} />
                </Row>
              </View>
            )}
            <Text
              style={{ fontSize: 11, color: C.textLight, textAlign: "center" }}
            >
              Formatos aceptados: PDF, DOCX · Tamaño máximo: 25 MB
            </Text>
          </Card>

          {/* Submit button */}
          {!submitted ? (
            <TouchableOpacity
              onPress={() => {
                if (!selectedFile) {
                  Alert.alert(
                    "Sin archivo",
                    "Selecciona tu documento antes de entregar.",
                  );
                  return;
                }
                const today = new Date().toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                });
                updateReport &&
                  updateReport("final", {
                    status: "En Revisión",
                    submitted: today,
                  });
                setSubmitted(true);
                Alert.alert(
                  "Reporte Final entregado",
                  "Tu asesor recibirá una notificación para revisarlo.",
                );
              }}
              style={{
                backgroundColor: C.navy,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Row style={{ alignItems: "center", gap: 8 }}>
                <Feather name="send" size={16} color="white" />
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                >
                  Entregar Reporte Final
                </Text>
              </Row>
            </TouchableOpacity>
          ) : (
            <View
              style={{
                backgroundColor: C.greenLight,
                borderRadius: 12,
                padding: 16,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Row style={{ alignItems: "center", gap: 8 }}>
                <Feather name="check-circle" size={16} color={C.green} />
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: C.green }}
                >
                  Reporte entregado — En revisión
                </Text>
              </Row>
            </View>
          )}
        </View>

        {/* Right Sidebar */}
        <View style={{ width: 280 }}>
          {/* Timeline */}
          <Card style={{ marginBottom: 14 }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "800",
                color: C.text,
                marginBottom: 16,
              }}
            >
              Línea de Tiempo
            </Text>
            <View style={{ gap: 0 }}>
              {TIMELINE.map((ev, i) => (
                <Row key={i} style={{ gap: 12, alignItems: "flex-start" }}>
                  {/* Connector */}
                  <View style={{ alignItems: "center" }}>
                    <View
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: ev.done
                          ? C.teal
                          : ev.current
                            ? C.amber
                            : C.bg,
                        borderWidth: ev.done ? 0 : 2,
                        borderColor: ev.current ? C.amber : C.border,
                        marginTop: 2,
                      }}
                    >
                      {ev.done && (
                        <View
                          style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name="check" size={8} color="white" />
                        </View>
                      )}
                    </View>
                    {i < TIMELINE.length - 1 && (
                      <View
                        style={{
                          width: 2,
                          flex: 1,
                          minHeight: 24,
                          backgroundColor: ev.done ? C.tealLight : C.border,
                          marginVertical: 2,
                        }}
                      />
                    )}
                  </View>
                  <View
                    style={{
                      flex: 1,
                      paddingBottom: i < TIMELINE.length - 1 ? 8 : 0,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: ev.current ? "800" : "600",
                        color: ev.done
                          ? C.teal
                          : ev.current
                            ? C.amber
                            : C.textMuted,
                      }}
                    >
                      {ev.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textLight }}>
                      {ev.date}
                    </Text>
                    {ev.current && (
                      <Badge
                        text="En progreso"
                        color={C.amber}
                        bg={C.amberLight}
                      />
                    )}
                  </View>
                </Row>
              ))}
            </View>
          </Card>

          {/* Rubric */}
          <Card>
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "800", color: C.text }}>
                Rúbrica
              </Text>
              <Text style={{ fontSize: 13, fontWeight: "800", color: C.teal }}>
                {totalEarned}/{totalMax}
              </Text>
            </Row>
            <View style={{ gap: 12 }}>
              {RUBRIC.map((r, i) => (
                <View key={i}>
                  <Row
                    style={{ justifyContent: "space-between", marginBottom: 5 }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        color: C.textSub,
                        fontWeight: "600",
                      }}
                    >
                      {r.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {r.earned}/{r.max}
                    </Text>
                  </Row>
                  <ProgressBar
                    pct={(r.earned / r.max) * 100}
                    color={r.earned > 0 ? C.teal : C.border}
                  />
                </View>
              ))}
            </View>
          </Card>
        </View>
      </Row>
    </ScrollView>
  );
}
