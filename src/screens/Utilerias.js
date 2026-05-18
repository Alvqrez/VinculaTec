import { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Card } from "../components";
import { useFotos } from "../context/FotosContext";

// ── Herramientas con detalle para modal ───────────────────────────────────────
const INFO_POR_ROL = {
  "Jefe de Vinculación": {
    color: C.teal,
    herramientas: [
      {
        icon: "calendar",
        label: "Calendario académico 2025-B",
        url: "https://tec.edu.mx/calendario",
        detalle: {
          descripcion:
            "Calendario oficial del período escolar 2025-B con todas las fechas clave: inicio de residencias, entrega de reportes y evaluaciones finales.",
          tipo: "PDF",
          paginas: "4 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga el PDF desde el portal institucional.",
            "Revisa las fechas límite de entrega de reportes.",
            "Comparte las fechas con tus residentes al inicio del período.",
            "Programa recordatorios con al menos 5 días hábiles de anticipación.",
          ],
        },
      },
      {
        icon: "file-text",
        label: "Formato ITV-AC-PO-004-A01",
        url: "https://tec.edu.mx/formatos",
        detalle: {
          descripcion:
            "Formato oficial de asignación de residentes a empresas y asesores. Debe llenarse al inicio de cada período para cada residente.",
          tipo: "Word / PDF",
          paginas: "2 págs.",
          fecha: "Ene 2026",
          pasos: [
            "Descarga la plantilla en formato Word.",
            "Completa los datos del residente, empresa y asesor.",
            "Obtén las firmas requeridas (residente, asesor, empresa).",
            "Digitaliza y sube al sistema antes del plazo establecido.",
          ],
        },
      },
      {
        icon: "book",
        label: "Reglamento de residencias",
        url: "https://tec.edu.mx/reglamento",
        detalle: {
          descripcion:
            "Reglamento institucional que rige los derechos, obligaciones y procedimientos de la residencia profesional en el ITVER.",
          tipo: "PDF",
          paginas: "32 págs.",
          fecha: "2024",
          pasos: [
            "Lee el reglamento completo al inicio del período.",
            "Comunica a los residentes los artículos más relevantes.",
            "Consulta en caso de incidencias o conflictos.",
            "Actualización vigente: versión 2024.",
          ],
        },
      },
      {
        icon: "link",
        label: "Portal de empresas vinculadas",
        url: "https://tec.edu.mx/empresas",
        detalle: {
          descripcion:
            "Portal institucional con el directorio completo de empresas vinculadas, sus convenios vigentes y los proyectos disponibles para residentes.",
          tipo: "Web",
          paginas: "—",
          fecha: "Actualización continua",
          pasos: [
            "Accede con tus credenciales institucionales.",
            "Consulta el estado de convenios por empresa.",
            "Registra nuevas empresas vinculadas.",
            "Notifica a Control Escolar cambios de convenio.",
          ],
        },
      },
    ],
    notas: [
      "Las asignaciones deben completarse antes del inicio del período.",
      "Los proyectos sin residente asignado deben resolverse en 5 días hábiles.",
      "El cambio de asesor debe justificarse por escrito.",
    ],
  },

  Asesor: {
    color: C.blue,
    herramientas: [
      {
        icon: "file-text",
        label: "Criterios de evaluación de reportes",
        url: "https://tec.edu.mx/criterios",
        detalle: {
          descripcion:
            "Documento oficial con los criterios, rúbricas y ponderaciones para la evaluación de cada tipo de reporte (preliminar, parciales y final).",
          tipo: "PDF",
          paginas: "8 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga y revisa los criterios antes de evaluar.",
            "Aplica la rúbrica correspondiente a cada tipo de reporte.",
            "Registra retroalimentación escrita para reportes 'Por corregir'.",
            "Sube la calificación al sistema en máximo 5 días hábiles.",
          ],
        },
      },
      {
        icon: "book",
        label: "Guía del asesor",
        url: "https://tec.edu.mx/guia",
        detalle: {
          descripcion:
            "Manual completo para asesores de residencia profesional: procedimientos, responsabilidades, tiempos de respuesta y protocolos de comunicación.",
          tipo: "PDF",
          paginas: "20 págs.",
          fecha: "Ene 2026",
          pasos: [
            "Lee el manual completo al inicio de cada período.",
            "Verifica tus responsabilidades en el apartado 3.",
            "Consulta el protocolo de incidencias en la sección 7.",
            "Ante dudas, contacta al Jefe de Vinculación.",
          ],
        },
      },
      {
        icon: "calendar",
        label: "Fechas límite 2025-B",
        url: "https://tec.edu.mx/fechas",
        detalle: {
          descripcion:
            "Cronograma detallado con todas las fechas límite del período: entrega de reportes, evaluaciones, visitas a empresas y cierre de período.",
          tipo: "PDF",
          paginas: "2 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga el cronograma al inicio del período.",
            "Programa visitas a empresas con 2 semanas de anticipación.",
            "Envía recordatorios a tus residentes una semana antes de cada fecha.",
            "Reporta incumplimientos al Jefe de Vinculación en 24 h.",
          ],
        },
      },
    ],
    notas: [
      "Revisar reportes en un máximo de 5 días hábiles tras su recepción.",
      "Notificar al Jefe de Vinculación si un residente no entrega en tiempo.",
      "Los reportes 'Por corregir' deben retroalimentarse de forma detallada.",
    ],
  },

  Residente: {
    color: C.purple,
    herramientas: [
      {
        icon: "edit",
        label: "Plantilla Reporte Preliminar",
        url: "https://tec.edu.mx/plantillas",
        detalle: {
          descripcion:
            "Formato oficial para el reporte de inicio de residencia. Incluye objetivos, diagnóstico, cronograma y descripción de la empresa receptora.",
          tipo: "Word / PDF",
          paginas: "10–15 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga la plantilla en Word desde el portal.",
            "Completa todos los campos marcados en amarillo.",
            "Envía un borrador a tu asesor para revisión previa.",
            "Entrega la versión final firmada en PDF antes de la fecha límite.",
          ],
        },
      },
      {
        icon: "layers",
        label: "Plantilla Reportes Parciales",
        url: "https://tec.edu.mx/plantillas",
        detalle: {
          descripcion:
            "Plantilla para los tres reportes de avance. Cada uno debe documentar actividades del período, logros, dificultades y horas trabajadas.",
          tipo: "Word / PDF",
          paginas: "15–20 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga la plantilla correspondiente (Parcial 1, 2 o 3).",
            "Registra tus actividades semana a semana durante el período.",
            "Incluye evidencias fotográficas o capturas del sistema.",
            "Sube el PDF firmado al portal antes de la fecha límite.",
          ],
        },
      },
      {
        icon: "book-open",
        label: "Plantilla Reporte Final",
        url: "https://tec.edu.mx/plantillas",
        detalle: {
          descripcion:
            "Plantilla del reporte de conclusión de residencia. Debe incluir resultados, conclusiones, recomendaciones y la evaluación de la empresa.",
          tipo: "Word / PDF",
          paginas: "30–50 págs.",
          fecha: "Ago 2025",
          pasos: [
            "Descarga la plantilla del reporte final.",
            "Asegúrate de incluir todos los apartados requeridos (ver índice).",
            "Obtén la firma y sello de tu empresa receptora.",
            "Entrega en PDF y en físico encuadernado según instrucciones.",
          ],
        },
      },
      {
        icon: "book",
        label: "Reglamento de residencias",
        url: "https://tec.edu.mx/reglamento",
        detalle: {
          descripcion:
            "Reglamento institucional vigente. Conoce tus derechos, obligaciones y los procedimientos que rigen tu residencia profesional.",
          tipo: "PDF",
          paginas: "32 págs.",
          fecha: "2024",
          pasos: [
            "Lee el reglamento completo antes de comenzar.",
            "Presta especial atención a los artículos 8, 12 y 15.",
            "Conserva una copia digital para consulta.",
            "Ante dudas, consulta a tu asesor o a Control Escolar.",
          ],
        },
      },
    ],
    notas: [
      "Entrega puntual: los reportes tienen fecha límite inamovible.",
      "Un reporte 'Por corregir' debe corregirse y resubirse antes de 7 días.",
      "Para cualquier duda o incidencia contacta primero a tu asesor.",
    ],
  },
};

