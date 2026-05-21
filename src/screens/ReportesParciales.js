import { useState, useRef, useEffect } from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert, Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card } from "../components";
import { useReportes } from "../context/ReportesContext";

// ── Metadatos de cada parcial ─────────────────────────────────────────────────
const PARCIALES = [
  { num: 1, focus: "Diagnóstico e inicio",       color: C.teal  },
  { num: 2, focus: "Desarrollo del proyecto",    color: C.blue  },
  { num: 3, focus: "Avance final y conclusiones", color: C.amber },
];

const ESTADO_STYLE = {
  Aceptado:     { color: C.green,  bg: C.greenLight,  label: "Aceptado"     },
  Pendiente:    { color: C.amber,  bg: C.amberLight,  label: "En revisión"  },
  "Por corregir":{ color: C.red,   bg: C.redLight,    label: "Por corregir" },
};

// ── Componente principal ──────────────────────────────────────────────────────
export default function ReportesParciales() {
  const {
    reports,
    submitReporte,
    undoSubmit,
    desbloquearParcial,
    parcialesDesbloqueados,
  } = useReportes() || {};

  const [activeTab, setActiveTab] = useState(1);
  const [forms, setForms] = useState({ 1: {}, 2: {}, 3: {} });
  const [selectedFile, setSelectedFile] = useState({ 1: null, 2: null, 3: null });

  // ── Estado del banner "Deshacer" ───────────────────────────────────────────
  const [undoBanner, setUndoBanner] = useState(null); // { tipoId, segundos }
  const undoTimerRef = useRef(null);
  const bannerAnim   = useRef(new Animated.Value(0)).current;

  // Limpiar timer al desmontar
  useEffect(() => () => { if (undoTimerRef.current) clearInterval(undoTimerRef.current); }, []);

  const showUndoBanner = (tipoId) => {
    // Limpiar cualquier banner anterior
    if (undoTimerRef.current) clearInterval(undoTimerRef.current);

    setUndoBanner({ tipoId, segundos: 8 });

    // Animar entrada
    Animated.timing(bannerAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();

    // Cuenta regresiva
    undoTimerRef.current = setInterval(() => {
      setUndoBanner((prev) => {
        if (!prev || prev.segundos <= 1) {
          clearInterval(undoTimerRef.current);
          // Animar salida
          Animated.timing(bannerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
          return null;
        }
        return { ...prev, segundos: prev.segundos - 1 };
      });
    }, 1000);
  };

  const handleUndo = async () => {
    if (!undoBanner) return;
    clearInterval(undoTimerRef.current);
    Animated.timing(bannerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    const { tipoId } = undoBanner;
    setUndoBanner(null);
    await undoSubmit?.(tipoId);
    setSelectedFile((prev) => ({ ...prev, [tipoId]: null }));
  };

  const dismissBanner = () => {
    if (!undoBanner) return;
    clearInterval(undoTimerRef.current);
    Animated.timing(bannerAnim, { toValue: 0, duration: 280, useNativeDriver: true }).start();
    setUndoBanner(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getParcialReport = (num) =>
    reports?.find((r) => r.id === num) || { status: "Pendiente", submitted: null };

  const isDesbloqueado = (num) =>
    parcialesDesbloqueados ? parcialesDesbloqueados.has(num) : num === 1;

  const updateForm = (key, val) =>
    setForms((prev) => ({ ...prev, [activeTab]: { ...prev[activeTab], [key]: val } }));

  const selectFile = () => {
    if (typeof globalThis.document === "undefined") return;
    const input       = globalThis.document.createElement("input");
    input.type        = "file";
    input.accept      = ".pdf,.doc,.docx";
    input.onchange    = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setSelectedFile((prev) => ({
        ...prev,
        [activeTab]: {
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        },
      }));
    };
    input.click();
  };

  const handleSubmit = async () => {
    const form = forms[activeTab] || {};
    const file = selectedFile[activeTab];

    if (!form.actividadesRealizadas?.trim()) {
      Alert.alert("Campo requerido", "Describe las actividades realizadas antes de enviar.");
      return;
    }
    if (!file) {
      Alert.alert("Sin archivo", "Selecciona el documento del reporte antes de enviarlo.");
      return;
    }

    const tipoId = activeTab; // número 1, 2 o 3
    await submitReporte?.(tipoId, file.name);
    showUndoBanner(tipoId);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tabs de parciales ── */}
        <Row style={{ gap: 8, marginBottom: 20 }}>
          {PARCIALES.map(({ num, color }) => {
            const rep        = getParcialReport(num);
            const desbloq    = isDesbloqueado(num);
            const isActive   = activeTab === num;
            const estado     = ESTADO_STYLE[rep.status] || ESTADO_STYLE.Pendiente;

            return (
              <TouchableOpacity
                key={num}
                onPress={() => { if (desbloq) setActiveTab(num); }}
                style={{
                  flex:            1,
                  paddingVertical: 12,
                  paddingHorizontal: 8,
                  borderRadius:    12,
                  backgroundColor: isActive ? color : C.card,
                  borderWidth:     1,
                  borderColor:     isActive ? color : C.border,
                  alignItems:      "center",
                  opacity:         desbloq ? 1 : 0.45,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: isActive ? "white" : C.textSub }}>
                  P{num}
                </Text>
                <View style={{
                  marginTop:       5,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius:    6,
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : estado.bg,
                }}>
                  <Text style={{ fontSize: 9, fontWeight: "700", color: isActive ? "white" : estado.color }}>
                    {rep.submitted ? estado.label : (desbloq ? "Sin enviar" : "Bloqueado")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </Row>

        {/* ── Contenido del parcial activo ── */}
        {(() => {
          const parcial   = PARCIALES[activeTab - 1];
          const rep       = getParcialReport(activeTab);
          const desbloq   = isDesbloqueado(activeTab);
          const isLocked  = rep.status === "Aceptado" || !desbloq;
          const form      = forms[activeTab] || {};
          const file      = selectedFile[activeTab];
          const estado    = ESTADO_STYLE[rep.status] || ESTADO_STYLE.Pendiente;

          if (!desbloq) {
            return (
              <Card style={{ alignItems: "center", padding: 32 }}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.border, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Feather name="lock" size={24} color={C.textMuted} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: "800", color: C.text, marginBottom: 8 }}>
                  Parcial {activeTab} bloqueado
                </Text>
                <Text style={{ fontSize: 13, color: C.textMuted, textAlign: "center", lineHeight: 20 }}>
                  {activeTab === 1
                    ? "Tu asesor desbloqueará este parcial cuando tu reporte preliminar sea aceptado."
                    : `Tu asesor desbloqueará este parcial cuando el Parcial ${activeTab - 1} sea aceptado.`}
                </Text>
              </Card>
            );
          }

          return (
            <>
              {/* Cabecera */}
              <Card style={{ marginBottom: 16 }}>
                <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                      Reporte Parcial {activeTab}
                    </Text>
                    <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 3 }}>
                      {parcial.focus}
                    </Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: estado.bg }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: estado.color }}>{estado.label}</Text>
                  </View>
                </Row>
                {rep.submitted && (
                  <Row style={{ alignItems: "center", gap: 6, marginTop: 10 }}>
                    <Feather name="check-circle" size={13} color={C.green} />
                    <Text style={{ fontSize: 11, color: C.green }}>Enviado el {rep.submitted}</Text>
                  </Row>
                )}
              </Card>

              {/* Feedback del asesor */}
              {rep.feedback && (
                <Card style={{
                  marginBottom: 16,
                  backgroundColor: rep.status === "Aceptado" ? C.greenLight : C.amberLight,
                  borderColor: rep.status === "Aceptado" ? C.green : C.amber,
                }}>
                  <Row style={{ alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <Feather name="message-circle" size={14} color={rep.status === "Aceptado" ? C.green : C.amber} />
                    <Text style={{ fontSize: 12, fontWeight: "700", color: rep.status === "Aceptado" ? C.green : C.amber }}>
                      Retroalimentación del asesor
                    </Text>
                  </Row>
                  <Text style={{ fontSize: 13, color: C.textSub, lineHeight: 20 }}>{rep.feedback}</Text>
                </Card>
              )}

              {/* Formulario */}
              <Card style={{ marginBottom: 16, opacity: isLocked ? 0.65 : 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: C.text, marginBottom: 16 }}>
                  Contenido del Reporte
                </Text>
                <Field
                  label="Actividades realizadas *"
                  placeholder="Describe las actividades y tareas completadas durante el periodo..."
                  value={form.actividadesRealizadas}
                  onChangeText={(v) => updateForm("actividadesRealizadas", v)}
                  multiline
                  editable={!isLocked}
                />
                <Field
                  label="Avance en objetivos"
                  placeholder="¿Qué porcentaje de los objetivos se cumplió? Describe brevemente..."
                  value={form.avanceObjetivos}
                  onChangeText={(v) => updateForm("avanceObjetivos", v)}
                  multiline
                  editable={!isLocked}
                />
                <Field
                  label="Problemas / obstáculos"
                  placeholder="Menciona dificultades encontradas y cómo se resolvieron..."
                  value={form.problemas}
                  onChangeText={(v) => updateForm("problemas", v)}
                  multiline
                  editable={!isLocked}
                />
                <Field
                  label="Observaciones adicionales"
                  placeholder="Cualquier comentario extra para tu asesor..."
                  value={form.observaciones}
                  onChangeText={(v) => updateForm("observaciones", v)}
                  multiline
                  editable={!isLocked}
                  last
                />
              </Card>

              {/* Subir archivo */}
              <Card style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 12 }}>
                  Archivo del reporte
                </Text>
                {!isLocked ? (
                  <TouchableOpacity
                    onPress={selectFile}
                    style={{
                      borderWidth: 2,
                      borderStyle: "dashed",
                      borderColor: file ? parcial.color : C.border,
                      borderRadius: 12,
                      padding: 24,
                      alignItems: "center",
                      backgroundColor: file ? parcial.color + "11" : C.bg,
                    }}
                  >
                    <Feather name="upload-cloud" size={28} color={file ? parcial.color : C.textMuted} style={{ marginBottom: 8 }} />
                    <Text style={{ fontSize: 13, fontWeight: "700", color: file ? parcial.color : C.text, marginBottom: 4 }}>
                      {file ? file.name : "Seleccionar archivo"}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {file ? file.size : "PDF, DOCX · máx 25 MB"}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Row style={{ alignItems: "center", gap: 10, padding: 12, backgroundColor: C.bg, borderRadius: 10 }}>
                    <Feather name="file-text" size={18} color={C.textMuted} />
                    <Text style={{ fontSize: 13, color: C.textMuted }}>
                      {rep.archivo || (rep.submitted ? "Archivo entregado" : "Aún sin archivo")}
                    </Text>
                  </Row>
                )}
              </Card>

              {/* Botón de envío */}
              {!isLocked && (
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={{
                    backgroundColor: parcial.color,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <Row style={{ alignItems: "center", gap: 8 }}>
                    <Feather name="send" size={16} color="white" />
                    <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
                      {rep.submitted ? "Reenviar Reporte" : `Enviar Parcial ${activeTab}`}
                    </Text>
                  </Row>
                </TouchableOpacity>
              )}
            </>
          );
        })()}
      </ScrollView>

      {/* ── Banner flotante "Deshacer envío" ────────────────────────────────── */}
      {undoBanner && (
        <Animated.View
          style={{
            position:       "absolute",
            bottom:         24,
            left:           16,
            right:          16,
            opacity:        bannerAnim,
            transform:      [{ translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
            borderRadius:   14,
            backgroundColor:"#0F172A",
            paddingVertical: 14,
            paddingHorizontal: 18,
            flexDirection:  "row",
            alignItems:     "center",
            shadowColor:    "#000",
            shadowOpacity:  0.25,
            shadowRadius:   12,
            elevation:      8,
          }}
        >
          {/* Ícono + texto */}
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: C.green + "22", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            <Feather name="check" size={16} color={C.green} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#F1F5F9" }}>
              Reporte enviado
            </Text>
            <Text style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>
              Puedes deshacer en {undoBanner.segundos}s
            </Text>
          </View>

          {/* Botón Deshacer */}
          <TouchableOpacity
            onPress={handleUndo}
            style={{
              paddingHorizontal: 14,
              paddingVertical:   8,
              borderRadius:      8,
              backgroundColor:   C.teal,
              marginRight:       8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "800", color: "white" }}>Deshacer</Text>
          </TouchableOpacity>

          {/* Cerrar */}
          <TouchableOpacity onPress={dismissBanner}>
            <Feather name="x" size={18} color="#64748B" />
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

// ── Campo de formulario ───────────────────────────────────────────────────────
function Field({ label, value, onChangeText, placeholder, multiline, editable = true, last }) {
  return (
    <View style={{ marginBottom: last ? 0 : 14 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSub, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value || ""}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textLight}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        editable={editable}
        style={{
          padding:         11,
          borderRadius:    8,
          borderWidth:     1,
          borderColor:     C.border,
          fontSize:        13,
          color:           C.text,
          backgroundColor: editable ? "#FAFAFA" : C.bg,
          ...(multiline ? { textAlignVertical: "top", minHeight: 90 } : {}),
        }}
      />
    </View>
  );
}
