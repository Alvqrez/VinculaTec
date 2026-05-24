import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Row, Card, Badge } from "../../components";
import apiClient from "../../utils/apiClient";

const FUENTE_STYLES = {
  banco:   { bg: "#e0f2fe", color: "#0369a1", label: "Banco de Proyectos" },
  propia:  { bg: "#fef3c7", color: "#92400e", label: "Propuesta Propia"   },
  empresa: { bg: "#dcfce7", color: "#166534", label: "Propuesta Empresa"  },
};

export default function ValidacionFuentes({ onNavigate }) {
  const { colors: C } = useTheme();
  const [fuentes, setFuentes] = useState([]);
  const [showRechazoModal, setShowRechazoModal] = useState(false);
  const [rechazoId, setRechazoId] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    apiClient.get("/api/jefe/fuentes").then((res) => {
      if (res.ok && res.body?.ok) setFuentes(res.body.fuentes);
    });
  }, []);

  const autorizarFuente = async (id) => {
    const res = await apiClient.put(`/api/jefe/fuentes/${id}`, { estado: "Validada" });
    if (res.ok) setFuentes((prev) => prev.map((f) => f.id === id ? { ...f, estado: "Validada" } : f));
  };

  const abrirRechazo = (id) => {
    setRechazoId(id);
    setMotivoRechazo("");
    setShowRechazoModal(true);
  };

  const confirmarRechazo = async () => {
    if (!motivoRechazo.trim()) return;
    const res = await apiClient.put(`/api/jefe/fuentes/${rechazoId}`, { estado: "Rechazada", observaciones: motivoRechazo.trim() });
    if (res.ok) setFuentes((prev) => prev.map((f) => f.id === rechazoId ? { ...f, estado: "Rechazada", motivoRechazo: motivoRechazo.trim() } : f));
    setShowRechazoModal(false);
    setRechazoId(null);
    setMotivoRechazo("");
  };

  return (
    <View>
      {/* Header */}
      <Card style={{ marginBottom: 16, padding: 0, overflow: "hidden" }}>
        <View style={{ padding: 24, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>Validación de Fuente del Proyecto</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Clasificación obligatoria para Reporte Preliminar</Text>
            </View>
            <Badge text="ITV-AC-PO-004-A01" color={C.teal} bg="#e6f6f5" />
          </Row>
        </View>

        {/* Navegación */}
        <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
          <Row style={{ alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => onNavigate && onNavigate("proyectos")} style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Text style={{ fontSize: 18, color: C.teal }}>←</Text>
              <Text style={{ fontSize: 14, fontWeight: "600", color: C.teal }}>Volver al listado</Text>
            </TouchableOpacity>
            <Text style={{ color: "#cbd5e1" }}>|</Text>
            <Text style={{ fontSize: 12, color: C.textMuted }}>
              Procesos Académicos / <Text style={{ color: C.text, fontWeight: "500" }}>Revisión de Proyecto</Text>
            </Text>
          </Row>
        </View>

        {/* Tabla */}
        <View>
          {/* Header de tabla */}
          <Row style={{ backgroundColor: "#fafbfc", paddingVertical: 15, paddingHorizontal: 32, borderBottomWidth: 1, borderBottomColor: C.borderLight }}>
            {["Estudiante / Proyecto", "Fuente Declarada", "Validación", "Acción"].map((h, i) => (
              <Text key={i} style={{ flex: i === 0 ? 2 : 1, fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase" }}>{h}</Text>
            ))}
          </Row>

          {/* Filas */}
          {fuentes.map((est, i) => {
            const style = FUENTE_STYLES[est.tipoFuente] || FUENTE_STYLES.propia;
            return (
              <Row key={est.id} style={{ paddingVertical: 20, paddingHorizontal: 32, borderBottomWidth: i < fuentes.length - 1 ? 1 : 0, borderBottomColor: C.borderLight, alignItems: "center" }}>
                <View style={{ flex: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{est.nombre}</Text>
                  <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{est.carrera}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: style.bg, alignSelf: "flex-start" }}>
                    <Text style={{ fontSize: 12, fontWeight: "600", color: style.color }}>{style.label}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ padding: 6, borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: "white" }}>
                    <Text style={{ fontSize: 13, color: C.textSub }}>Validar como {style.label}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  {est.estado === "Validada" ? (
                    <Row style={{ alignItems: "center", gap: 6 }}>
                      <Feather name="check-circle" size={16} color={C.green} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: C.green }}>Autorizado</Text>
                    </Row>
                  ) : est.estado === "Rechazada" ? (
                    <Row style={{ alignItems: "center", gap: 6 }}>
                      <Feather name="x-circle" size={16} color={C.red} />
                      <Text style={{ fontSize: 13, fontWeight: "600", color: C.red }}>Rechazado</Text>
                    </Row>
                  ) : (
                    <Row style={{ gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => autorizarFuente(est.id)}
                        style={{ backgroundColor: C.teal, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 }}
                      >
                        <Text style={{ color: "white", fontWeight: "600", fontSize: 12 }}>Autorizar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => abrirRechazo(est.id)}
                        style={{ backgroundColor: "white", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: C.red }}
                      >
                        <Text style={{ color: C.red, fontWeight: "600", fontSize: 12 }}>Rechazar</Text>
                      </TouchableOpacity>
                    </Row>
                  )}
                </View>
              </Row>
            );
          })}
        </View>
      </Card>

      {/* Modal Rechazo */}
      <Modal visible={showRechazoModal} transparent animationType="fade" onRequestClose={() => setShowRechazoModal(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ width: 400, backgroundColor: "white", borderRadius: 14, padding: 28, gap: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>Rechazar Fuente</Text>
            {rechazoId !== null && (
              <Text style={{ fontSize: 13, color: C.textMuted }}>
                Estudiante: <Text style={{ color: C.text, fontWeight: "600" }}>{fuentes.find(f => f.id === rechazoId)?.nombre}</Text>
              </Text>
            )}
            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Motivo del rechazo *</Text>
              <TextInput
                value={motivoRechazo}
                onChangeText={setMotivoRechazo}
                placeholder="Indica el motivo del rechazo..."
                placeholderTextColor={C.textLight}
                multiline
                style={{ padding: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border, fontSize: 13, color: C.text, backgroundColor: "#FAFAFA", minHeight: 80 }}
              />
            </View>
            <Row style={{ gap: 10, justifyContent: "flex-end" }}>
              <TouchableOpacity onPress={() => setShowRechazoModal(false)} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: C.border }}>
                <Text style={{ fontSize: 13, color: C.textMuted, fontWeight: "600" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmarRechazo}
                style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, backgroundColor: motivoRechazo.trim() ? C.red : "#e2e8f0" }}
              >
                <Text style={{ fontSize: 13, color: motivoRechazo.trim() ? "white" : C.textMuted, fontWeight: "600" }}>Confirmar Rechazo</Text>
              </TouchableOpacity>
            </Row>
          </View>
        </View>
      </Modal>

      {/* Nota */}
      <View style={{ padding: 20, borderWidth: 1, borderStyle: "dashed", borderColor: C.border, borderRadius: 12 }}>
        <Text style={{ fontSize: 13, color: C.textMuted }}>
          <Text style={{ fontWeight: "700" }}>Nota de cumplimiento: </Text>
          El Jefe de Departamento debe confirmar que la fuente declarada coincida con los registros oficiales antes de proceder a la firma del dictamen.
        </Text>
      </View>
    </View>
  );
}
