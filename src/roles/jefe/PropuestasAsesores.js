import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Pressable, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Row, Card, Badge, StatCard } from "../../components";
import { useProyectos } from "../../context/ProyectosContext";

export default function PropuestasAsesores({ onNavigate }) {
  const { colors: C } = useTheme();
  const { propuestas, proyectos, aprobarPropuesta, rechazarPropuesta, aprobarAvanceFase } = useProyectos() || { propuestas: [], proyectos: [] };
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const pendientes = propuestas.filter((p) => p.status === "Pendiente");
  const aprobadas = propuestas.filter((p) => p.status === "Aprobado");
  const rechazadas = propuestas.filter((p) => p.status === "Rechazado");
  const solicitudesAvance = proyectos.filter((p) => p.solicitudAvance);

  const handleAprobar = (id) => {
    aprobarPropuesta(id);
    Alert.alert("Proyecto aprobado", "El proyecto ha sido aprobado y añadido al tablero.");
  };

  const handleRechazar = () => {
    if (!rejectMotivo.trim()) { Alert.alert("Error", "Ingresa el motivo del rechazo."); return; }
    rechazarPropuesta(rejectingId, rejectMotivo.trim());
    setRejectingId(null);
    setRejectMotivo("");
    Alert.alert("Propuesta rechazada", "Se ha notificado al asesor.");
  };

  const handleAprobarAvance = (proyectoId) => {
    aprobarAvanceFase(proyectoId);
    Alert.alert("Avance aprobado", "El proyecto ha avanzado a la siguiente fase.");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ padding: 24 }}>
      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <View>
          <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>Propuestas y Solicitudes</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>Gestión de propuestas de asesores</Text>
        </View>
      </Row>

      {/* Stats */}
      <Row style={{ gap: 12, marginBottom: 22 }}>
        <StatCard label="Pendientes" value={String(pendientes.length)} icon="clock" iconBg={C.amberLight} iconColor={C.amber} />
        <StatCard label="Aprobadas" value={String(aprobadas.length)} icon="check-circle" iconBg={C.greenLight} iconColor={C.green} />
        <StatCard label="Rechazadas" value={String(rechazadas.length)} icon="x-circle" iconBg={C.redLight} iconColor={C.red} />
        <StatCard label="Solicitudes Avance" value={String(solicitudesAvance.length)} icon="arrow-right-circle" iconBg={C.blueLight} iconColor={C.blue} />
      </Row>

      {/* Solicitudes de Avance de Fase */}
      {solicitudesAvance.length > 0 && (
        <Card style={{ marginBottom: 20, borderLeftWidth: 4, borderLeftColor: C.blue }}>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text, marginBottom: 14 }}>Solicitudes de Avance de Fase</Text>
          {solicitudesAvance.map((p, i) => (
            <Row key={i} style={{ alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: C.border }}>
              <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: C.blueLight, alignItems: "center", justifyContent: "center" }}>
                <Feather name="arrow-right" size={18} color={C.blue} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: C.text }}>{p.title}</Text>
                <Text style={{ fontSize: 12, color: C.textMuted }}>{p.company} · Asesor: {p.asesor} · Fase actual: {p.phase}</Text>
              </View>
              <TouchableOpacity onPress={() => handleAprobarAvance(p.id)} style={{ backgroundColor: C.teal, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ fontSize: 12, color: "white", fontWeight: "700" }}>Aprobar avance</Text>
              </TouchableOpacity>
            </Row>
          ))}
        </Card>
      )}

      {/* Propuestas Pendientes */}
      <Text style={{ fontSize: 13, fontWeight: "800", color: C.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Propuestas Pendientes</Text>
      {pendientes.length === 0 ? (
        <Card style={{ marginBottom: 20 }}>
          <View style={{ alignItems: "center", paddingVertical: 24 }}>
            <Feather name="inbox" size={28} color={C.textLight} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 13, color: C.textMuted }}>Sin propuestas pendientes</Text>
          </View>
        </Card>
      ) : (
        <View style={{ gap: 12, marginBottom: 20 }}>
          {pendientes.map((prop) => (
            <Card key={prop.id} style={{ borderLeftWidth: 4, borderLeftColor: C.amber }}>
              <Row style={{ justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <View style={{ flex: 1 }}>
                  <Row style={{ alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontSize: 16, fontWeight: "700", color: C.text }}>{prop.title}</Text>
                    <Badge text={prop.priority} color={prop.priority === "Alta" ? C.red : prop.priority === "Media" ? C.amber : C.green} bg={prop.priority === "Alta" ? C.redLight : prop.priority === "Media" ? C.amberLight : C.greenLight} />
                  </Row>
                  <Text style={{ fontSize: 12, color: C.textMuted }}>Empresa: {prop.company} · Asesor: {prop.asesor}</Text>
                  <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Propuesto: {prop.fechaPropuesta}</Text>
                </View>
              </Row>

              {/* Details */}
              <View style={{ backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 14, gap: 6 }}>
                <Row style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, width: 120 }}>Residentes:</Text>
                  <Text style={{ fontSize: 11, color: C.text, flex: 1 }}>{prop.residentesAsignados.map((r) => r.nombre).join(", ") || "Ninguno"} ({prop.residentesAsignados.length}/{prop.residentesRequeridos} requeridos)</Text>
                </Row>
                <Row style={{ gap: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, width: 120 }}>Habilidades:</Text>
                  <Text style={{ fontSize: 11, color: C.text, flex: 1 }}>{prop.habilidadesRequeridas.join(", ")}</Text>
                </Row>
                {prop.rolRequerido && (
                  <Row style={{ gap: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, width: 120 }}>Rol requerido:</Text>
                    <Text style={{ fontSize: 11, color: C.text, flex: 1 }}>{prop.rolRequerido}</Text>
                  </Row>
                )}
                {prop.descripcionAvance && (
                  <Row style={{ gap: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, width: 120 }}>Avances:</Text>
                    <Text style={{ fontSize: 11, color: C.text, flex: 1 }}>{prop.descripcionAvance}</Text>
                  </Row>
                )}
              </View>

              {/* Actions */}
              <Row style={{ gap: 10 }}>
                <TouchableOpacity onPress={() => { setRejectingId(prop.id); setRejectMotivo(""); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5, borderColor: C.red, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: C.red }}>Rechazar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleAprobar(prop.id)} style={{ flex: 2, paddingVertical: 10, borderRadius: 8, backgroundColor: C.teal, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: "white" }}>Aprobar Proyecto</Text>
                </TouchableOpacity>
              </Row>
            </Card>
          ))}
        </View>
      )}

      {/* Historial */}
      {(aprobadas.length > 0 || rechazadas.length > 0) && (
        <>
          <Text style={{ fontSize: 13, fontWeight: "800", color: C.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Historial</Text>
          <View style={{ gap: 10 }}>
            {[...aprobadas, ...rechazadas].map((prop) => (
              <Card key={prop.id} style={{ padding: 14 }}>
                <Row style={{ alignItems: "center", gap: 10 }}>
                  <Feather name={prop.status === "Aprobado" ? "check-circle" : "x-circle"} size={18} color={prop.status === "Aprobado" ? C.green : C.red} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: C.text }}>{prop.title}</Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>{prop.company} · {prop.asesor}</Text>
                  </View>
                  <Badge text={prop.status} color={prop.status === "Aprobado" ? C.green : C.red} bg={prop.status === "Aprobado" ? C.greenLight : C.redLight} />
                </Row>
                {prop.motivoRechazo && (
                  <Text style={{ fontSize: 11, color: C.red, marginTop: 6, fontStyle: "italic" }}>Motivo: {prop.motivoRechazo}</Text>
                )}
              </Card>
            ))}
          </View>
        </>
      )}

      {/* Reject Modal */}
      <Modal visible={!!rejectingId} transparent animationType="fade">
        <Pressable onPress={() => setRejectingId(null)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }}>
          <Pressable onPress={() => {}} style={{ width: 420, backgroundColor: C.card, borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: "800", color: C.text, marginBottom: 16 }}>Rechazar Propuesta</Text>
            <Text style={{ fontSize: 11, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", marginBottom: 6 }}>Motivo del rechazo *</Text>
            <TextInput
              value={rejectMotivo}
              onChangeText={setRejectMotivo}
              placeholder="Explica el motivo..."
              placeholderTextColor={C.textLight}
              multiline
              style={{ padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.border, fontSize: 13, color: C.text, backgroundColor: "#FAFAFA", minHeight: 80, textAlignVertical: "top", marginBottom: 18 }}
            />
            <Row style={{ gap: 10 }}>
              <TouchableOpacity onPress={() => setRejectingId(null)} style={{ flex: 1, paddingVertical: 11, borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.textMuted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleRechazar} style={{ flex: 2, paddingVertical: 11, borderRadius: 9, backgroundColor: C.red, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>Confirmar Rechazo</Text>
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
