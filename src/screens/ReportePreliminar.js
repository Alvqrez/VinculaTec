import { useState } from "react";
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card, Badge } from "../components";
import { useReportes } from "../context/ReportesContext";
import { useProyectos } from "../context/ProyectosContext";

export default function ReportePreliminar() {
  // ── Contextos — conexión al flujo de revisión ─────────────────────────────
  const { updateReport, reports }         = useReportes()  || {};
  const { submitReporteFromResidente }    = useProyectos() || {};

  const preliminarReport = reports?.find((r) => r.id === "preliminar");

  const [empresa, setEmpresa] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [savedAt, setSavedAt] = useState(null);

  const selectFile = () => {
    if (!globalThis?.document?.createElement) {
      Alert.alert("Seleccionar archivo", "La selección de archivos está disponible en la versión web.");
      return;
    }
    const input = globalThis.document.createElement("input");
    input.type   = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadedFile({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(2)} MB` });
    };
    input.click();
  };

  const uploadReport = () => {
    if (!empresa.trim()) {
      Alert.alert("Falta información", "Escribe el nombre de la empresa antes de subir.");
      return;
    }
    if (!uploadedFile) {
      Alert.alert("Sin archivo", "Selecciona el archivo del reporte preliminar antes de subirlo.");
      return;
    }
    if (preliminarReport?.status === "Aceptado") {
      Alert.alert("Ya aceptado", "Tu reporte preliminar ya fue aceptado por tu asesor.");
      return;
    }
    if (preliminarReport?.status === "Pendiente" && preliminarReport?.submitted) {
      Alert.alert("En revisión", "Tu reporte preliminar ya fue enviado y está pendiente de revisión.");
      return;
    }

    const today = new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    setSavedAt(new Date().toLocaleString());

    // 1. Actualizar ReportesContext (el Residente ve el estado)
    if (updateReport) {
      updateReport("preliminar", { status: "Pendiente", submitted: today, feedback: null, empresa });
    }

    // 2. Sincronizar a ProyectosContext (el Asesor lo ve en SeguimientoAsesor)
    if (submitReporteFromResidente) {
      submitReporteFromResidente("Preliminar");
    }

    Alert.alert(
      "Reporte Preliminar enviado",
      "Tu reporte fue enviado correctamente. Tu asesor lo revisará y recibirás retroalimentación en breve."
    );
  };

  // ── Mostrar estado si ya fue enviado/revisado ─────────────────────────────
  const isLocked = preliminarReport?.status === "Aceptado" ||
    (preliminarReport?.status === "Pendiente" && preliminarReport?.submitted);

  return (
    <ScrollView>
      {/* ── Header ── */}
      <View style={{ backgroundColor: C.navy, borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Row style={{ alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Feather name="edit" size={18} color={C.teal} />
              <Text style={{ fontSize: 18, fontWeight: "800", color: "white" }}>Reporte Preliminar</Text>
            </Row>
            <Text style={{ color: C.textLight, fontSize: 13 }}>Residencia Profesional — Datos del Proyecto</Text>
          </View>
          <Badge text="ITV-AC-PO-004-A01" color={C.teal} bg="rgba(13,148,136,0.2)" />
        </Row>
      </View>

      {/* ── Banner de estado ── */}
      {preliminarReport?.status && preliminarReport.submitted && (
        <View style={{
          marginBottom: 16,
          backgroundColor:
            preliminarReport.status === "Aceptado"     ? C.greenLight :
            preliminarReport.status === "Por corregir" ? C.redLight   : C.amberLight,
          borderRadius: 12, padding: 14,
          borderWidth: 1,
          borderColor:
            preliminarReport.status === "Aceptado"     ? C.green :
            preliminarReport.status === "Por corregir" ? C.red   : C.amber,
        }}>
          <Row style={{ alignItems: "center", gap: 10 }}>
            <Feather
              name={
                preliminarReport.status === "Aceptado"     ? "check-circle" :
                preliminarReport.status === "Por corregir" ? "x-circle"     : "clock"
              }
              size={20}
              color={
                preliminarReport.status === "Aceptado"     ? C.green :
                preliminarReport.status === "Por corregir" ? C.red   : C.amber
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
                {preliminarReport.status === "Aceptado"     ? "Reporte aceptado por tu asesor ✓" :
                 preliminarReport.status === "Por corregir" ? "Se requieren correcciones" :
                 "En revisión por tu asesor — pendiente de respuesta"}
              </Text>
              {preliminarReport.feedback && (
                <Text style={{ fontSize: 12, color: C.textSub, marginTop: 4, lineHeight: 18 }}>
                  {preliminarReport.feedback}
                </Text>
              )}
            </View>
          </Row>
        </View>
      )}

      {/* ── Datos del Proyecto ── */}
      <Card style={{ marginBottom: 16, opacity: isLocked ? 0.7 : 1 }}>
        <Text style={{ fontSize: 14, fontWeight: "800", color: C.text, marginBottom: 14 }}>Datos del Proyecto</Text>
        <FormField label="Empresa" value={empresa} onChange={setEmpresa} placeholder="Ej: Telmex S.A. de C.V." disabled={isLocked} />
      </Card>

      {/* ── Subir archivo ── */}
      <Card style={{ marginBottom: 16 }}>
        <Row style={{ alignItems: "center", gap: 8, marginBottom: 14 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.blueLight, alignItems: "center", justifyContent: "center" }}>
            <Feather name="upload-cloud" size={14} color={C.blue} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>Archivo del Reporte</Text>
        </Row>
        {!isLocked ? (
          <TouchableOpacity
            onPress={selectFile}
            style={{ borderWidth: 2, borderStyle: "dashed", borderColor: uploadedFile ? C.teal : C.border, borderRadius: 12, padding: 24, alignItems: "center", backgroundColor: uploadedFile ? C.tealLighter : C.bg }}
          >
            <Feather name="upload-cloud" size={28} color={uploadedFile ? C.teal : C.textMuted} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 13, fontWeight: "700", color: uploadedFile ? C.teal : C.text, marginBottom: 4 }}>
              {uploadedFile ? uploadedFile.name : "Seleccionar archivo"}
            </Text>
            <Text style={{ fontSize: 11, color: C.textMuted }}>{uploadedFile ? uploadedFile.size : "PDF, DOCX · máx 25 MB"}</Text>
          </TouchableOpacity>
        ) : (
          <Row style={{ alignItems: "center", gap: 10, padding: 12, backgroundColor: C.tealLighter, borderRadius: 10 }}>
            <Feather name="file-text" size={18} color={C.teal} />
            <Text style={{ fontSize: 13, color: C.teal, fontWeight: "600" }}>
              Documento enviado el {preliminarReport?.submitted || "—"}
            </Text>
          </Row>
        )}
      </Card>

      {/* ── Confirmación ── */}
      {savedAt && !isLocked && (
        <View style={{ backgroundColor: C.greenLight, borderWidth: 1, borderColor: C.green, borderRadius: 10, padding: 12, marginBottom: 14 }}>
          <Row style={{ alignItems: "center", gap: 8 }}>
            <Feather name="check-circle" size={16} color={C.green} />
            <Text style={{ fontSize: 12, color: C.green, fontWeight: "700" }}>Reporte subido: {savedAt}</Text>
          </Row>
        </View>
      )}

      {/* ── Botón enviar ── */}
      {!isLocked && (
        <TouchableOpacity
          onPress={uploadReport}
          style={{ backgroundColor: C.teal, borderRadius: 12, padding: 16, alignItems: "center", marginBottom: 40 }}
        >
          <Row style={{ alignItems: "center", gap: 8 }}>
            <Feather name="upload-cloud" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>Subir Reporte Preliminar</Text>
          </Row>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function FormField({ label, value, onChange, placeholder, multiline, disabled = false }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSub, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value} onChangeText={onChange}
        placeholder={placeholder} placeholderTextColor={C.textLight}
        multiline={multiline} numberOfLines={multiline ? 4 : 1}
        editable={!disabled}
        style={{
          padding: 11, borderRadius: 8, borderWidth: 1,
          borderColor: disabled ? C.borderLight : C.border,
          fontSize: 13, color: disabled ? C.textMuted : C.text,
          backgroundColor: disabled ? C.bg : "#FAFAFA",
          ...(multiline ? { minHeight: 90, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}