// ── Contactos base por rol ────────────────────────────────────────────────────
const CONTACTOS_BASE = {
  "Jefe de Vinculación": [
    {
      nombre: "Coordinación de Residencias",
      correo: "residencias@itm.edu.mx",
      ext: "Ext. 1001",
    },
    { nombre: "Recursos Humanos", correo: "rh@itm.edu.mx", ext: "Ext. 1020" },
    { nombre: "Soporte TI", correo: "soporte@itm.edu.mx", ext: "Ext. 1050" },
  ],
  Asesor: [
    {
      nombre: "Jefe de Vinculación",
      correo: "director@itm.edu.mx",
      ext: "Ext. 1010",
    },
    {
      nombre: "Coordinación Académica",
      correo: "academica@itm.edu.mx",
      ext: "Ext. 1002",
    },
    { nombre: "Soporte TI", correo: "soporte@itm.edu.mx", ext: "Ext. 1050" },
  ],
  Residente: [
    {
      nombre: "Mi Asesor",
      correo: "asesor@itm.edu.mx",
      ext: "Consultar perfil",
    },
    { nombre: "Vinculación", correo: "director@itm.edu.mx", ext: "Ext. 1010" },
    {
      nombre: "Control Escolar",
      correo: "escolar@itm.edu.mx",
      ext: "Ext. 1030",
    },
  ],
};

