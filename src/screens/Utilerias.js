import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  Animated,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card } from "../components";
import { useFotos } from "../context/FotosContext";



// ── Toggle de modo oscuro (reemplaza al Switch nativo que es invisible en dark) ──
function ToggleCard({ isDark, toggleDark, TXT, TXTM, CARD, BORD }) {
  const anim = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  // Track: de gris claro a teal
  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["#CBD5E1", "#0D9488"],
  });
  // Thumb: se desliza de izquierda a derecha
  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22],
  });

  return (
    <View
      style={{
        marginBottom: 20,
        backgroundColor: CARD,
        borderColor: BORD,
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: isDark ? "#334155" : "#FEF3C7",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather
            name={isDark ? "moon" : "sun"}
            size={16}
            color={isDark ? "#94A3B8" : "#F59E0B"}
          />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
          Apariencia
        </Text>
      </View>

      {/* Toggle row */}
      <TouchableOpacity
        onPress={toggleDark}
        activeOpacity={0.85}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 14,
          backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: BORD,
        }}
      >
        {/* Ícono + texto */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: isDark ? "#1E3A5F" : "#FEF3C7",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather
              name={isDark ? "moon" : "sun"}
              size={20}
              color={isDark ? "#60A5FA" : "#F59E0B"}
            />
          </View>
          <View>
            <Text style={{ fontSize: 14, fontWeight: "700", color: TXT }}>
              Modo {isDark ? "oscuro" : "claro"}
            </Text>
            <Text style={{ fontSize: 11, color: TXTM, marginTop: 2 }}>
              {isDark ? "Tema oscuro activado" : "Tema claro activado"}
            </Text>
          </View>
        </View>

        {/* Toggle personalizado — siempre visible */}
        <TouchableOpacity onPress={toggleDark} activeOpacity={0.9}>
          <Animated.View
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              backgroundColor: trackBg,
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDark ? "#0D9488" : "#CBD5E1",
            }}
          >
            <Animated.View
              style={{
                position: "absolute",
                left: thumbX,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "white",
                shadowColor: "#000",
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 2,
              }}
            />
          </Animated.View>
        </TouchableOpacity>
      </TouchableOpacity>

      <Text
        style={{
          fontSize: 11,
          color: TXTM,
          marginTop: 10,
          textAlign: "center",
        }}
      >
        Tu preferencia se guarda automáticamente
      </Text>
    </View>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function Utilerias({ usuario }) {
  
  const { isDark, toggleDark, colors: C } = useTheme();
  const T = C; // Colores dinámicos según el modo
  const { getFoto, setFoto } = useFotos?.() || {};

  // ── Datos por rol ─────────────────────────────────────────────
  const ROL_INFO = {
    residente: {
      label: "Residente",
      color: C.teal,
      icon: "user",
      herramientas: [
        {
          label: "Guía de Residencias Profesionales",
          icon: "book-open",
          detalle: {
            tipo: "PDF",
            paginas: "32 páginas",
            descripcion:
              "Manual completo del proceso de residencias: requisitos de ingreso, reglamento, formatos oficiales y calendario.",
            version: "Actualización enero 2026",
          },
        },
        {
          label: "Formato de Reporte Preliminar",
          icon: "file-text",
          detalle: {
            tipo: "DOCX",
            paginas: "4 páginas",
            descripcion:
              "Plantilla oficial del reporte preliminar.",
            version: "v3.1 – ITM",
          },
        },
      ],
      notas: [
        "Entrega tu reporte preliminar antes del 15 de febrero.",
        "Los reportes parciales deben entregarse al final de cada bimestre.",
      ],
    },

    asesor: {
      label: "Asesor",
      color: C.blue,
      icon: "briefcase",
      herramientas: [
        {
          label: "Guía de Evaluación",
          icon: "check-square",
          detalle: {
            tipo: "PDF",
            paginas: "18 páginas",
            descripcion:
              "Criterios oficiales de evaluación.",
            version: "v2.2",
          },
        },
      ],
      notas: [
        "Retroalimenta reportes en máximo 7 días.",
      ],
    },

    jefe: {
      label: "Jefe de Vinculación",
      color: C.amber,
      icon: "shield",
      herramientas: [
        {
          label: "Directorio de Empresas",
          icon: "database",
          detalle: {
            tipo: "PDF",
            paginas: "8 páginas",
            descripcion:
              "Listado actualizado de empresas vinculadas.",
            version: "Abril 2026",
          },
        },
      ],
      notas: [
        "Valida convenios antes del inicio del semestre.",
      ],
    },
  };

  const [modalItem, setModalItem] = useState(null);

  const rolKey =
    usuario?.rol?.toLowerCase() === "jefe"
      ? "jefe"
      : usuario?.rol?.toLowerCase() || "residente";

  const info = ROL_INFO[rolKey] || ROL_INFO.residente;

  const iniciales = usuario
    ? `${(usuario.nombre || "")[0] || ""}${(usuario.apellidos || "")[0] || ""}`.toUpperCase()
    : "??";

  const fotoPerfil = getFoto?.(usuario?.id);

  // Redimensiona y comprime la imagen antes de guardarla.
  // Sin esto, fotos de cámara (5-15 MB) superan el límite de 2 MB del backend.
  const resizeAndCompress = (dataUrl) =>
    new Promise((resolve) => {
      const MAX_PX = 400; // máximo 400×400 px para foto de perfil
      const QUALITY = 0.82; // calidad JPEG

      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = globalThis.document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = dataUrl;
    });

  const selectPhoto = () => {
    if (typeof globalThis.document === "undefined") return;
    const input = globalThis.document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const compressed = await resizeAndCompress(ev.target.result);
          setFoto?.(usuario?.id, compressed);
        } catch {
          // Si falla la compresión (ej. entorno sin canvas), intenta con el original
          setFoto?.(usuario?.id, ev.target.result);
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const removePhoto = () => {
    Alert.alert(
      "Eliminar foto",
      "¿Seguro que quieres eliminar tu foto de perfil?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => setFoto?.(usuario?.id, null),
        },
      ],
    );
  };

  // Colores dinámicos: si el modo oscuro está activo, usa la paleta T; si no, usa C
  const BG = T.bg;
  const CARD = T.card;
  const BORD = T.border;
  const TXT = T.text;
  const TXTS = T.textSub;
  const TXTM = T.textMuted;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BG }}
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Foto de perfil ── */}
      <Card
        style={{ marginBottom: 20, backgroundColor: CARD, borderColor: BORD }}
      >
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
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
            <Feather name="user" size={16} color={info.color} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
            Mi Perfil
          </Text>
        </Row>

        <Row style={{ alignItems: "center", gap: 16 }}>
          {/* Avatar */}
          <View style={{ position: "relative" }}>
            {fotoPerfil ? (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  overflow: "hidden",
                  borderWidth: 3,
                  borderColor: info.color,
                }}
              >
                {/* eslint-disable-next-line react-native/no-inline-styles */}
                <Image
                 source={{ uri: fotoPerfil }}
                 style={{ width: 72, height: 72 }}
                 />
              </View>
            ) : (
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: info.color + "22",
                  borderWidth: 3,
                  borderColor: info.color,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "800", color: info.color }}
                >
                  {iniciales}
                </Text>
              </View>
            )}
            <TouchableOpacity
              onPress={selectPhoto}
              style={{
                position: "absolute",
                bottom: -2,
                right: -2,
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: info.color,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: CARD,
              }}
            >
              <Feather name="camera" size={11} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: "800", color: TXT }}>
              {usuario?.nombre} {usuario?.apellidos}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: info.color,
                fontWeight: "600",
                marginTop: 2,
              }}
            >
              {info.label}
            </Text>
            <Text style={{ fontSize: 11, color: TXTM, marginTop: 2 }}>
              {usuario?.correo}
            </Text>
          </View>
        </Row>

        <Row style={{ gap: 8, marginTop: 14 }}>
          <TouchableOpacity
            onPress={selectPhoto}
            style={{
              flex: 1,
              paddingVertical: 9,
              borderRadius: 8,
              backgroundColor: info.color + "22",
              alignItems: "center",
            }}
          >
            <Row style={{ alignItems: "center", gap: 6 }}>
              <Feather name="upload" size={13} color={info.color} />
              <Text
                style={{ fontSize: 12, fontWeight: "700", color: info.color }}
              >
                {fotoPerfil ? "Cambiar foto" : "Subir foto"}
              </Text>
            </Row>
          </TouchableOpacity>
          {fotoPerfil && (
            <TouchableOpacity
              onPress={removePhoto}
              style={{
                paddingVertical: 9,
                paddingHorizontal: 14,
                borderRadius: 8,
                backgroundColor: C.redLight,
                alignItems: "center",
              }}
            >
              <Feather name="trash-2" size={13} color={C.red} />
            </TouchableOpacity>
          )}
        </Row>

        <Text
          style={{
            fontSize: 10,
            color: TXTM,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          Formatos: JPG, PNG, WEBP · Máx. 5 MB ·{" "}
          {fotoPerfil ? "✓ Foto guardada" : "Sin foto guardada"}
        </Text>
      </Card>

      {/* ── Apariencia (Modo oscuro) ── */}
      <ToggleCard
        isDark={isDark}
        toggleDark={toggleDark}
        TXT={TXT}
        TXTM={TXTM}
        CARD={CARD}
        BORD={BORD}
      />

      {/* ── Recursos y Documentos ── */}
      <Card
        style={{ marginBottom: 20, backgroundColor: CARD, borderColor: BORD }}
      >
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
          <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
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
                backgroundColor: isDark ? "#0F172A" : C.bg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: BORD,
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
                <Text style={{ fontSize: 13, fontWeight: "600", color: TXT }}>
                  {h.label}
                </Text>
                <Text style={{ fontSize: 11, color: TXTM, marginTop: 2 }}>
                  {h.detalle.tipo} · {h.detalle.paginas}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color={TXTM} />
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* ── Contactos importantes ── */}
      <Card
        style={{ marginBottom: 20, backgroundColor: CARD, borderColor: BORD }}
      >
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 16 }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              backgroundColor: C.tealLight,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="phone" size={16} color={C.teal} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
            Contactos Importantes
          </Text>
        </Row>
        <View style={{ gap: 10 }}>
          {[
            {
              nombre: usuario?.asesorInfo?.nombre || "Asesor asignado",
              correo: usuario?.asesorInfo?.correo || "—",
              rol: "Asesor Académico",
              icon: "briefcase",
              color: C.blue,
            },
            {
              nombre: usuario?.jefeInfo?.nombre || "Jefe de Vinculación",
              correo: usuario?.jefeInfo?.correo || "—",
              rol: "Jefe de Vinculación",
              icon: "shield",
              color: C.amber,
            },
            {
              nombre: "Control Escolar",
              correo: "control.escolar@itm.edu.mx",
              rol: "Servicios Escolares",
              icon: "home",
              color: C.teal,
            },
          ].map((c, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 12,
                backgroundColor: isDark ? "#0F172A" : C.bg,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: BORD,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  backgroundColor: c.color + "22",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather name={c.icon} size={16} color={c.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "700", color: TXT }}>
                  {c.nombre}
                </Text>
                <Text
                  style={{ fontSize: 11, color: c.color, fontWeight: "600" }}
                >
                  {c.rol}
                </Text>
                <Text style={{ fontSize: 11, color: TXTM, marginTop: 2 }}>
                  {c.correo}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* ── Notas del rol ── */}
      {info.notas?.length > 0 && (
        <Card
          style={{ marginBottom: 20, backgroundColor: CARD, borderColor: BORD }}
        >
          <Row style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
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
            <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
              Recordatorios
            </Text>
          </Row>
          <View style={{ gap: 8 }}>
            {info.notas.map((n, i) => (
              <Row key={i} style={{ alignItems: "flex-start", gap: 10 }}>
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: C.amber,
                    marginTop: 6,
                  }}
                />
                <Text
                  style={{ flex: 1, fontSize: 13, color: TXTS, lineHeight: 20 }}
                >
                  {n}
                </Text>
              </Row>
            ))}
          </View>
        </Card>
      )}

      {/* ── Información del sistema ── */}
      <Card style={{ backgroundColor: CARD, borderColor: BORD }}>
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 14 }}>
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
            <Feather name="info" size={16} color={C.blue} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: TXT }}>
            Sistema
          </Text>
        </Row>
        {[
          ["Versión", "VinculaTec 2.0"],
          ["Institución", "Instituto Tecnológico de Minatitlán"],
          ["Ciclo", "Enero – Junio 2026"],
          ["Soporte", "soporte@itm.edu.mx"],
        ].map(([label, value]) => (
          <Row
            key={label}
            style={{
              justifyContent: "space-between",
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: BORD,
            }}
          >
            <Text style={{ fontSize: 12, color: TXTM }}>{label}</Text>
            <Text style={{ fontSize: 12, fontWeight: "600", color: TXTS }}>
              {value}
            </Text>
          </Row>
        ))}
      </Card>

      {/* ── Modal de recursos ── */}
      <Modal
        visible={!!modalItem}
        transparent
        animationType="fade"
        onRequestClose={() => setModalItem(null)}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "#00000088",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
          onPress={() => setModalItem(null)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 400,
              backgroundColor: CARD,
              borderRadius: 18,
              padding: 24,
              borderWidth: 1,
              borderColor: BORD,
            }}
          >
            {/* Ícono + título */}
            <Row style={{ alignItems: "center", gap: 14, marginBottom: 16 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 13,
                  backgroundColor: info.color + "22",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Feather
                  name={modalItem?.icon || "file"}
                  size={22}
                  color={info.color}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: TXT }}>
                  {modalItem?.label}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    color: info.color,
                    fontWeight: "600",
                    marginTop: 2,
                  }}
                >
                  {modalItem?.detalle?.tipo} · {modalItem?.detalle?.paginas}
                </Text>
              </View>
            </Row>

            {/* Descripción */}
            <View
              style={{
                backgroundColor: isDark ? "#0F172A" : C.bg,
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 13, color: TXTS, lineHeight: 20 }}>
                {modalItem?.detalle?.descripcion}
              </Text>
            </View>

            {/* Versión */}
            <Row style={{ alignItems: "center", gap: 8, marginBottom: 20 }}>
              <Feather name="tag" size={13} color={TXTM} />
              <Text style={{ fontSize: 11, color: TXTM }}>
                {modalItem?.detalle?.version}
              </Text>
            </Row>

            {/* Botones */}
            <Row style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setModalItem(null)}
                style={{
                  flex: 1,
                  paddingVertical: 11,
                  borderRadius: 9,
                  borderWidth: 1,
                  borderColor: BORD,
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: TXTM }}>
                  Cerrar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  setModalItem(null);
                  Alert.alert(
                    "Recurso",
                    "El acceso a documentos se habilitará cuando el sistema esté en producción.",
                  );
                }}
                style={{
                  flex: 2,
                  paddingVertical: 11,
                  borderRadius: 9,
                  backgroundColor: info.color,
                  alignItems: "center",
                }}
              >
                <Row style={{ alignItems: "center", gap: 7 }}>
                  <Feather name="download" size={14} color="white" />
                  <Text
                    style={{ fontSize: 14, fontWeight: "700", color: "white" }}
                  >
                    Descargar
                  </Text>
                </Row>
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
