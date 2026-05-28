import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, StatCard, Badge, ProgressBar } from "../components";
import { useProyectos } from "../context/ProyectosContext";
import { useReportes } from "../context/ReportesContext";
import { useNotificaciones } from "../context/NotificacionesContext";
import apiClient from "../utils/apiClient";

// Mapeo fase → id en ReportesContext (para sincronizar feedback al Residente)
const FASE_TO_REPORTES_ID = {
  Preliminar: "preliminar",
  "Parcial 1": 1,
  "Parcial 2": 2,
  "Parcial 3": 3,
  Final: "final",
};

// Secuencia canónica de fases en orden
const FASE_SEQUENCE = [
  "Preliminar",
  "Parcial 1",
  "Parcial 2",
  "Parcial 3",
  "Final",
];

export default function SeguimientoAsesor() {
  const { colors: C } = useTheme();
  const {
    proyectos,
    updateReporte,
    desbloqueadosPorResidente,
    desbloquearReporteResidente,
  } = useProyectos() || { proyectos: [] };
  const { reviewReport, desbloquearParcial } = useReportes() || {};
  const { setNotifications } = useNotificaciones() || {};

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedResidente, setSelectedResidente] = useState(null);
  const [reviewingReport, setReviewingReport] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackError, setFeedbackError] = useState(false);
  const [expandedReport, setExpandedReport] = useState(null);
  const [cumpleObjetivos, setCumpleObjetivos] = useState(false);
  const [cumpleDiagnostico, setCumpleDiagnostico] = useState(false);
  const [cumplePlanTrabajo, setCumplePlanTrabajo] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Proyecto activo
  const activeProject = useMemo(
    () => proyectos.find((p) => p.id === selectedProjectId) || null,
    [proyectos, selectedProjectId],
  );

  // ── Residentes únicos del proyecto activo ─────────────────────────────────
  const residentesDelProyecto = useMemo(() => {
    if (!activeProject) return [];
    const nombres = [
      ...new Set(activeProject.reportes.map((r) => r.residente)),
    ];
    return nombres;
  }, [activeProject]);

  // Auto-seleccionar primer residente cuando cambia el proyecto
  const handleSelectProject = (id) => {
    setSelectedProjectId(id);
    setSelectedResidente(null);
    setExpandedReport(null);
  };

  const handleSelectResidente = (nombre) => {
    setSelectedResidente(nombre);
    setExpandedReport(null);
  };

  // Reportes filtrados por residente seleccionado
  const reportesFiltrados = useMemo(() => {
    if (!activeProject || !selectedResidente) return [];
    return activeProject.reportes.filter(
      (r) => r.residente === selectedResidente,
    );
  }, [activeProject, selectedResidente]);

  // ── Stats globales ────────────────────────────────────────────────────────
  const globalStats = useMemo(() => {
    let aceptados = 0,
      total = 0,
      pendientes = 0;
    let fechaMasTemprana = null;

    proyectos.forEach((p) => {
      p.reportes.forEach((r) => {
        total++;
        if (r.status === "Aceptado") aceptados++;
        if (r.status === "Pendiente") {
          pendientes++;
          if (!r.fecha) return; // Sin fecha → no se envió aún
          const f = new Date(r.fecha);
          if (isNaN(f.getTime())) return; // Fecha inválida
          if (!fechaMasTemprana || f < fechaMasTemprana) fechaMasTemprana = f;
        }
      });
    });

    let esperandoLabel = "Sin pendientes";
    if (fechaMasTemprana) {
      const hoy = new Date();
      const diff = Math.floor((hoy - fechaMasTemprana) / (1000 * 60 * 60 * 24));
      esperandoLabel =
        diff === 0
          ? "Recibido hoy"
          : diff === 1
            ? "Hace 1 día"
            : `Hace ${diff} días`;
    }

    return { aceptados, total, pendientes, esperandoLabel };
  }, [proyectos]);

  // ── Stats del residente seleccionado ──────────────────────────────────────
  const residenteStats = useMemo(() => {
    if (!selectedResidente || reportesFiltrados.length === 0) return null;
    const aceptados = reportesFiltrados.filter(
      (r) => r.status === "Aceptado",
    ).length;
    const totalReqReportes = 5;
    const avancePct = Math.round((aceptados / totalReqReportes) * 100);
    return {
      aceptados,
      total: reportesFiltrados.length,
      avancePct,
      totalReqReportes,
    };
  }, [reportesFiltrados, selectedResidente]);

  // ── Función para crear notificación persistente ─────────────────────────────
  const crearNotificacionPersistente = async (
    residenteId,
    datosNotificacion,
  ) => {
    try {
      const response = await apiClient.post("/api/notificaciones", {
        usuario_id: residenteId,
        tipo_notificacion: datosNotificacion.tipo,
        titulo: datosNotificacion.titulo,
        mensaje: datosNotificacion.mensaje,
        icon: datosNotificacion.icon,
        icon_color: datosNotificacion.iconColor,
        icon_bg: datosNotificacion.iconBg,
        proyecto_id: datosNotificacion.proyectoId,
        fase: datosNotificacion.fase,
        action_screen: datosNotificacion.actionScreen,
        action_label: datosNotificacion.actionLabel,
        metadata: datosNotificacion.metadata || null,
      });

      if (!response.ok) {
        console.warn(
          "Error al crear notificación persistente:",
          response.body?.mensaje,
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error("Error de red al crear notificación:", err);
      return false;
    }
  };

  // ── Funciones helper para reducir complejidad ───────────────────────────────
  const validateReviewInput = () => {
    if (!reviewingReport || !activeProject) return false;
    if (!feedback.trim()) {
      setFeedbackError(true);
      return false;
    }
    setFeedbackError(false);
    return true;
  };

  const getFinalStatus = (newStatus) => {
    const esPreliminar = reviewingReport.fase === "Preliminar";
    return newStatus === "Aceptado"
      ? "Aceptado"
      : esPreliminar
        ? "No aceptado"
        : "Por corregir";
  };

  const createHistorialEntry = (statusFinal) => {
    const today = new Date().toISOString().slice(0, 10);
    return {
      status: statusFinal,
      fecha: today,
      comentario: feedback.trim(),
    };
  };

  const createNotificationData = (statusFinal) => {
    const esPreliminar = reviewingReport.fase === "Preliminar";
    const isAceptado = statusFinal === "Aceptado";
    const nombreReporte = reviewingReport.titulo || reviewingReport.fase;

    const titulo = isAceptado
      ? `El reporte "${nombreReporte}" fue aceptado ✓`
      : esPreliminar
        ? `El reporte "${nombreReporte}" no fue aceptado`
        : `El reporte "${nombreReporte}" requiere correcciones`;

    return {
      tipo: "REVISION",
      titulo,
      mensaje: feedback.trim(),
      icon: isAceptado ? "check-circle" : "x-circle",
      iconColor: isAceptado ? C.green : C.red,
      iconBg: isAceptado ? C.greenLight : C.redLight,
      proyectoId: activeProject.id,
      fase: reviewingReport.fase,
      actionScreen: "reportes",
      actionLabel: isAceptado ? "Ver reporte" : "Corregir reporte",
      metadata: {
        reporteId: reviewingReport.id,
        proyectoTitle: activeProject.title,
        residente: selectedResidente,
      },
    };
  };

  const updateLocalState = (statusFinal, historialEntry) => {
    updateReporte(activeProject.id, reviewingReport.id, {
      status: statusFinal,
      feedback: feedback.trim(),
      fechaRevision: historialEntry.fecha,
      historial: [...(reviewingReport.historial || []), historialEntry],
      cumpleObjetivos,
      cumpleDiagnostico,
      cumplePlanTrabajo,
    });
  };

  const saveReviewToBackend = async (statusFinal) => {
    const reportesId = FASE_TO_REPORTES_ID[reviewingReport.fase];
    if (reportesId === undefined || !reviewReport) return { skipped: true };

    const reviewResult = await reviewReport(reportesId, {
      status: statusFinal,
      feedback: feedback.trim(),
      reviewer: "Asesor",
      dbReporteId: reviewingReport.id,
    });

    if (!reviewResult) {
      throw new Error("No se pudo guardar la revisión en la base de datos");
    }
    // reviewReport devuelve true o el objeto con residenteUsuarioId (si el backend lo envía)
    return reviewResult;
  };

  const sendNotification = async (datosNotificacion, residenteUsuarioId) => {
    // BUG FIX #1: usar residenteUsuarioId devuelto por el backend (garantizado),
    // o como fallback buscarlo en activeProject.residentes
    const targetId =
      residenteUsuarioId ||
      activeProject.residentes?.find((r) => r.nombre === selectedResidente)
        ?.usuarioId;
    if (!targetId) return;
    await crearNotificacionPersistente(targetId, datosNotificacion);
  };

  // ── Guardar revisión ──────────────────────────────────────────────────────
  const submitReview = async (newStatus) => {
    if (!validateReviewInput()) return;

    setIsSubmittingReview(true);
    setSubmitError(null);

    try {
      const statusFinal = getFinalStatus(newStatus);
      const historialEntry = createHistorialEntry(statusFinal);

      // 1. Guardar en backend y obtener residenteUsuarioId
      const reviewResult = await saveReviewToBackend(statusFinal);
      const residenteUsuarioId =
        reviewResult?.residenteUsuarioId || reviewResult;

      // 2. Actualizar estado local
      updateLocalState(statusFinal, historialEntry);

      // 3. Enviar notificación AL RESIDENTE (no al asesor)
      // BUG FIX: pasar residenteUsuarioId explícitamente para asegurar que la notif
      // llegue al residente correcto, no al asesor que hizo la acción.
      const datosNotificacion = createNotificationData(statusFinal);
      await sendNotification(datosNotificacion, residenteUsuarioId);

      // Éxito: limpiar formulario
      setReviewingReport(null);
      setFeedback("");
    } catch (error) {
      console.error("Error al guardar revisión:", error);
      setSubmitError(
        error.message ||
          "No se pudo guardar la revisión. Verifica tu conexión.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* ── Header ── */}
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
            Selecciona un proyecto y un residente para revisar
          </Text>
        </View>
      </Row>

      {/* ── Stats globales ── */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard
          label="Aceptados / Total"
          value={`${globalStats.aceptados}/${globalStats.total}`}
          icon="check-circle"
          iconBg={C.greenLight}
          iconColor={C.green}
        />
        <StatCard
          label="Reportes Pendientes"
          value={globalStats.pendientes > 0 ? `${globalStats.pendientes}` : "0"}
          sub={
            globalStats.pendientes > 0
              ? globalStats.esperandoLabel
              : "Todo al día"
          }
          icon="clock"
          iconBg={globalStats.pendientes > 0 ? C.redLight : C.greenLight}
          iconColor={globalStats.pendientes > 0 ? C.red : C.green}
        />
      </Row>

      {/* ── PASO 1: Selector de proyecto ── */}
      <View style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "700",
            color: C.textMuted,
            textTransform: "uppercase",
            letterSpacing: 0.5,
            marginBottom: 10,
          }}
        >
          1 — Seleccionar Proyecto
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row style={{ gap: 8 }}>
            {proyectos.map((p) => {
              const pendientes = p.reportes.filter(
                (r) => r.status === "Pendiente",
              ).length;
              const isActive = activeProject?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handleSelectProject(p.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: isActive ? C.teal : C.card,
                    borderWidth: 1.5,
                    borderColor: isActive ? C.teal : C.border,
                    minWidth: 140,
                  }}
                >
                  <Row
                    style={{ alignItems: "center", gap: 6, marginBottom: 2 }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: isActive ? "white" : C.text,
                      }}
                      numberOfLines={1}
                    >
                      {p.title}
                    </Text>
                    {pendientes > 0 && (
                      <View
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 9,
                          backgroundColor: isActive
                            ? "rgba(255,255,255,0.3)"
                            : C.amber,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 9,
                            fontWeight: "800",
                            color: "white",
                          }}
                        >
                          {pendientes}
                        </Text>
                      </View>
                    )}
                  </Row>
                  <Text
                    style={{
                      fontSize: 10,
                      color: isActive ? "rgba(255,255,255,0.7)" : C.textLight,
                    }}
                    numberOfLines={1}
                  >
                    {p.company}
                  </Text>
                  {residentesDelProyecto.length > 0 &&
                    activeProject?.id === p.id && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: "rgba(255,255,255,0.6)",
                          marginTop: 3,
                        }}
                      >
                        {residentesDelProyecto.length} residente
                        {residentesDelProyecto.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                </TouchableOpacity>
              );
            })}
          </Row>
        </ScrollView>
      </View>

      {/* ── PASO 2: Selector de residente ── */}
      {activeProject && (
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: "700",
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            2 — Seleccionar Residente
          </Text>

          {residentesDelProyecto.length === 0 ? (
            <Card style={{ padding: 16 }}>
              <Row style={{ alignItems: "center", gap: 10 }}>
                <Feather name="users" size={18} color={C.textLight} />
                <Text style={{ fontSize: 13, color: C.textMuted }}>
                  No hay reportes registrados para este proyecto aún.
                </Text>
              </Row>
            </Card>
          ) : (
            <Row style={{ gap: 8, flexWrap: "wrap" }}>
              {residentesDelProyecto.map((nombre) => {
                const reps = activeProject.reportes.filter(
                  (r) => r.residente === nombre,
                );
                const aceptados = reps.filter(
                  (r) => r.status === "Aceptado",
                ).length;
                const pendientes = reps.filter(
                  (r) => r.status === "Pendiente",
                ).length;
                const isActive = selectedResidente === nombre;

                // Iniciales del nombre
                const initials = nombre
                  .split(" ")
                  .slice(0, 2)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase();

                return (
                  <TouchableOpacity
                    key={nombre}
                    onPress={() => handleSelectResidente(nombre)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: isActive ? C.tealLighter : C.card,
                      borderWidth: 1.5,
                      borderColor: isActive ? C.teal : C.border,
                      minWidth: 190,
                      flex: 1,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: isActive ? C.teal : C.bg,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: isActive ? C.teal : C.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isActive ? "white" : C.textMuted,
                        }}
                      >
                        {initials}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: isActive ? C.teal : C.text,
                        }}
                        numberOfLines={1}
                      >
                        {nombre}
                      </Text>
                      <Row style={{ gap: 8, marginTop: 3 }}>
                        <Row style={{ alignItems: "center", gap: 3 }}>
                          <View
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: 4,
                              backgroundColor: C.green,
                            }}
                          />
                          <Text style={{ fontSize: 10, color: C.textMuted }}>
                            {aceptados} aceptados
                          </Text>
                        </Row>
                        {pendientes > 0 && (
                          <Row style={{ alignItems: "center", gap: 3 }}>
                            <View
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 4,
                                backgroundColor: C.amber,
                              }}
                            />
                            <Text style={{ fontSize: 10, color: C.textMuted }}>
                              {pendientes} pendiente
                              {pendientes !== 1 ? "s" : ""}
                            </Text>
                          </Row>
                        )}
                      </Row>
                    </View>
                    {isActive && (
                      <Feather name="chevron-right" size={14} color={C.teal} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </Row>
          )}
        </View>
      )}

      {/* ── PASO 3: Reportes del residente seleccionado ── */}
      {activeProject && selectedResidente && (
        <>
          {/* Stats del residente */}
          {residenteStats && (
            <Card style={{ marginBottom: 20 }}>
              <Row
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <View>
                  <Text
                    style={{ fontSize: 15, fontWeight: "700", color: C.text }}
                  >
                    {selectedResidente}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    {activeProject.title} · {activeProject.company}
                  </Text>
                </View>
                <Badge
                  text={`${residenteStats.aceptados}/${residenteStats.totalReqReportes} aceptados`}
                  color={C.green}
                  bg={C.greenLight}
                />
              </Row>
              <View>
                <Row
                  style={{ justifyContent: "space-between", marginBottom: 4 }}
                >
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    Progreso de reportes
                  </Text>
                  <Text
                    style={{ fontSize: 11, fontWeight: "700", color: C.teal }}
                  >
                    {residenteStats.avancePct}%
                  </Text>
                </Row>
                <ProgressBar pct={residenteStats.avancePct} color={C.teal} />
              </View>
            </Card>
          )}

          {/* Historial de reportes */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: C.textMuted,
              marginBottom: 12,
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Historial de Reportes — {selectedResidente}
          </Text>

          {reportesFiltrados.length === 0 ? (
            <Card style={{ padding: 20, alignItems: "center" }}>
              <Feather
                name="inbox"
                size={28}
                color={C.textLight}
                style={{ marginBottom: 10 }}
              />
              <Text
                style={{ fontSize: 14, color: C.textMuted, fontWeight: "600" }}
              >
                Sin reportes entregados
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: C.textLight,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Este residente aún no ha entregado ningún reporte.
              </Text>
            </Card>
          ) : (
            <View style={{ gap: 12 }}>
              {reportesFiltrados.map((report) => {
                // ── Determinar si este reporte está bloqueado ──────────────
                // Bloqueado = no tiene fecha de entrega Y el asesor no lo ha desbloqueado
                const desbloqueadosDeEsteResidente =
                  desbloqueadosPorResidente?.[selectedResidente] ?? new Set();
                const esBloqueado =
                  !report.fecha &&
                  !desbloqueadosDeEsteResidente.has(report.fase);

                // ── Determinar si el asesor puede desbloquearlo ahora ─────
                // Solo si la fase ANTERIOR está Aceptada (o es el primero tras el Preliminar)
                const idxFase = FASE_SEQUENCE.indexOf(report.fase);
                const fasePrev =
                  idxFase > 0 ? FASE_SEQUENCE[idxFase - 1] : null;
                const reportPrev = fasePrev
                  ? reportesFiltrados.find((r) => r.fase === fasePrev)
                  : null;
                const puedeDesbloquear =
                  esBloqueado &&
                  fasePrev !== null && // Preliminar no se desbloquea aquí
                  reportPrev?.status === "Aceptado";

                // ── Colores según estado ──────────────────────────────────
                const statusMap = {
                  Aceptado: { color: C.green, bg: C.greenLight, icon: "check" },
                  Pendiente: {
                    color: C.amber,
                    bg: C.amberLight,
                    icon: "clock",
                  },
                  "Por corregir": {
                    color: C.red,
                    bg: C.redLight,
                    icon: "alert-circle",
                  },
                };
                const st = esBloqueado
                  ? { color: C.textMuted, bg: C.bg, icon: "lock" }
                  : statusMap[report.status] || {
                      color: C.textMuted,
                      bg: C.bg,
                      icon: "minus",
                    };

                const isExpanded = expandedReport === report.id;
                const canReview =
                  !esBloqueado &&
                  (report.status === "Pendiente" ||
                    report.status === "Por corregir") &&
                  report.fecha;

                return (
                  <Card
                    key={report.id}
                    style={{
                      padding: 0,
                      overflow: "hidden",
                      borderLeftWidth: esBloqueado
                        ? 0
                        : report.status === "Pendiente" && report.fecha
                          ? 3
                          : 0,
                      borderLeftColor: C.amber,
                      opacity: esBloqueado ? 0.75 : 1,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        !esBloqueado &&
                        setExpandedReport(isExpanded ? null : report.id)
                      }
                      activeOpacity={esBloqueado ? 1 : 0.9}
                      style={{ padding: 16 }}
                    >
                      <Row
                        style={{
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <Row
                          style={{ flex: 1, gap: 12, alignItems: "flex-start" }}
                        >
                          <View
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 10,
                              backgroundColor: st.bg,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Feather
                              name={st.icon}
                              size={16}
                              color={st.color}
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "700",
                                color: esBloqueado ? C.textMuted : C.text,
                              }}
                            >
                              {report.titulo}
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: C.textMuted,
                                marginTop: 2,
                              }}
                            >
                              Fase: {report.fase}
                            </Text>
                            {esBloqueado ? (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: C.textLight,
                                  marginTop: 2,
                                  fontStyle: "italic",
                                }}
                              >
                                Bloqueado — el residente no puede entregar aún
                              </Text>
                            ) : report.fecha ? (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: C.textLight,
                                  marginTop: 2,
                                }}
                              >
                                Enviado: {report.fecha}
                              </Text>
                            ) : (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: C.teal,
                                  marginTop: 2,
                                  fontStyle: "italic",
                                }}
                              >
                                Desbloqueado — esperando entrega del residente
                              </Text>
                            )}
                          </View>
                        </Row>
                        <Row style={{ alignItems: "center", gap: 8 }}>
                          <Badge
                            text={esBloqueado ? "Bloqueado" : report.status}
                            color={st.color}
                            bg={st.bg}
                          />
                          {!esBloqueado && (
                            <Feather
                              name={isExpanded ? "chevron-up" : "chevron-down"}
                              size={14}
                              color={C.textMuted}
                            />
                          )}
                        </Row>
                      </Row>

                      {/* ── Botón Desbloquear (en la card del reporte bloqueado) ── */}
                      {puedeDesbloquear && (
                        <TouchableOpacity
                          onPress={async () => {
                            // Llamar al backend para persistir el desbloqueo
                            try {
                              await apiClient.post(
                                "/api/asesor/desbloquear-reporte",
                                {
                                  residenteNombre: selectedResidente,
                                  fase: report.fase,
                                  proyectoId: activeProject?.id,
                                },
                              );
                            } catch (err) {
                              console.error(
                                "Error al persistir desbloqueo:",
                                err,
                              );
                            }
                            // Actualizar ProyectosContext (vista del asesor)
                            desbloquearReporteResidente?.(
                              selectedResidente,
                              report.fase,
                            );
                            // Actualizar ReportesContext (vista del residente demo)
                            const resId = FASE_TO_REPORTES_ID[report.fase];
                            if (typeof resId === "number")
                              desbloquearParcial?.(resId);
                          }}
                          style={{
                            marginTop: 12,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 8,
                            backgroundColor: C.navy,
                            borderRadius: 8,
                            paddingVertical: 10,
                          }}
                        >
                          <Feather name="unlock" size={14} color="white" />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: "800",
                              color: "white",
                            }}
                          >
                            Desbloquear {report.fase} para{" "}
                            {selectedResidente?.split(" ")[0]}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </TouchableOpacity>

                    {/* ── Sección expandida (solo reportes no bloqueados) ── */}
                    {isExpanded && !esBloqueado && (
                      <View
                        style={{
                          paddingHorizontal: 16,
                          paddingBottom: 16,
                          borderTopWidth: 1,
                          borderTopColor: C.border,
                          paddingTop: 12,
                        }}
                      >
                        {/* Requerimientos */}
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: C.textMuted,
                            marginBottom: 8,
                            textTransform: "uppercase",
                          }}
                        >
                          Cumplimiento de Requerimientos
                        </Text>
                        <View style={{ gap: 6, marginBottom: 14 }}>
                          {[
                            {
                              label: "Cumple con objetivos del proyecto",
                              value: report.cumpleObjetivos,
                            },
                            {
                              label: "Aprobación del diagnóstico empresarial",
                              value: report.cumpleDiagnostico,
                            },
                            {
                              label: "Cumple con el plan de trabajo",
                              value: report.cumplePlanTrabajo,
                            },
                          ].map((req, ri) => (
                            <Row
                              key={ri}
                              style={{ alignItems: "center", gap: 8 }}
                            >
                              <Feather
                                name={
                                  req.value === true
                                    ? "check-circle"
                                    : req.value === false
                                      ? "x-circle"
                                      : "minus-circle"
                                }
                                size={14}
                                color={
                                  req.value === true
                                    ? C.green
                                    : req.value === false
                                      ? C.red
                                      : C.textLight
                                }
                              />
                              <Text style={{ fontSize: 12, color: C.textSub }}>
                                {req.label}
                              </Text>
                            </Row>
                          ))}
                        </View>

                        {/* Retroalimentación existente */}
                        {report.feedback && (
                          <View
                            style={{
                              backgroundColor: C.tealLighter,
                              borderRadius: 8,
                              padding: 10,
                              marginBottom: 14,
                              borderLeftWidth: 2,
                              borderLeftColor: C.teal,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: C.teal,
                                marginBottom: 3,
                              }}
                            >
                              Retroalimentación
                            </Text>
                            <Text
                              style={{
                                fontSize: 12,
                                color: C.textSub,
                                lineHeight: 17,
                              }}
                            >
                              {report.feedback}
                            </Text>
                            {report.fechaRevision && (
                              <Text
                                style={{
                                  fontSize: 10,
                                  color: C.textLight,
                                  marginTop: 4,
                                }}
                              >
                                Revisado: {report.fechaRevision}
                              </Text>
                            )}
                          </View>
                        )}

                        {/* Historial */}
                        {report.historial && report.historial.length > 0 && (
                          <View style={{ marginBottom: 14 }}>
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                color: C.textMuted,
                                marginBottom: 6,
                                textTransform: "uppercase",
                              }}
                            >
                              Historial de Revisiones
                            </Text>
                            {report.historial.map((h, hi) => (
                              <Row
                                key={hi}
                                style={{
                                  alignItems: "center",
                                  gap: 8,
                                  paddingVertical: 4,
                                }}
                              >
                                <View
                                  style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: 4,
                                    backgroundColor:
                                      h.status === "Aceptado" ? C.green : C.red,
                                  }}
                                />
                                <Text
                                  style={{
                                    fontSize: 11,
                                    color: C.textMuted,
                                    flex: 1,
                                  }}
                                >
                                  {h.fecha} —{" "}
                                  <Text style={{ fontWeight: "700" }}>
                                    {h.status}
                                  </Text>
                                  : {h.comentario}
                                </Text>
                              </Row>
                            ))}
                          </View>
                        )}

                        {/* Acciones */}
                        <Row style={{ gap: 10, flexWrap: "wrap" }}>
                          {report.archivo && (
                            <TouchableOpacity
                              onPress={async () => {
                                const { API_BASE } = require("../config/api");
                                const { getAuthToken } = require("../context/AuthContext");
                                const base = API_BASE ? API_BASE.replace("/api", "") : "";
                                const url = `${base}${report.archivo}`;
                                try {
                                  const res = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
                                  const blob = await res.blob();
                                  const objUrl = URL.createObjectURL(blob);
                                  window.open(objUrl, "_blank");
                                } catch (e) { console.error("Error al abrir archivo:", e); }
                              }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: C.border,
                              }}
                            >
                              <Feather
                                name="file-text"
                                size={12}
                                color={C.blue}
                              />
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: C.blue,
                                  fontWeight: "600",
                                }}
                              >
                                Ver documento
                              </Text>
                            </TouchableOpacity>
                          )}
                          {canReview && (
                            <TouchableOpacity
                              onPress={() => {
                                setReviewingReport(report);

                                setFeedback(report.feedback || "");
                                setFeedbackError(false);

                                setCumpleObjetivos(
                                  report.cumpleObjetivos || false,
                                );
                                setCumpleDiagnostico(
                                  report.cumpleDiagnostico || false,
                                );
                                setCumplePlanTrabajo(
                                  report.cumplePlanTrabajo || false,
                                );
                              }}
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                                gap: 5,
                                backgroundColor: C.teal,
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                              }}
                            >
                              <Feather name="edit-2" size={12} color="white" />
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "white",
                                  fontWeight: "700",
                                }}
                              >
                                {report.status === "Por corregir"
                                  ? "Re-revisar"
                                  : "Revisar"}
                              </Text>
                            </TouchableOpacity>
                          )}

                          {/* Desbloquear siguiente (en el reporte Aceptado) */}
                          {report.status === "Aceptado" &&
                            (() => {
                              const idxActual = FASE_SEQUENCE.indexOf(
                                report.fase,
                              );
                              const faseSig = FASE_SEQUENCE[idxActual + 1];
                              if (!faseSig) return null;
                              const yaDesbloqueado =
                                desbloqueadosDeEsteResidente.has(faseSig);
                              const sigReporte = reportesFiltrados.find(
                                (r) => r.fase === faseSig,
                              );
                              if (!sigReporte) return null;
                              return yaDesbloqueado ? (
                                <Row
                                  style={{
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: C.greenLight,
                                    borderRadius: 8,
                                    paddingHorizontal: 10,
                                    paddingVertical: 8,
                                  }}
                                >
                                  <Feather
                                    name="unlock"
                                    size={12}
                                    color={C.green}
                                  />
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: C.green,
                                      fontWeight: "700",
                                    }}
                                  >
                                    {faseSig} desbloqueado ✓
                                  </Text>
                                </Row>
                              ) : (
                                <TouchableOpacity
                                  onPress={async () => {
                                    // Llamar al backend para persistir el desbloqueo
                                    try {
                                      await apiClient.post(
                                        "/api/asesor/desbloquear-reporte",
                                        {
                                          residenteNombre: selectedResidente,
                                          fase: faseSig,
                                          proyectoId: activeProject?.id,
                                        },
                                      );
                                    } catch (err) {
                                      console.error(
                                        "Error al persistir desbloqueo:",
                                        err,
                                      );
                                    }
                                    desbloquearReporteResidente?.(
                                      selectedResidente,
                                      faseSig,
                                    );
                                    const resId = FASE_TO_REPORTES_ID[faseSig];
                                    if (typeof resId === "number")
                                      desbloquearParcial?.(resId);
                                  }}
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    backgroundColor: C.navy,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    borderRadius: 8,
                                  }}
                                >
                                  <Feather
                                    name="unlock"
                                    size={12}
                                    color="white"
                                  />
                                  <Text
                                    style={{
                                      fontSize: 11,
                                      color: "white",
                                      fontWeight: "700",
                                    }}
                                  >
                                    Desbloquear {faseSig}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })()}
                        </Row>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          )}
        </>
      )}
      {/* Placeholder cuando no se ha seleccionado nada */}
      {!activeProject && (
        <Card style={{ padding: 36, alignItems: "center", marginTop: 8 }}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              backgroundColor: C.tealLighter,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Feather name="folder" size={26} color={C.teal} />
          </View>
          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: C.text,
              marginBottom: 6,
            }}
          >
            Selecciona un proyecto
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: C.textMuted,
              textAlign: "center",
              maxWidth: 320,
            }}
          >
            Elige un proyecto de la lista para ver sus residentes y revisar sus
            reportes.
          </Text>
        </Card>
      )}

      {activeProject &&
        !selectedResidente &&
        residentesDelProyecto.length > 0 && (
          <Card style={{ padding: 36, alignItems: "center", marginTop: 8 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                backgroundColor: C.amberLight,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Feather name="users" size={26} color={C.amber} />
            </View>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "700",
                color: C.text,
                marginBottom: 6,
              }}
            >
              Selecciona un residente
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: C.textMuted,
                textAlign: "center",
                maxWidth: 320,
              }}
            >
              Este proyecto tiene {residentesDelProyecto.length} residente
              {residentesDelProyecto.length !== 1 ? "s" : ""}. Elige uno para
              revisar sus reportes.
            </Text>
          </Card>
        )}

      {/* ── Modal de Revisión ── */}
      <Modal visible={!!reviewingReport} transparent animationType="slide">
        <Pressable
          onPress={() => {
            setReviewingReport(null);
            setFeedback("");
            setFeedbackError(false);
          }}
          style={{
            flex: 1,
            backgroundColor: "rgba(15,23,42,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation?.()}
            style={{
              backgroundColor: C.card,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 28,
            }}
          >
            {reviewingReport && (
              <>
                <Row
                  style={{
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <Text
                    style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                  >
                    Revisar Reporte
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setReviewingReport(null);
                      setFeedback("");
                      setFeedbackError(false);
                    }}
                  >
                    <Feather name="x" size={20} color={C.textMuted} />
                  </TouchableOpacity>
                </Row>
                <Text
                  style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}
                >
                  {reviewingReport.titulo} · {reviewingReport.residente}
                </Text>

                {/* Archivo adjunto */}
                {reviewingReport.archivo && (
                  <TouchableOpacity
                    onPress={async () => {
                      const { API_BASE } = require("../config/api");
                      const { getAuthToken } = require("../context/AuthContext");
                      const base = API_BASE ? API_BASE.replace("/api", "") : "";
                      const url = `${base}${reviewingReport.archivo}`;
                      try {
                        const res = await fetch(url, { headers: { Authorization: `Bearer ${getAuthToken()}` } });
                        const blob = await res.blob();
                        const objUrl = URL.createObjectURL(blob);
                        window.open(objUrl, "_blank");
                      } catch (e) { console.error("Error al abrir archivo:", e); }
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      backgroundColor: C.tealLighter,
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 16,
                      borderWidth: 1,
                      borderColor: C.tealLight,
                    }}
                  >
                    <Feather name="file-text" size={16} color={C.teal} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: C.teal,
                        flex: 1,
                      }}
                    >
                      {reviewingReport.archivo}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.teal }}>Ver</Text>
                  </TouchableOpacity>
                )}

                {/* Requerimientos */}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Verificar Requerimientos
                </Text>

                <View
                  style={{
                    gap: 10,
                    marginBottom: 16,
                    backgroundColor: C.bg,
                    borderRadius: 10,
                    padding: 12,
                  }}
                >
                  {/* Objetivos */}
                  <TouchableOpacity
                    onPress={() => setCumpleObjetivos(!cumpleObjetivos)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Feather
                      name={cumpleObjetivos ? "check-square" : "square"}
                      size={18}
                      color={cumpleObjetivos ? C.green : C.textMuted}
                    />

                    <Text
                      style={{
                        fontSize: 12,
                        color: C.textSub,
                      }}
                    >
                      Cumple objetivos del proyecto
                    </Text>
                  </TouchableOpacity>

                  {/* Diagnóstico */}
                  <TouchableOpacity
                    onPress={() => setCumpleDiagnostico(!cumpleDiagnostico)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Feather
                      name={cumpleDiagnostico ? "check-square" : "square"}
                      size={18}
                      color={cumpleDiagnostico ? C.green : C.textMuted}
                    />

                    <Text
                      style={{
                        fontSize: 12,
                        color: C.textSub,
                      }}
                    >
                      Aprobación diagnóstico empresarial
                    </Text>
                  </TouchableOpacity>

                  {/* Plan de trabajo */}
                  <TouchableOpacity
                    onPress={() => setCumplePlanTrabajo(!cumplePlanTrabajo)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Feather
                      name={cumplePlanTrabajo ? "check-square" : "square"}
                      size={18}
                      color={cumplePlanTrabajo ? C.green : C.textMuted}
                    />

                    <Text
                      style={{
                        fontSize: 12,
                        color: C.textSub,
                      }}
                    >
                      Cumple plan de trabajo
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Retroalimentación */}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: feedbackError ? C.red : C.textMuted,
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  Retroalimentación / Comentarios *
                  {feedbackError && (
                    <Text
                      style={{
                        fontSize: 11,
                        color: C.red,
                        fontWeight: "400",
                        textTransform: "none",
                      }}
                    >
                      {"  "}⚠ Escribe tus comentarios antes de guardar
                    </Text>
                  )}
                </Text>
                <TextInput
                  value={feedback}
                  onChangeText={(t) => {
                    setFeedback(t);
                    if (t.trim()) setFeedbackError(false);
                  }}
                  placeholder="Escribe tus comentarios detallados para el residente..."
                  placeholderTextColor={C.textLight}
                  multiline
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: feedbackError
                      ? C.red
                      : feedback.trim()
                        ? C.teal
                        : C.border,
                    fontSize: 13,
                    color: C.text,
                    backgroundColor: C.card,
                    minHeight: 100,
                    textAlignVertical: "top",
                    marginBottom: 18,
                  }}
                />

                {/* Resultado: notificación que recibirá el residente */}
                <View
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 10,
                    padding: 12,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Row style={{ alignItems: "center", gap: 8 }}>
                    <Feather name="bell" size={13} color={C.textMuted} />
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      El residente recibirá una notificación con tu resultado y
                      comentarios.
                    </Text>
                  </Row>
                </View>

                {/* Mensaje de error */}
                {submitError && (
                  <View
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: C.redLight,
                      marginBottom: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: C.red,
                        fontWeight: "500",
                      }}
                    >
                      Error: {submitError}
                    </Text>
                  </View>
                )}

                {/* Botones de acción */}
                <Row style={{ gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => submitReview("Por corregir")}
                    disabled={isSubmittingReview}
                    style={{
                      flex: 1,
                      paddingVertical: 13,
                      borderRadius: 10,
                      borderWidth: 1.5,
                      borderColor: C.red,
                      alignItems: "center",
                      opacity: isSubmittingReview ? 0.6 : 1,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 6 }}>
                      {isSubmittingReview ? (
                        <ActivityIndicator size="small" color={C.red} />
                      ) : (
                        <Feather name="x-circle" size={14} color={C.red} />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: C.red,
                        }}
                      >
                        {isSubmittingReview ? "Guardando..." : "Por Corregir"}
                      </Text>
                    </Row>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => submitReview("Aceptado")}
                    disabled={isSubmittingReview}
                    style={{
                      flex: 2,
                      paddingVertical: 13,
                      borderRadius: 10,
                      backgroundColor: C.teal,
                      alignItems: "center",
                      opacity: isSubmittingReview ? 0.6 : 1,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 6 }}>
                      {isSubmittingReview ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Feather name="check-circle" size={14} color="white" />
                      )}
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        {isSubmittingReview
                          ? "Guardando..."
                          : "Aceptar Reporte"}
                      </Text>
                    </Row>
                  </TouchableOpacity>
                </Row>
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