// ── Componente Modal de recurso ───────────────────────────────────────────────
function RecursoModal({ visible, item, color, onClose }) {
  if (!item) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: "100%",
            maxWidth: 500,
            backgroundColor: "#fff",
            borderRadius: 18,
            overflow: "hidden",
          }}
          onPress={() => {}}
        >
          {/* Header */}
          <View
            style={{
              backgroundColor: color,
              padding: 20,
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={item.icon} size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#fff",
                  lineHeight: 21,
                }}
              >
                {item.label}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
              <Feather name="x" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ maxHeight: 440 }}
            contentContainerStyle={{ padding: 20 }}
          >
            {/* Descripción */}
            <Text
              style={{
                fontSize: 14,
                color: C.textMuted,
                lineHeight: 21,
                marginBottom: 18,
              }}
            >
              {item.detalle.descripcion}
            </Text>

            {/* Metadata */}
            <Row style={{ gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
              {[
                { icon: "file", val: item.detalle.tipo },
                { icon: "book", val: item.detalle.paginas },
                { icon: "clock", val: item.detalle.fecha },
              ].map((m, i) => (
                <Row
                  key={i}
                  style={{
                    gap: 5,
                    backgroundColor: color + "18",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    alignItems: "center",
                  }}
                >
                  <Feather name={m.icon} size={12} color={color} />
                  <Text
                    style={{ fontSize: 12, color: color, fontWeight: "600" }}
                  >
                    {m.val}
                  </Text>
                </Row>
              ))}
            </Row>

            {/* Pasos */}
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: C.text,
                marginBottom: 12,
              }}
            >
              ¿Cómo usarlo?
            </Text>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {item.detalle.pasos.map((paso, i) => (
                <Row key={i} style={{ gap: 12, alignItems: "flex-start" }}>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: color,
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    <Text
                      style={{ fontSize: 11, fontWeight: "800", color: "#fff" }}
                    >
                      {i + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 13,
                      color: C.textMuted,
                      lineHeight: 20,
                    }}
                  >
                    {paso}
                  </Text>
                </Row>
              ))}
            </View>

            {/* Botón abrir */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                Linking.openURL(item.url).catch(() =>
                  Alert.alert("Error", "No se pudo abrir el enlace."),
                );
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: color,
                borderRadius: 12,
                paddingVertical: 14,
              }}
            >
              <Feather name="external-link" size={16} color="#fff" />
              <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>
                Abrir documento
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function Utilerias({
  fotoPerfil,
  setFotoPerfil,
  usuario,
  role,
}) {
  const info = INFO_POR_ROL[role] || INFO_POR_ROL["Residente"];
  const { getFoto, setFoto: setFotoBD } = useFotos() || { getFoto: () => null, setFoto: () => {} };
  const initials = usuario?.nombre
    ? usuario.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  // Modal de recurso
  const [modalItem, setModalItem] = useState(null);

  // Contactos enriquecidos con foto y detalle
  const contactos = (() => {
    if (role === "Residente") {
      const ai = usuario?.asesorInfo;
      const ji = usuario?.jefeInfo;
      return [
        {
          nombre: ai ? ai.nombre : "Mi Asesor",
          correo: ai?.correo || "asesor@itm.edu.mx",
          ext: ai?.departamento || "Asesor Asignado",
          usuarioId: ai?.usuarioId || null,
          detalle: ai
            ? [
                {
                  icon: "briefcase",
                  label: "Departamento",
                  val: ai.departamento || "—",
                },
                {
                  icon: "hash",
                  label: "Núm. empleado",
                  val: ai.numEmpleado || "—",
                },
                { icon: "mail", label: "Correo", val: ai.correo || "—" },
              ]
            : null,
        },
        {
          nombre: ji ? ji.nombre : "Jefe de Vinculación",
          correo: ji?.correo || "director@itm.edu.mx",
          ext: "Vinculación",
          usuarioId: ji?.usuarioId || null,
          detalle: ji
            ? [{ icon: "mail", label: "Correo", val: ji.correo || "—" }]
            : null,
        },
        {
          nombre: "Control Escolar",
          correo: "escolar@itm.edu.mx",
          ext: "Ext. 1030",
          usuarioId: null,
          detalle: null,
        },
      ];
    }
    return (CONTACTOS_BASE[role] || CONTACTOS_BASE["Residente"]).map((c) => ({
      ...c,
      usuarioId: null,
      detalle: null,
    }));
  })();

  const seleccionarFoto = () => {
    if (!globalThis?.document?.createElement) {
      Alert.alert(
        "Foto de perfil",
        "La selección de fotos está disponible en la versión web.",
      );
      return;
    }
    const input = globalThis.document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        Alert.alert("Archivo muy grande", "La imagen debe ser menor a 5 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        // Actualizar estado local
        setFotoPerfil(base64);
        // Guardar en base de datos
        if (usuario?.id) {
          setFotoBD(usuario.id, base64);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const eliminarFoto = () => {
    Alert.alert(
      "Eliminar foto",
      "¿Seguro que quieres eliminar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            // Actualizar estado local
            setFotoPerfil(null);
            // Eliminar de base de datos
            if (usuario?.id) {
              setFotoBD(usuario.id, null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
          Utilerías
        </Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          Perfil, herramientas e información útil
        </Text>
      </View>

      {/* ── Foto de perfil ── */}
      <Card style={{ marginBottom: 20 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: C.text,
            marginBottom: 18,
          }}
        >
          Foto de Perfil
        </Text>
        <Row style={{ alignItems: "center", gap: 24 }}>
          <View style={{ position: "relative" }}>
            {fotoPerfil ? (
              <Image
                source={{ uri: fotoPerfil }}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  borderWidth: 3,
                  borderColor: info.color,
                }}
              />
            ) : (
              <View
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 45,
                  backgroundColor: C.teal,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 3,
                  borderColor: info.color,
                }}
              >
                <Text
                  style={{ fontSize: 28, fontWeight: "800", color: "white" }}
                >
                  {initials}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={seleccionarFoto}
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: info.color,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: "white",
              }}
            >
              <Feather name="camera" size={13} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 17, fontWeight: "800", color: C.text }}>
              {usuario?.nombre || "Usuario"}
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginBottom: 2 }}>
              {usuario?.correo || ""}
            </Text>
            <View
              style={{
                backgroundColor: info.color + "22",
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 4,
                alignSelf: "flex-start",
                marginBottom: 14,
              }}
            >
              <Text
                style={{ fontSize: 11, fontWeight: "700", color: info.color }}
              >
                {role}
              </Text>
            </View>
            <Row style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={seleccionarFoto}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  borderRadius: 9,
                  backgroundColor: info.color,
                }}
              >
                <Feather name="upload" size={13} color="white" />
                <Text
                  style={{ color: "white", fontWeight: "700", fontSize: 13 }}
                >
                  {fotoPerfil ? "Cambiar foto" : "Subir foto"}
                </Text>
              </TouchableOpacity>
              {fotoPerfil && (
                <TouchableOpacity
                  onPress={eliminarFoto}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 14,
                    paddingVertical: 9,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: C.red,
                  }}
                >
                  <Feather name="trash-2" size={13} color={C.red} />
                  <Text
                    style={{ color: C.red, fontWeight: "700", fontSize: 13 }}
                  >
                    Eliminar
                  </Text>
                </TouchableOpacity>
              )}
            </Row>
            <Text style={{ fontSize: 11, color: C.textLight, marginTop: 8 }}>
              JPG, PNG o WEBP · máx. 5 MB ·{" "}
              {fotoPerfil
                ? "✓ Guardada en este dispositivo"
                : "Sin foto guardada"}
            </Text>
          </View>
        </Row>
      </Card>

      {/* ── Recursos y Documentos ── */}
      <Card style={{ marginBottom: 20 }}>
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: info.color + "22",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="tool" size={16} color={info.color} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            Recursos y Documentos
          </Text>
        </Row>
        <View style={{ gap: 10 }}>
          {info.herramientas.map((h, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setModalItem(h)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                backgroundColor: C.bg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  backgroundColor: info.color + "22",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={h.icon} size={16} color={info.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                >
                  {h.label}
                </Text>
                <Text
                  style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}
                >
                  {h.detalle.tipo} · {h.detalle.paginas}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={C.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* ── Contactos Importantes ── */}
      <Card style={{ marginBottom: 20 }}>
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.blueLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="phone" size={16} color={C.blue} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            Contactos Importantes
          </Text>
        </Row>
        <View style={{ gap: 10 }}>
          {contactos.map((c, i) => {
            const fotoContacto = c.usuarioId ? getFoto(c.usuarioId) : null;
            const initC = c.nombre
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);
            return (
              <View
                key={i}
                style={{
                  backgroundColor: C.bg,
                  borderRadius: 12,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                {/* Fila principal */}
                <Row
                  style={{
                    alignItems: "center",
                    gap: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 14,
                  }}
                >
                  {/* Avatar / foto */}
                  {fotoContacto ? (
                    <Image
                      source={{ uri: fotoContacto }}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        borderWidth: 2,
                        borderColor: C.blue + "55",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: C.blueLight,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: C.blue + "33",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: C.blue,
                        }}
                      >
                        {initC}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.text }}
                    >
                      {c.nombre}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}
                    >
                      {c.ext}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`mailto:${c.correo}`)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      backgroundColor: C.blueLight,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="mail" size={15} color={C.blue} />
                  </TouchableOpacity>
                </Row>

                {/* Detalle expandido (solo cuando hay datos) */}
                {c.detalle && (
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingBottom: 12,
                      borderTopWidth: 1,
                      borderTopColor: C.border,
                      paddingTop: 10,
                      gap: 7,
                    }}
                  >
                    {c.detalle.map((d, di) => (
                      <Row key={di} style={{ alignItems: "center", gap: 10 }}>
                        <View
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            backgroundColor: C.blue + "18",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Feather name={d.icon} size={12} color={C.blue} />
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            color: C.textMuted,
                            fontWeight: "600",
                            width: 90,
                          }}
                        >
                          {d.label}
                        </Text>
                        <Text
                          style={{ fontSize: 12, color: C.text, flex: 1 }}
                          numberOfLines={1}
                        >
                          {d.val}
                        </Text>
                      </Row>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Card>

      {/* ── Notas Importantes ── */}
      <Card style={{ marginBottom: 20 }}>
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.amberLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="alert-circle" size={16} color={C.amber} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            Notas Importantes
          </Text>
        </Row>
        <View style={{ gap: 10 }}>
          {info.notas.map((nota, i) => (
            <Row
              key={i}
              style={{
                gap: 10,
                alignItems: "flex-start",
                backgroundColor: C.amberLight,
                borderRadius: 8,
                padding: 12,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: C.amber,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 1,
                  flexShrink: 0,
                }}
              >
                <Text
                  style={{ fontSize: 10, fontWeight: "800", color: "white" }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  flex: 1,
                  lineHeight: 19,
                }}
              >
                {nota}
              </Text>
            </Row>
          ))}
        </View>
      </Card>

      {/* ── Info del sistema ── */}
      <Card>
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.bg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Feather name="info" size={16} color={C.textMuted} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: C.text }}>
            Información del Sistema
          </Text>
        </Row>
        {[
          ["Sistema", "VinculaTec"],
          ["Versión", "v2.5 — 2025-B"],
          ["Desarrollado", "ITVER — Depto. de Sistemas"],
          ["Soporte", "soporte@itm.edu.mx"],
        ].map(([k, v], i) => (
          <Row
            key={i}
            style={{
              paddingVertical: 8,
              borderBottomWidth: i < 3 ? 1 : 0,
              borderBottomColor: C.borderLight,
            }}
          >
            <Text
              style={{
                flex: 1,
                fontSize: 13,
                color: C.textMuted,
                fontWeight: "600",
              }}
            >
              {k}
            </Text>
            <Text style={{ fontSize: 13, color: C.text }}>{v}</Text>
          </Row>
        ))}
      </Card>

      {/* ── Modal recurso ── */}
      <RecursoModal
        visible={!!modalItem}
        item={modalItem}
        color={info.color}
        onClose={() => setModalItem(null)}
      />
    </ScrollView>
  );
}
