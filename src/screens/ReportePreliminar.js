import { useState, useEffect } from "react";
import {
  Alert,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import PropTypes from "prop-types";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, Badge } from "../components";
import { ValidatedInput, validators } from "../components/ValidatedInput";
import { useReportes } from "../context/ReportesContext";
import { useProyectos } from "../context/ProyectosContext";
import apiClient from "../utils/apiClient";

export default function ReportePreliminar() {
  const { colors: C } = useTheme();
  // ── Contextos — conexión al flujo de revisión ─────────────────────────────
  const { updateReport, reports } = useReportes() || {};
  const { submitReporteFromResidente } = useProyectos() || {};

  const preliminarReport = reports?.find((r) => r.id === "preliminar");

  const [empresa, setEmpresa] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [empresas, setEmpresas] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [fileData, setFileData] = useState(null);

  // undefined = cargando, null = sin asesor, objeto = asesor asignado
  const [asesor, setAsesor] = useState(undefined);

  useEffect(() => {
    apiClient.get("/api/residente/empresas").then((res) => {
      if (res.ok && res.body?.ok && res.body.empresas) {
        setEmpresas(res.body.empresas);
      }
    });
    // Verificar si el residente tiene asesor asignado
    apiClient.get("/api/residente/asesor").then((res) => {
      if (res.ok && res.body?.ok) {
        setAsesor(res.body.asesor ?? null);
      } else {
        setAsesor(null);
      }
    });
  }, []);

  // Agregado: Función para descargar el archivo guardado
  const downloadFile = () => {
    if (!preliminarReport?.archivo_url) return;
    const link = document.createElement("a");
    link.href = preliminarReport.archivo_url;
    link.download = preliminarReport.nombre_archivo || "reporte_preliminar.pdf";
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Agregado: Función para deshacer el envío (solo si no está aceptado)
  const undoUpload = async () => {
    console.log("undoUpload llamado, status:", preliminarReport?.status);
    console.log("preliminarReport:", preliminarReport);
    // Modificado: Permitir deshacer envío si el reporte está en "En Revisión" o "Pendiente"
    // Por qué: El residente puede cometer errores al subir el archivo y necesita corregirlo rápidamente
    // Para qué: Evitar que el residente tenga que esperar a que el asesor revise para corregir errores
    if (preliminarReport?.status === "Aceptado") {
      Alert.alert(
        "No permitido",
        "No puedes deshacer el envío de un reporte ya aceptado.",
      );
      return;
    }
    Alert.alert(
      "Deshacer envío",
      "¿Estás seguro de que quieres deshacer el envío? Podrás volver a subir el archivo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deshacer",
          style: "destructive",
          onPress: async () => {
            try {
              // Llamar al backend para limpiar el archivo
              const res = await apiClient.put(
                "/api/residente/reportes/preliminar",
                {
                  archivo: null,
                  nombre_archivo: null,
                  empresa: empresa,
                },
              );
              if (res.ok) {
                // Actualizar el estado local
                if (updateReport) {
                  updateReport("preliminar", {
                    status: "Pendiente",
                    submitted: null,
                    feedback: null,
                    archivo_url: null,
                    nombre_archivo: null,
                  });
                }
                setUploadedFile(null);
                setFileData(null);
                setSavedAt(null);
                Alert.alert(
                  "Envío deshecho",
                  "Puedes volver a subir tu reporte.",
                );
              }
            } catch (error) {
              console.error("Error al deshacer envío:", error);
              Alert.alert("Error", "No se pudo deshacer el envío.");
            }
          },
        },
      ],
    );
  };

  const selectFile = () => {
    if (!globalThis?.document?.createElement) {
      Alert.alert(
        "Seleccionar archivo",
        "La selección de archivos está disponible en la versión web.",
      );
      return;
    }
    const input = globalThis.document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.doc,.docx";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploadedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      });

      // Convertir archivo a base64 para enviar al backend
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData(event.target.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const uploadReport = async () => {
    if (!empresaId) {
      Alert.alert("Falta información", "Selecciona la empresa antes de subir.");
      return;
    }
    if (!uploadedFile) {
      Alert.alert(
        "Sin archivo",
        "Selecciona el archivo del reporte preliminar antes de subirlo.",
      );
      return;
    }
    if (preliminarReport?.status === "Aceptado") {
      Alert.alert(
        "Ya aceptado",
        "Tu reporte preliminar ya fue aceptado por tu asesor.",
      );
      return;
    }
    if (
      preliminarReport?.status === "Pendiente" &&
      preliminarReport?.submitted
    ) {
      Alert.alert(
        "En revisión",
        "Tu reporte preliminar ya fue enviado y está pendiente de revisión.",
      );
      return;
    }

    const today = new Date().toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    try {
      // Enviar archivo al backend
      // Modificado: Enviar empresaId en lugar de nombre de empresa
      // Por qué: Ahora se selecciona de un listado, se guarda el ID para mantener consistencia
      const res = await apiClient.put("/api/residente/reportes/preliminar", {
        archivo: fileData,
        nombre_archivo: uploadedFile.name,
        empresa_id: empresaId,
      });

      if (!res.ok) {
        Alert.alert(
          "Error",
          res.body?.mensaje || "No se pudo subir el reporte.",
        );
        return;
      }

      setSavedAt(new Date().toLocaleString());

      // 1. Actualizar ReportesContext (el Residente ve el estado)
      if (updateReport) {
        updateReport("preliminar", {
          status: "Pendiente",
          submitted: today,
          feedback: null,
          empresa,
        });
      }

      // 2. Sincronizar a ProyectosContext (el Asesor lo ve en SeguimientoAsesor)
      if (submitReporteFromResidente) {
        submitReporteFromResidente("Preliminar");
      }

      Alert.alert(
        "Reporte Preliminar enviado",
        "Tu reporte fue enviado correctamente. Tu asesor lo revisará y recibirás retroalimentación en breve.",
      );
    } catch (error) {
      console.error("Error al subir reporte:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor.");
    }
  };

  // ── Mostrar estado si ya fue enviado/revisado ─────────────────────────────
  // Solo cuenta como "enviado" si tiene fecha de entrega real Y hay asesor asignado
  const yaEnviado = !!(preliminarReport?.submitted && asesor);
  const isLocked =
    preliminarReport?.status === "Aceptado" ||
    (preliminarReport?.status === "Pendiente" && yaEnviado);

  // ── Pantalla de bloqueo si no hay asesor asignado ────────────────────────
  if (asesor === null) {
    return (
      <ScrollView>
        <View
          style={{
            backgroundColor: C.navy,
            borderRadius: 14,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <Row style={{ alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Feather name="edit" size={18} color={C.teal} />
            <Text style={{ fontSize: 18, fontWeight: "800", color: "white" }}>
              Reporte Preliminar
            </Text>
          </Row>
          <Text style={{ color: C.textLight, fontSize: 13 }}>
            Residencia Profesional — Datos del Proyecto
          </Text>
        </View>
        <View
          style={{
            backgroundColor: C.amberLight,
            borderRadius: 12,
            padding: 18,
            borderWidth: 1,
            borderColor: C.amber,
            marginBottom: 16,
          }}
        >
          <Row style={{ alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Feather name="alert-triangle" size={20} color={C.amber} />
            <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>
              Sin asesor asignado
            </Text>
          </Row>
          <Text style={{ fontSize: 13, color: C.textSub, lineHeight: 20 }}>
            Aún no tienes un asesor asignado. No puedes enviar tu Reporte
            Preliminar hasta que el Jefe de Vinculación te asigne uno.
          </Text>
          <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 10 }}>
            Contacta al jefe de vinculación para que realice la asignación.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView>
      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: C.navy,
          borderRadius: 14,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
          <View>
            <Row style={{ alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Feather name="edit" size={18} color={C.teal} />
              <Text style={{ fontSize: 18, fontWeight: "800", color: "white" }}>
                Reporte Preliminar
              </Text>
            </Row>
            <Text style={{ color: C.textLight, fontSize: 13 }}>
              Residencia Profesional — Datos del Proyecto
            </Text>
          </View>
          <Badge
            text="ITV-AC-PO-004-A01"
            color={C.teal}
            bg="rgba(13,148,136,0.2)"
          />
        </Row>
      </View>

      {/* ── Banner de estado ── */}
      {preliminarReport?.status && yaEnviado && (
        <View
          style={{
            marginBottom: 16,
            backgroundColor:
              preliminarReport.status === "Aceptado"
                ? C.greenLight
                : preliminarReport.status === "Por corregir"
                  ? C.redLight
                  : C.amberLight,
            borderRadius: 12,
            padding: 14,
            borderWidth: 1,
            borderColor:
              preliminarReport.status === "Aceptado"
                ? C.green
                : preliminarReport.status === "Por corregir"
                  ? C.red
                  : C.amber,
          }}
        >
          <Row style={{ alignItems: "center", gap: 10 }}>
            <Feather
              name={
                preliminarReport.status === "Aceptado"
                  ? "check-circle"
                  : preliminarReport.status === "Por corregir"
                    ? "x-circle"
                    : "clock"
              }
              size={20}
              color={
                preliminarReport.status === "Aceptado"
                  ? C.green
                  : preliminarReport.status === "Por corregir"
                    ? C.red
                    : C.amber
              }
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
                {preliminarReport.status === "Aceptado"
                  ? "Reporte aceptado por tu asesor ✓"
                  : preliminarReport.status === "Por corregir"
                    ? "Se requieren correcciones"
                    : `En revisión por ${asesor?.nombre || "tu asesor"} — pendiente de respuesta`}
              </Text>
              {preliminarReport.feedback && (
                <Text
                  style={{
                    fontSize: 12,
                    color: C.textSub,
                    marginTop: 4,
                    lineHeight: 18,
                  }}
                >
                  {preliminarReport.feedback}
                </Text>
              )}
            </View>
          </Row>
        </View>
      )}

      {/* ── Datos del Proyecto ── */}
      <Card style={{ marginBottom: 16, opacity: isLocked ? 0.7 : 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "800",
            color: C.text,
            marginBottom: 14,
          }}
        >
          Datos del Proyecto
        </Text>
        {/* Modificado: Selector de empresas en lugar de campo de texto */}
        {/* Por qué: El residente debe seleccionar una empresa de un listado en lugar de escribir el nombre */}
        {/* Para qué: Evitar errores de escritura y garantizar que la empresa existe en el sistema */}
        <View style={{ marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 12,
              fontWeight: "700",
              color: C.textMuted,
              marginBottom: 6,
            }}
          >
            EMPRESA
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 8 }}
          >
            <Row style={{ gap: 8 }}>
              {empresas.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => {
                    setEmpresaId(e.id);
                    setEmpresa(e.nombre);
                  }}
                  disabled={isLocked}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: empresaId === e.id ? C.teal : C.bg,
                    borderWidth: 1.5,
                    borderColor: empresaId === e.id ? C.teal : C.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      color: empresaId === e.id ? "white" : C.text,
                    }}
                  >
                    {e.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </Row>
          </ScrollView>
          {empresaId && (
            <Text style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}>
              Empresa seleccionada: {empresa}
            </Text>
          )}
        </View>
      </Card>

      {/* ── Subir archivo ── */}
      <Card style={{ marginBottom: 16 }}>
        <Row style={{ alignItems: "center", gap: 8, marginBottom: 14 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: C.blueLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="upload-cloud" size={14} color={C.blue} />
          </View>
          <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }}>
            Archivo del Reporte
          </Text>
        </Row>
        {!isLocked ? (
          <TouchableOpacity
            onPress={selectFile}
            style={{
              borderWidth: 2,
              borderStyle: "dashed",
              borderColor: uploadedFile ? C.teal : C.border,
              borderRadius: 12,
              padding: 24,
              alignItems: "center",
              backgroundColor: uploadedFile ? C.tealLighter : C.bg,
            }}
          >
            <Feather
              name="upload-cloud"
              size={28}
              color={uploadedFile ? C.teal : C.textMuted}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: uploadedFile ? C.teal : C.text,
                marginBottom: 4,
              }}
            >
              {uploadedFile ? uploadedFile.name : "Seleccionar archivo"}
            </Text>
            <Text style={{ fontSize: 11, color: C.textMuted }}>
              {uploadedFile ? uploadedFile.size : "PDF, DOCX · máx 25 MB"}
            </Text>
          </TouchableOpacity>
        ) : (
          // MODIFICADO: Mostrar el nombre del archivo guardado y permitir descargarlo
          <View>
            <Row
              style={{
                alignItems: "center",
                gap: 10,
                padding: 12,
                backgroundColor: C.tealLighter,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <Feather name="file-text" size={18} color={C.teal} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, color: C.teal, fontWeight: "600" }}
                >
                  {preliminarReport?.nombre_archivo || "Archivo enviado"}
                </Text>
                <Text style={{ fontSize: 11, color: C.textMuted }}>
                  Enviado el {preliminarReport?.submitted || "—"}
                </Text>
              </View>
              <TouchableOpacity onPress={downloadFile} style={{ padding: 8 }}>
                <Feather name="download" size={16} color={C.teal} />
              </TouchableOpacity>
            </Row>
            {/* Agregado: Botón para deshacer el envío (solo si no está aceptado y tiene archivo) */}
            {preliminarReport?.status !== "Aceptado" &&
              preliminarReport?.nombre_archivo && (
                <TouchableOpacity
                  onPress={undoUpload}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    padding: 8,
                    backgroundColor: C.redLight,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: C.red,
                  }}
                >
                  <Feather name="rotate-ccw" size={14} color={C.red} />
                  <Text
                    style={{ fontSize: 12, color: C.red, fontWeight: "600" }}
                  >
                    Deshacer envío
                  </Text>
                </TouchableOpacity>
              )}
          </View>
        )}
      </Card>

      {/* ── Confirmación ── */}
      {savedAt && !isLocked && (
        <View
          style={{
            backgroundColor: C.greenLight,
            borderWidth: 1,
            borderColor: C.green,
            borderRadius: 10,
            padding: 12,
            marginBottom: 14,
          }}
        >
          <Row style={{ alignItems: "center", gap: 8 }}>
            <Feather name="check-circle" size={16} color={C.green} />
            <Text style={{ fontSize: 12, color: C.green, fontWeight: "700" }}>
              Reporte subido: {savedAt}
            </Text>
          </Row>
        </View>
      )}

      {/* ── Botón enviar ── */}
      {!isLocked && (
        <TouchableOpacity
          onPress={uploadReport}
          style={{
            backgroundColor: C.teal,
            borderRadius: 12,
            padding: 16,
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <Row style={{ alignItems: "center", gap: 8 }}>
            <Feather name="upload-cloud" size={18} color="white" />
            <Text style={{ color: "white", fontWeight: "800", fontSize: 15 }}>
              Subir Reporte Preliminar
            </Text>
          </Row>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  disabled = false,
  required = false,
  validator,
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: C.textSub,
          marginBottom: 6,
        }}
      >
        {label} {required && <Text style={{ color: C.red }}>*</Text>}
      </Text>
      <ValidatedInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        editable={!disabled}
        required={required}
        validator={validator}
        style={{
          padding: 11,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: disabled ? C.borderLight : C.border,
          fontSize: 13,
          color: disabled ? C.textMuted : C.text,
          backgroundColor: disabled ? C.bg : "#FAFAFA",
          ...(multiline ? { minHeight: 90, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}

// PropTypes para FormField
FormField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  multiline: PropTypes.bool,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  validator: PropTypes.func,
};

FormField.defaultProps = {
  placeholder: "",
  multiline: false,
  disabled: false,
  required: false,
  validator: null,
};
