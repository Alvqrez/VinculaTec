import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Pressable,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Badge } from "../components";
import apiClient from "../utils/apiClient";
import { useWebSocket } from "../context/WebSocketContext";

// ─── Constantes ───────────────────────────────────────────────────────────────
const PRIORIDADES = ["Alta", "Media", "Baja"];
const FASES = [
  { id: "desarrollo", label: "En Desarrollo" },
  { id: "revision", label: "En Revisión" },
  { id: "concluido", label: "Concluido" },
];
const FUENTE_PROYECTO = ["Banco de Proyectos", "Propuesta Propia", "Propuesta Organización o Empresa"];
const EMPTY_REGISTER_FORM = {
  // Datos Generales del Proyecto
  fuente_proyecto: "",
  titulo: "",
  periodo: "",
  num_alumnos: "",
  // Datos del Alumno
  alumno_nombre: "",
  alumno_carrera: "",
  alumno_no_control: "",
  alumno_correo: "",
  alumno_telefono: "",
  alumno_facebook: "",
  // Datos de la Organización/Empresa
  empresa_id: "",
  empresa_domicilio: "",
  empresa_red_social: "",
  empresa_telefono: "",
  empresa_extension: "",
  asesor_externo_nombre: "",
  asesor_externo_puesto: "",
  asesor_externo_contacto: "",
  // Personal Académico
  asesor_interno: "",
  // Detalles del Proyecto
  introduccion: "",
  problematica: "",
  objetivo_general: "",
  objetivos_especificos: "",
  justificacion: "",
  // Plan de Trabajo
  actividades: [{ actividad: "", descripcion: "" }],
  // Campos originales (mantener compatibilidad)
  prioridad: "Media",
  estado: "desarrollo",
  tecnologias: "",
  descripcion: "",
};

const Field = ({ label, children, C }) => (
  <View style={{ marginBottom: 18 }}>
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: C.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 7,
      }}
    >
      {label}
    </Text>
    {children}
  </View>
);

// ── FIX #2: getPriorityStyle definido FUERA del componente para que sea
//    una referencia estable. Recibe `C` como parámetro. ─────────────────────
const getPriorityStyle = (priority, C) =>
  ({
    Alta: { color: C.red, bg: C.redLight },
    Media: { color: C.amber, bg: C.amberLight },
    Baja: { color: C.green, bg: C.greenLight },
  })[priority] || { color: C.amber, bg: C.amberLight };

// ── FIX #2: ProjectCard definido FUERA de GestionProyectos.
//    Al estar fuera, React siempre usa la misma referencia de función como
//    "tipo" del elemento. Con React.memo, el componente solo se re-renderiza
//    si sus props cambian, y NUNCA se desmonta/remonta al tipear en el modal
//    de "Registrar proyecto". ───────────────────────────────────────────────
const ProjectCard = React.memo(
  ({
    card,
    index,
    col,
    active,
    onPress,
    onEdit,
    onAprobarAvance,
    onAsignar,
  }) => {
    // Cada tarjeta obtiene sus propios colores directamente
    const { colors: C } = useTheme();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(16)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          delay: index * 60,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          delay: index * 60,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const ps = getPriorityStyle(card.priority || "Media", C);
    const tags = card.tags
      ? card.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    return (
      <Animated.View
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          style={{
            backgroundColor: C.card,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: active ? col.color : C.border,
            padding: 14,
            ...(active
              ? {
                  shadowColor: col.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 6,
                  elevation: 3,
                }
              : {}),
          }}
        >
          {/* Row superior: badges + acciones */}
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Row style={{ gap: 6, flex: 1 }}>
              <Badge
                text={card.priority || "Media"}
                color={ps.color}
                bg={ps.bg}
              />
              {card.solicitud_avance ? (
                <Badge text="⬆ Avance" color={C.teal} bg={C.tealLight} />
              ) : null}
            </Row>
            <Row style={{ gap: 4 }}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onAsignar(card);
                }}
                style={{ padding: 4 }}
              >
                <Feather name="user-plus" size={13} color={C.textLight} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                style={{ padding: 4 }}
              >
                <Feather name="edit-2" size={13} color={C.textLight} />
              </TouchableOpacity>
            </Row>
          </Row>

          {/* Título */}
          <Text
            style={{
              fontSize: 13,
              fontWeight: "700",
              color: C.text,
              marginBottom: 10,
              lineHeight: 18,
            }}
          >
            {card.title}
          </Text>

          {/* Tags */}
          {tags.length > 0 && (
            <Row style={{ flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
              {tags.map((tag, ti) => (
                <View
                  key={ti}
                  style={{
                    backgroundColor: C.bg,
                    borderRadius: 5,
                    paddingHorizontal: 7,
                    paddingVertical: 2,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      color: C.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </Row>
          )}

          {/* Empresa + avatar residente */}
          <Row
            style={{
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: card.asesor ? 8 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                color: C.textMuted,
                fontWeight: "600",
                flex: 1,
              }}
              numberOfLines={1}
            >
              {card.company || "Sin empresa"}
            </Text>
            {card.residenteIniciales && (
              <View
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  backgroundColor: C.teal,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 9, color: "white", fontWeight: "800" }}
                >
                  {card.residenteIniciales}
                </Text>
              </View>
            )}
          </Row>

          {/* Asesor asignado */}
          {card.asesor ? (
            <Row
              style={{
                alignItems: "center",
                gap: 5,
                backgroundColor: C.bg,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 5,
                marginBottom: card.solicitud_avance ? 8 : 0,
              }}
            >
              <Feather name="user-check" size={11} color={C.teal} />
              <Text style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}>
                {card.asesor}
              </Text>
            </Row>
          ) : (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onAsignar(card);
              }}
              style={{
                alignItems: "center",
                flexDirection: "row",
                gap: 5,
                backgroundColor: C.bg,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderWidth: 1,
                borderColor: C.border,
                borderStyle: "dashed",
                marginBottom: card.solicitud_avance ? 8 : 0,
              }}
            >
              <Feather name="user-plus" size={11} color={C.textMuted} />
              <Text
                style={{ fontSize: 11, color: C.textMuted, fontWeight: "600" }}
              >
                Asignar asesor
              </Text>
            </TouchableOpacity>
          )}

          {/* Aprobar avance */}
          {card.solicitud_avance ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onAprobarAvance(card);
              }}
              style={{
                marginTop: 2,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                backgroundColor: C.teal,
                borderRadius: 7,
                paddingVertical: 7,
              }}
            >
              <Feather name="check-circle" size={12} color="white" />
              <Text style={{ fontSize: 11, color: "white", fontWeight: "700" }}>
                Aprobar avance de fase
              </Text>
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

// ─── Componente Principal ─────────────────────────────────────────────────────
export default function GestionProyectos() {
  const { colors: C } = useTheme();

  const PHASE_COLUMNS = [
    {
      id: "desarrollo",
      label: "En Desarrollo",
      color: C.amber,
      bg: C.amberLight,
    },
    {
      id: "revision",
      label: "En Revisión",
      color: C.purple,
      bg: C.purpleLight,
    },
    { id: "concluido", label: "Concluido", color: C.green, bg: C.greenLight },
  ];

  // Estado de datos
  const [proyectos, setProyectos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado de UI
  const [active, setActive] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [toast, setToast] = useState(null);

  // Modal: editar
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm] = useState({
    title: "",
    priority: "Media",
    tags: "",
  });
  const [saving, setSaving] = useState(false);

  // Modal: registrar
  const [showRegister, setShowRegister] = useState(false);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER_FORM);
  const [registering, setRegistering] = useState(false);
  const [showEmpresaPick, setShowEmpresaPick] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Modal: asignar asesor
  const [asignarTarget, setAsignarTarget] = useState(null);
  const [asignarSel, setAsignarSel] = useState(null);
  const [asignando, setAsignando] = useState(false);
  const [searchAsesor, setSearchAsesor] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const addActividad = () => {
    setRegisterForm({
      ...registerForm,
      actividades: [...registerForm.actividades, { actividad: "", descripcion: "" }],
    });
  };

  const removeActividad = (index) => {
    setRegisterForm({
      ...registerForm,
      actividades: registerForm.actividades.filter((_, i) => i !== index),
    });
  };

  const updateActividad = (index, field, value) => {
    const nuevasActividades = [...registerForm.actividades];
    nuevasActividades[index][field] = value;
    setRegisterForm({ ...registerForm, actividades: nuevasActividades });
  };

  const inputStyle = {
    padding: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.border,
    fontSize: 14,
    color: C.text,
    backgroundColor: C.bg,
  };

  // ── Carga de datos ─────────────────────────────────────────────────────────
  const fetchProyectos = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/jefe/proyectos").then((res) => {
      if (res.ok && res.body?.ok) setProyectos(res.body.proyectos);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    fetchProyectos();
    apiClient.get("/api/jefe/empresas").then((res) => {
      if (res.ok && res.body?.ok) setEmpresas(res.body.empresas);
    });
    apiClient.get("/api/jefe/asignacion/datos").then((res) => {
      if (res.ok && res.body?.ok) setAsesores(res.body.asesores || []);
    });
  }, []);

  // ── WebSocket: tiempo real ──────────────────────────────────────────────────
  const { subscribe } = useWebSocket();

  useEffect(() => {
    const off1 = subscribe("proyecto_solicitud_avance", (data) => {
      setProyectos((prev) =>
        prev.map((p) =>
          p.id === data.proyectoId ? { ...p, solicitud_avance: true } : p,
        ),
      );
      showToast(`📬 "${data.titulo}" solicita avance de fase`, "info");
    });
    const off2 = subscribe("asesor_asignado", () => fetchProyectos());
    return () => {
      off1();
      off2();
    };
  }, [subscribe, fetchProyectos, showToast]);

  // ── Columnas del tablero ───────────────────────────────────────────────────
  const columns = React.useMemo(
    () =>
      PHASE_COLUMNS.map((col) => ({
        ...col,
        cards: proyectos.filter(
          (p) =>
            p.phase === col.id &&
            (priorityFilter === "Todas" || p.priority === priorityFilter),
        ),
      })),
    [proyectos, priorityFilter],
  );

  // ── Acciones: Editar ───────────────────────────────────────────────────────
  const openEdit = (card) => {
    setEditingCard(card);
    setEditForm({
      title: card.title,
      priority: card.priority || "Media",
      tags: card.tags || "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await apiClient.put(`/api/jefe/proyectos/${editingCard.id}`, {
      title: editForm.title.trim(),
      priority: editForm.priority,
      tags: editForm.tags.trim(),
    });
    if (res.ok) {
      setProyectos((prev) =>
        prev.map((p) =>
          p.id === editingCard.id
            ? {
                ...p,
                title: editForm.title.trim(),
                priority: editForm.priority,
                tags: editForm.tags.trim(),
              }
            : p,
        ),
      );
      showToast("Proyecto actualizado");
    } else {
      showToast(res.body?.mensaje || "Error al guardar", "error");
    }
    setSaving(false);
    setEditingCard(null);
  };

  // ── Acciones: Aprobar avance ───────────────────────────────────────────────
  const handleAprobarAvance = async (card) => {
    const res = await apiClient.put(
      `/api/jefe/proyectos/${card.id}/aprobar-avance`,
    );
    if (res.ok && res.body?.ok) {
      setProyectos((prev) =>
        prev.map((p) =>
          p.id === card.id
            ? { ...p, phase: res.body.nuevoEstado, solicitud_avance: false }
            : p,
        ),
      );
      showToast("Avance aprobado correctamente");
    } else {
      showToast(res.body?.mensaje || "Error al aprobar", "error");
    }
  };

  // ── Acciones: Registrar ────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!registerForm.titulo.trim()) {
      showToast("El título es requerido", "error");
      return;
    }
    setRegistering(true);
    const res = await apiClient.post("/api/jefe/proyectos", {
      // Datos Generales del Proyecto
      fuente_proyecto: registerForm.fuente_proyecto || null,
      titulo: registerForm.titulo.trim(),
      periodo: registerForm.periodo.trim() || null,
      num_alumnos: registerForm.num_alumnos.trim() || null,
      // Datos del Alumno
      alumno_nombre: registerForm.alumno_nombre.trim() || null,
      alumno_carrera: registerForm.alumno_carrera.trim() || null,
      alumno_no_control: registerForm.alumno_no_control.trim() || null,
      alumno_correo: registerForm.alumno_correo.trim() || null,
      alumno_telefono: registerForm.alumno_telefono.trim() || null,
      alumno_facebook: registerForm.alumno_facebook.trim() || null,
      // Datos de la Organización/Empresa
      empresa_id: registerForm.empresa_id || null,
      empresa_domicilio: registerForm.empresa_domicilio.trim() || null,
      empresa_red_social: registerForm.empresa_red_social.trim() || null,
      empresa_telefono: registerForm.empresa_telefono.trim() || null,
      empresa_extension: registerForm.empresa_extension.trim() || null,
      asesor_externo_nombre: registerForm.asesor_externo_nombre.trim() || null,
      asesor_externo_puesto: registerForm.asesor_externo_puesto.trim() || null,
      asesor_externo_contacto: registerForm.asesor_externo_contacto.trim() || null,
      // Personal Académico
      asesor_interno: registerForm.asesor_interno.trim() || null,
      // Detalles del Proyecto
      introduccion: registerForm.introduccion.trim() || null,
      problematica: registerForm.problematica.trim() || null,
      objetivo_general: registerForm.objetivo_general.trim() || null,
      objetivos_especificos: registerForm.objetivos_especificos.trim() || null,
      justificacion: registerForm.justificacion.trim() || null,
      // Plan de Trabajo
      actividades: registerForm.actividades || [],
      // Campos originales (mantener compatibilidad)
      prioridad: registerForm.prioridad,
      estado: registerForm.estado,
      tecnologias: registerForm.tecnologias.trim() || null,
      descripcion: registerForm.descripcion.trim() || null,
    });
    if (res.ok) {
      setShowRegister(false);
      showToast("Proyecto registrado con éxito");
      fetchProyectos();
    } else {
      showToast(res.body?.mensaje || "Error al registrar el proyecto", "error");
    }
    setRegistering(false);
  };

  // ── Acciones: Asignar asesor ───────────────────────────────────────────────
  const openAsignar = (card) => {
    setAsignarTarget(card);
    setAsignarSel(null);
    setSearchAsesor("");
  };

  const handleAsignar = async () => {
    if (!asignarSel) {
      showToast("Selecciona un asesor", "error");
      return;
    }
    setAsignando(true);
    const res = await apiClient.post(
      `/api/jefe/proyectos/${asignarTarget.id}/asesores`,
      { asesorId: asignarSel },
    );
    if (res.ok) {
      const asesorNombre =
        asesores.find((a) => a.id === asignarSel)?.nombre || "Asesor";
      setProyectos((prev) =>
        prev.map((p) =>
          p.id === asignarTarget.id ? { ...p, asesor: asesorNombre } : p,
        ),
      );
      showToast(`Asesor asignado: ${asesorNombre}`);
      setAsignarTarget(null);
    } else {
      showToast(res.body?.mensaje || "Error al asignar", "error");
    }
    setAsignando(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
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
              Gestión de Proyectos
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
              Tablero {loading ? "…" : `· ${proyectos.length} proyectos`}
            </Text>
          </View>

          <Row style={{ gap: 10 }}>
            {/* Botón registrar */}
            <TouchableOpacity
              onPress={() => {
                setRegisterForm(EMPTY_REGISTER_FORM);
                setShowRegister(true);
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                backgroundColor: C.teal,
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 9,
              }}
            >
              <Feather name="plus" size={14} color="white" />
              <Text style={{ fontSize: 13, color: "white", fontWeight: "700" }}>
                Registrar proyecto
              </Text>
            </TouchableOpacity>

            {/* Filtro prioridad */}
            <View style={{ position: "relative" }}>
              <TouchableOpacity
                onPress={() => setShowFilter(!showFilter)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  borderWidth: 1,
                  borderColor: priorityFilter !== "Todas" ? C.teal : C.border,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderRadius: 9,
                  backgroundColor:
                    priorityFilter !== "Todas" ? C.tealLighter : C.card,
                }}
              >
                <Feather
                  name="filter"
                  size={13}
                  color={priorityFilter !== "Todas" ? C.teal : C.textMuted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: priorityFilter !== "Todas" ? C.teal : C.textMuted,
                  }}
                >
                  {priorityFilter === "Todas" ? "Filtrar" : priorityFilter}
                </Text>
              </TouchableOpacity>

              {showFilter && (
                <View
                  style={{
                    position: "absolute",
                    top: 42,
                    right: 0,
                    width: 190,
                    backgroundColor: C.card,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: 12,
                    zIndex: 50,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      color: C.textMuted,
                      fontWeight: "700",
                      marginBottom: 8,
                    }}
                  >
                    Prioridad
                  </Text>
                  {["Todas", "Alta", "Media", "Baja"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      onPress={() => {
                        setPriorityFilter(option);
                        setShowFilter(false);
                      }}
                      style={{
                        paddingVertical: 7,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      {priorityFilter === option && (
                        <Feather name="check" size={11} color={C.teal} />
                      )}
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: priorityFilter === option ? "800" : "600",
                          color: priorityFilter === option ? C.teal : C.textSub,
                        }}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </Row>
        </Row>

        {/* ── Tablero ── */}
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.teal} />
            <Text style={{ marginTop: 12, color: C.textMuted, fontSize: 14 }}>
              Cargando proyectos…
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Row style={{ gap: 14, alignItems: "flex-start" }}>
              {columns.map((col) => (
                <View
                  key={col.id}
                  style={{
                    width: 270,
                    backgroundColor: C.card,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    overflow: "hidden",
                  }}
                >
                  {/* Encabezado columna */}
                  <View
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                    }}
                  >
                    <Row
                      style={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Row style={{ alignItems: "center", gap: 8 }}>
                        <View
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: col.color,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "800",
                            color: C.text,
                          }}
                        >
                          {col.label}
                        </Text>
                      </Row>
                      <View
                        style={{
                          backgroundColor: col.bg,
                          borderRadius: 20,
                          paddingHorizontal: 9,
                          paddingVertical: 2,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: col.color,
                          }}
                        >
                          {col.cards.length}
                        </Text>
                      </View>
                    </Row>
                  </View>

                  {/* Cards */}
                  <View style={{ padding: 10, gap: 10 }}>
                    {col.cards.length === 0 ? (
                      <View
                        style={{ alignItems: "center", paddingVertical: 24 }}
                      >
                        <Feather name="inbox" size={22} color={C.border} />
                        <Text
                          style={{
                            fontSize: 11,
                            color: C.textLight,
                            marginTop: 6,
                          }}
                        >
                          Sin proyectos
                        </Text>
                      </View>
                    ) : (
                      col.cards.map((card, i) => (
                        <ProjectCard
                          key={card.id}
                          card={card}
                          index={i}
                          col={col}
                          active={active === card.id}
                          onPress={() =>
                            setActive(active === card.id ? null : card.id)
                          }
                          onEdit={openEdit}
                          onAprobarAvance={handleAprobarAvance}
                          onAsignar={openAsignar}
                        />
                      ))
                    )}
                  </View>
                </View>
              ))}
            </Row>
          </ScrollView>
        )}
      </ScrollView>

      {/* ── Toast ── */}
      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 24,
            left: 24,
            right: 24,
            backgroundColor:
              toast.type === "error"
                ? C.red
                : toast.type === "info"
                  ? C.blue
                  : C.teal,
            borderRadius: 10,
            padding: 14,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Feather
            name={toast.type === "error" ? "alert-circle" : "check-circle"}
            size={16}
            color="white"
          />
          <Text
            style={{ color: "white", fontWeight: "600", fontSize: 13, flex: 1 }}
          >
            {toast.msg}
          </Text>
        </View>
      )}

      {/* ══ Modal: Editar proyecto ══════════════════════════════════════════ */}
      <Modal visible={!!editingCard} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setEditingCard(null)}
        >
          <Pressable
            style={{
              width: 420,
              backgroundColor: C.card,
              borderRadius: 16,
              padding: 28,
              borderWidth: 1,
              borderColor: C.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
                Editar Proyecto
              </Text>
              <TouchableOpacity onPress={() => setEditingCard(null)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>

            <Field label="Nombre del Proyecto" C={C}>
              <TextInput
                value={editForm.title}
                onChangeText={(v) => setEditForm({ ...editForm, title: v })}
                placeholder="Nombre del proyecto"
                placeholderTextColor={C.textLight}
                style={inputStyle}
              />
            </Field>

            <Field label="Prioridad" C={C}>
              <Row style={{ gap: 8 }}>
                {PRIORIDADES.map((p) => {
                  const sel = editForm.priority === p;
                  const cm = getPriorityStyle(p, C);
                  return (
                    <TouchableOpacity
                      key={p}
                      onPress={() => setEditForm({ ...editForm, priority: p })}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: 8,
                        borderWidth: 1.5,
                        borderColor: sel ? cm.color : C.border,
                        backgroundColor: sel ? cm.bg : C.bg,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "700",
                          color: sel ? cm.color : C.textMuted,
                        }}
                      >
                        {p}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Row>
            </Field>

            <Field label="Tecnologías (separadas por coma)" C={C}>
              <TextInput
                value={editForm.tags}
                onChangeText={(v) => setEditForm({ ...editForm, tags: v })}
                placeholder="React, Node.js, MySQL…"
                placeholderTextColor={C.textLight}
                style={inputStyle}
              />
            </Field>

            <Row style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingCard(null)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 9,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: C.textMuted,
                  }}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveEdit}
                disabled={saving}
                style={{
                  flex: 2,
                  paddingVertical: 11,
                  borderRadius: 9,
                  alignItems: "center",
                  backgroundColor: saving ? C.textLight : C.teal,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: "white" }}
                  >
                    Guardar Cambios
                  </Text>
                )}
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══ Modal: Asignar Asesor ═══════════════════════════════════════════ */}
      <Modal visible={!!asignarTarget} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setAsignarTarget(null)}
        >
          <Pressable
            style={{
              width: 460,
              maxHeight: "70%",
              backgroundColor: C.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                padding: 22,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row
                style={{
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 17, fontWeight: "800", color: C.text }}
                  >
                    Asignar Asesor
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}
                    numberOfLines={1}
                  >
                    {asignarTarget?.title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setAsignarTarget(null)}
                  style={{ padding: 4 }}
                >
                  <Feather name="x" size={18} color={C.textMuted} />
                </TouchableOpacity>
              </Row>
              <Row
                style={{
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  marginTop: 14,
                }}
              >
                <Feather name="search" size={13} color={C.textMuted} />
                <TextInput
                  value={searchAsesor}
                  onChangeText={setSearchAsesor}
                  placeholder="Buscar asesor…"
                  placeholderTextColor={C.textLight}
                  style={{ flex: 1, fontSize: 13, color: C.text }}
                />
              </Row>
            </View>

            <ScrollView style={{ maxHeight: 320 }}>
              {asesores
                .filter(
                  (a) =>
                    !searchAsesor ||
                    a.nombre
                      .toLowerCase()
                      .includes(searchAsesor.toLowerCase()) ||
                    (a.departamento || "")
                      .toLowerCase()
                      .includes(searchAsesor.toLowerCase()),
                )
                .map((a) => {
                  const sel = asignarSel === a.id;
                  return (
                    <TouchableOpacity
                      key={a.id}
                      onPress={() => setAsignarSel(sel ? null : a.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: C.borderLight,
                        backgroundColor: sel ? C.tealLighter : "transparent",
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: sel ? C.teal : C.bg,
                          borderWidth: 1,
                          borderColor: sel ? C.teal : C.border,
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "800",
                            color: sel ? "white" : C.textMuted,
                          }}
                        >
                          {a.nombre
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: sel ? C.teal : C.text,
                          }}
                        >
                          {a.nombre}
                        </Text>
                        {a.departamento && (
                          <Text
                            style={{
                              fontSize: 11,
                              color: C.textMuted,
                              marginTop: 1,
                            }}
                          >
                            {a.departamento}
                          </Text>
                        )}
                      </View>
                      <View
                        style={{
                          backgroundColor: a.activos > 0 ? C.amberLight : C.bg,
                          borderRadius: 12,
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "700",
                            color: a.activos > 0 ? C.amber : C.textMuted,
                          }}
                        >
                          {a.activos} activo{a.activos !== 1 ? "s" : ""}
                        </Text>
                      </View>
                      {sel && (
                        <Feather
                          name="check-circle"
                          size={16}
                          color={C.teal}
                          style={{ marginLeft: 8 }}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              {asesores.filter(
                (a) =>
                  !searchAsesor ||
                  a.nombre.toLowerCase().includes(searchAsesor.toLowerCase()),
              ).length === 0 && (
                <View style={{ alignItems: "center", padding: 32 }}>
                  <Feather name="users" size={28} color={C.border} />
                  <Text
                    style={{ fontSize: 12, color: C.textLight, marginTop: 8 }}
                  >
                    No se encontraron asesores
                  </Text>
                </View>
              )}
            </ScrollView>

            <View
              style={{
                padding: 18,
                borderTopWidth: 1,
                borderTopColor: C.border,
              }}
            >
              <Row style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setAsignarTarget(null)}
                  style={{
                    flex: 1,
                    paddingVertical: 11,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: C.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: C.textMuted,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAsignar}
                  disabled={asignando || !asignarSel}
                  style={{
                    flex: 2,
                    paddingVertical: 11,
                    borderRadius: 9,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 7,
                    backgroundColor:
                      asignando || !asignarSel ? C.textLight : C.teal,
                  }}
                >
                  {asignando ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Feather name="user-check" size={14} color="white" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        Confirmar Asignación
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Row>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ══ Modal: Registrar Proyecto ═══════════════════════════════════════ */}
      <Modal visible={showRegister} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowRegister(false)}
        >
          <Pressable
            style={{
              width: 480,
              maxHeight: "85%",
              backgroundColor: C.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                padding: 24,
                paddingBottom: 18,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                  >
                    Registrar Proyecto
                  </Text>
                  <Text
                    style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}
                  >
                    Completa los datos del nuevo proyecto
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowRegister(false)}
                  style={{ padding: 6, borderRadius: 8, backgroundColor: C.bg }}
                >
                  <Feather name="x" size={18} color={C.textMuted} />
                </TouchableOpacity>
              </Row>
            </View>

            {/* ── Barra de pestañas ── */}
            <View
              style={{
                flexDirection: "row",
                borderBottomWidth: 1,
                borderBottomColor: C.border,
                backgroundColor: C.bg,
              }}
            >
              {[
                "Proyecto y Alumno",
                "Organización",
                "Detalles",
                "Plan de Trabajo",
              ].map((tab, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => setActiveTab(index)}
                  style={{
                    flex: 1,
                    paddingVertical: 14,
                    alignItems: "center",
                    borderBottomWidth: 2,
                    borderBottomColor:
                      activeTab === index ? C.navy : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: activeTab === index ? "800" : "600",
                      color: activeTab === index ? C.navy : C.textMuted,
                    }}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              contentContainerStyle={{ padding: 24, paddingBottom: 8 }}
              showsVerticalScrollIndicator={false}
            >
              {/* ── Tab 1: Proyecto y Alumno (Sección 1 y Sección 2) ── */}
              {activeTab === 0 && (
                <>
                  {/* ── Sección 1: Datos Generales del Proyecto ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="folder" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        1. Datos Generales del Proyecto
                      </Text>
                    </Row>
                  </View>

                  <Field label="Fuente del Proyecto" C={C}>
                    <Row style={{ gap: 8 }}>
                      {FUENTE_PROYECTO.map((fp) => {
                        const sel = registerForm.fuente_proyecto === fp;
                        return (
                          <TouchableOpacity
                            key={fp}
                            onPress={() =>
                              setRegisterForm({ ...registerForm, fuente_proyecto: fp })
                            }
                            style={{
                              flex: 1,
                              paddingVertical: 8,
                              paddingHorizontal: 8,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              borderColor: sel ? C.teal : C.border,
                              backgroundColor: sel ? C.tealLighter : C.bg,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                textAlign: "center",
                                color: sel ? C.teal : C.textMuted,
                              }}
                            >
                              {fp}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </Row>
                  </Field>

                  <Field label="Nombre del Proyecto *" C={C}>
                    <TextInput
                      value={registerForm.titulo}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, titulo: v })
                      }
                      placeholder="Nombre del proyecto"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Periodo de Residencia" C={C}>
                    <TextInput
                      value={registerForm.periodo}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, periodo: v })
                      }
                      placeholder="Ej: Enero-Junio 2025"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Número de Alumnos asignados" C={C}>
                    <TextInput
                      value={registerForm.num_alumnos}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, num_alumnos: v })
                      }
                      placeholder="Ej: 1, 2, 3…"
                      placeholderTextColor={C.textLight}
                      keyboardType="number-pad"
                      style={inputStyle}
                    />
                  </Field>

                  {/* ── Sección 2: Datos del Alumno ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="user" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        2. Datos del Alumno
                      </Text>
                    </Row>
                  </View>

                  <Field label="Nombre del alumno" C={C}>
                    <TextInput
                      value={registerForm.alumno_nombre}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_nombre: v })
                      }
                      placeholder="Nombre completo"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Carrera" C={C}>
                    <TextInput
                      value={registerForm.alumno_carrera}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_carrera: v })
                      }
                      placeholder="Ej: Ingeniería en Software"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Número de control" C={C}>
                    <TextInput
                      value={registerForm.alumno_no_control}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_no_control: v })
                      }
                      placeholder="Ej: 2024001234"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Correo electrónico" C={C}>
                    <TextInput
                      value={registerForm.alumno_correo}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_correo: v })
                      }
                      placeholder="alumno@ejemplo.com"
                      placeholderTextColor={C.textLight}
                      keyboardType="email-address"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Teléfono (Casa/Celular)" C={C}>
                    <TextInput
                      value={registerForm.alumno_telefono}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_telefono: v })
                      }
                      placeholder="Ej: 271 123 4567"
                      placeholderTextColor={C.textLight}
                      keyboardType="phone-pad"
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Perfil de Facebook" C={C}>
                    <TextInput
                      value={registerForm.alumno_facebook}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, alumno_facebook: v })
                      }
                      placeholder="URL del perfil de Facebook"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>
                </>
              )}

              {/* ── Tab 2: Organización y Asesores (Sección 3 y Sección 4) ── */}
              {activeTab === 1 && (
                <>
                  {/* ── Sección 3: Datos de la Organización/Empresa ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="briefcase" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        3. Datos de la Organización/Empresa
                      </Text>
                    </Row>
                  </View>

                  <Field label="Nombre de la empresa" C={C}>
                    <TouchableOpacity
                      onPress={() => setShowEmpresaPick(!showEmpresaPick)}
                      style={{
                        ...inputStyle,
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          color: registerForm.empresa_id ? C.text : C.textLight,
                        }}
                      >
                        {registerForm.empresa_id
                          ? empresas.find((e) => e.id === registerForm.empresa_id)
                              ?.name || "Seleccionar…"
                          : "Seleccionar empresa…"}
                      </Text>
                      <Feather
                        name={showEmpresaPick ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={C.textMuted}
                      />
                    </TouchableOpacity>
                    {showEmpresaPick && (
                      <View
                        style={{
                          backgroundColor: C.card,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: C.border,
                          marginTop: 4,
                          maxHeight: 180,
                          overflow: "hidden",
                        }}
                      >
                        <ScrollView nestedScrollEnabled>
                          <TouchableOpacity
                            onPress={() => {
                              setRegisterForm({ ...registerForm, empresa_id: "" });
                              setShowEmpresaPick(false);
                            }}
                            style={{
                              padding: 11,
                              borderBottomWidth: 1,
                              borderBottomColor: C.borderLight,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: C.textMuted,
                                fontStyle: "italic",
                              }}
                            >
                              Sin empresa
                            </Text>
                          </TouchableOpacity>
                          {empresas.map((emp) => (
                            <TouchableOpacity
                              key={emp.id}
                              onPress={() => {
                                setRegisterForm({
                                  ...registerForm,
                                  empresa_id: emp.id,
                                });
                                setShowEmpresaPick(false);
                              }}
                              style={{
                                padding: 11,
                                borderBottomWidth: 1,
                                borderBottomColor: C.borderLight,
                                backgroundColor:
                                  registerForm.empresa_id === emp.id
                                    ? C.tealLighter
                                    : "transparent",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 13,
                                  color:
                                    registerForm.empresa_id === emp.id
                                      ? C.teal
                                      : C.text,
                                  fontWeight:
                                    registerForm.empresa_id === emp.id
                                      ? "700"
                                      : "400",
                                }}
                              >
                                {emp.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </Field>

                  <Field label="Domicilio" C={C}>
                    <TextInput
                      value={registerForm.empresa_domicilio}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, empresa_domicilio: v })
                      }
                      placeholder="Dirección completa de la empresa"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={2}
                      style={{
                        ...inputStyle,
                        minHeight: 60,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>

                  <Field label="Red Social / Sitio web" C={C}>
                    <TextInput
                      value={registerForm.empresa_red_social}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, empresa_red_social: v })
                      }
                      placeholder="URL del sitio web o red social"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Row style={{ gap: 10 }}>
                    <View style={{ flex: 1 }}>
                      <Field label="Teléfono" C={C}>
                        <TextInput
                          value={registerForm.empresa_telefono}
                          onChangeText={(v) =>
                            setRegisterForm({ ...registerForm, empresa_telefono: v })
                          }
                          placeholder="Ej: 271 123 4567"
                          placeholderTextColor={C.textLight}
                          keyboardType="phone-pad"
                          style={inputStyle}
                        />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label="Extensión" C={C}>
                        <TextInput
                          value={registerForm.empresa_extension}
                          onChangeText={(v) =>
                            setRegisterForm({ ...registerForm, empresa_extension: v })
                          }
                          placeholder="Ext."
                          placeholderTextColor={C.textLight}
                          keyboardType="number-pad"
                          style={inputStyle}
                        />
                      </Field>
                    </View>
                  </Row>

                  <Field label="Asesor Externo - Nombre" C={C}>
                    <TextInput
                      value={registerForm.asesor_externo_nombre}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, asesor_externo_nombre: v })
                      }
                      placeholder="Nombre completo del asesor externo"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Asesor Externo - Puesto" C={C}>
                    <TextInput
                      value={registerForm.asesor_externo_puesto}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, asesor_externo_puesto: v })
                      }
                      placeholder="Puesto en la empresa"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Asesor Externo - Contacto/Correo" C={C}>
                    <TextInput
                      value={registerForm.asesor_externo_contacto}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, asesor_externo_contacto: v })
                      }
                      placeholder="Correo electrónico o teléfono"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  {/* ── Sección 4: Personal Académico ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="award" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        4. Personal Académico (Propuesta)
                      </Text>
                    </Row>
                  </View>

                  <Field label="Nombre del Asesor Interno" C={C}>
                    <TextInput
                      value={registerForm.asesor_interno}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, asesor_interno: v })
                      }
                      placeholder="Nombre del docente propuesto"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <View
                    style={{
                      backgroundColor: C.amberLight,
                      borderRadius: 8,
                      padding: 10,
                      marginBottom: 18,
                      borderWidth: 1,
                      borderColor: C.amber,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="info" size={14} color={C.amber} />
                      <Text
                        style={{ fontSize: 11, color: C.amber, fontWeight: "600" }}
                      >
                        La asignación final del asesor es responsabilidad del jefe del
                        Dpto. Académico
                      </Text>
                    </Row>
                  </View>
                </>
              )}

              {/* ── Tab 3: Detalles del Proyecto (Sección 5) ── */}
              {activeTab === 2 && (
                <>
                  {/* ── Sección 5: Detalles del Proyecto ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="file-text" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        5. Detalles del Proyecto
                      </Text>
                    </Row>
                  </View>

                  <Field label="Introducción" C={C}>
                    <TextInput
                      value={registerForm.introduccion}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, introduccion: v })
                      }
                      placeholder="Describe el contexto y antecedentes del proyecto…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={4}
                      style={{
                        ...inputStyle,
                        minHeight: 100,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>

                  <Field label="Problemática" C={C}>
                    <TextInput
                      value={registerForm.problematica}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, problematica: v })
                      }
                      placeholder="Describe el problema a resolver…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={4}
                      style={{
                        ...inputStyle,
                        minHeight: 100,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>

                  <Field label="Objetivo General" C={C}>
                    <TextInput
                      value={registerForm.objetivo_general}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, objetivo_general: v })
                      }
                      placeholder="Objetivo principal del proyecto…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={3}
                      style={{
                        ...inputStyle,
                        minHeight: 80,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>

                  <Field label="Objetivos Específicos" C={C}>
                    <TextInput
                      value={registerForm.objetivos_especificos}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, objetivos_especificos: v })
                      }
                      placeholder="Lista los objetivos específicos (separados por puntos)…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={4}
                      style={{
                        ...inputStyle,
                        minHeight: 100,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>

                  <Field label="Justificación" C={C}>
                    <TextInput
                      value={registerForm.justificacion}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, justificacion: v })
                      }
                      placeholder="Explica la importancia y viabilidad del proyecto…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={4}
                      style={{
                        ...inputStyle,
                        minHeight: 100,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>
                </>
              )}

              {/* ── Tab 4: Plan de Trabajo (Sección 6 + campos originales) ── */}
              {activeTab === 3 && (
                <>
                  {/* ── Sección 6: Plan de Trabajo ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="list" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        6. Plan de Trabajo
                      </Text>
                    </Row>
                  </View>

                  {registerForm.actividades.map((act, index) => (
                    <View
                      key={index}
                      style={{
                        backgroundColor: C.bg,
                        borderRadius: 10,
                        padding: 14,
                        marginBottom: 14,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      <Row
                        style={{
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: C.textMuted,
                          }}
                        >
                          Actividad {index + 1}
                        </Text>
                        {registerForm.actividades.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeActividad(index)}
                            style={{ padding: 4 }}
                          >
                            <Feather name="trash-2" size={14} color={C.red} />
                          </TouchableOpacity>
                        )}
                      </Row>

                      <Field label="Actividad a realizar" C={C}>
                        <TextInput
                          value={act.actividad}
                          onChangeText={(v) => updateActividad(index, "actividad", v)}
                          placeholder="Nombre de la actividad"
                          placeholderTextColor={C.textLight}
                          style={inputStyle}
                        />
                      </Field>

                      <Field label="Descripción" C={C}>
                        <TextInput
                          value={act.descripcion}
                          onChangeText={(v) =>
                            updateActividad(index, "descripcion", v)
                          }
                          placeholder="Descripción detallada de la actividad"
                          placeholderTextColor={C.textLight}
                          multiline
                          numberOfLines={2}
                          style={{
                            ...inputStyle,
                            minHeight: 60,
                            textAlignVertical: "top",
                          }}
                        />
                      </Field>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={addActividad}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      backgroundColor: C.bg,
                      borderRadius: 10,
                      padding: 12,
                      borderWidth: 1.5,
                      borderColor: C.border,
                      borderStyle: "dashed",
                      marginBottom: 18,
                    }}
                  >
                    <Feather name="plus-circle" size={18} color={C.teal} />
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.teal }}
                    >
                      Agregar otra actividad
                    </Text>
                  </TouchableOpacity>

                  {/* ── Campos originales (mantenidos para compatibilidad) ── */}
                  <View
                    style={{
                      backgroundColor: C.navy,
                      borderRadius: 10,
                      padding: 14,
                      marginBottom: 20,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <Feather name="settings" size={16} color={C.teal} />
                      <Text
                        style={{ fontSize: 14, fontWeight: "800", color: "white" }}
                      >
                        Configuración Adicional
                      </Text>
                    </Row>
                  </View>

                  <Field label="Prioridad" C={C}>
                    <Row style={{ gap: 8 }}>
                      {PRIORIDADES.map((p) => {
                        const sel = registerForm.prioridad === p;
                        const cm = getPriorityStyle(p, C);
                        return (
                          <TouchableOpacity
                            key={p}
                            onPress={() =>
                              setRegisterForm({ ...registerForm, prioridad: p })
                            }
                            style={{
                              flex: 1,
                              paddingVertical: 9,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              borderColor: sel ? cm.color : C.border,
                              backgroundColor: sel ? cm.bg : C.bg,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "700",
                                color: sel ? cm.color : C.textMuted,
                              }}
                            >
                              {p}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </Row>
                  </Field>

                  <Field label="Fase Inicial" C={C}>
                    <Row style={{ gap: 8 }}>
                      {FASES.map((f) => {
                        const sel = registerForm.estado === f.id;
                        const phaseCol = PHASE_COLUMNS.find((c) => c.id === f.id);
                        return (
                          <TouchableOpacity
                            key={f.id}
                            onPress={() =>
                              setRegisterForm({ ...registerForm, estado: f.id })
                            }
                            style={{
                              flex: 1,
                              paddingVertical: 9,
                              borderRadius: 8,
                              borderWidth: 1.5,
                              borderColor: sel
                                ? phaseCol?.color || C.teal
                                : C.border,
                              backgroundColor: sel
                                ? phaseCol?.bg || C.tealLight
                                : C.bg,
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 11,
                                fontWeight: "700",
                                textAlign: "center",
                                color: sel
                                  ? phaseCol?.color || C.teal
                                  : C.textMuted,
                              }}
                            >
                              {f.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </Row>
                  </Field>

                  <Field label="Tecnologías (separadas por coma)" C={C}>
                    <TextInput
                      value={registerForm.tecnologias}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, tecnologias: v })
                      }
                      placeholder="React, Node.js, MySQL…"
                      placeholderTextColor={C.textLight}
                      style={inputStyle}
                    />
                  </Field>

                  <Field label="Descripción breve" C={C}>
                    <TextInput
                      value={registerForm.descripcion}
                      onChangeText={(v) =>
                        setRegisterForm({ ...registerForm, descripcion: v })
                      }
                      placeholder="Descripción breve del proyecto…"
                      placeholderTextColor={C.textLight}
                      multiline
                      numberOfLines={2}
                      style={{
                        ...inputStyle,
                        minHeight: 60,
                        textAlignVertical: "top",
                      }}
                    />
                  </Field>
                </>
              )}
            </ScrollView>

            <View
              style={{
                padding: 20,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: C.border,
              }}
            >
              <Row style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={() => setShowRegister(false)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: C.border,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: C.textMuted,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={registering || !registerForm.titulo.trim()}
                  style={{
                    flex: 2,
                    paddingVertical: 12,
                    borderRadius: 9,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 7,
                    backgroundColor:
                      registering || !registerForm.titulo.trim()
                        ? C.textLight
                        : C.teal,
                  }}
                >
                  {registering ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Feather name="save" size={14} color="white" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        Registrar Proyecto
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Row>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
