import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Row from "./Row";
import { useNotificaciones } from "../context/NotificacionesContext";

// Metadatos de búsqueda: cada sección tiene palabras clave adicionales
const SECTION_META = {
  dashboard: {
    desc: "Inicio y métricas",
    keywords: [
      "inicio",
      "resumen",
      "estadísticas",
      "métricas",
      "home",
      "overview",
      "principal",
    ],
  },
  empresas: {
    desc: "Gestión de empresas",
    keywords: [
      "empresa",
      "negocio",
      "compañía",
      "organización",
      "convenio",
      "colaboradora",
      "industria",
    ],
  },
  proyectos: {
    desc: "Proyectos de residencia",
    keywords: [
      "proyecto",
      "residencia",
      "trabajo",
      "programa",
      "actividad",
      "asignatura",
    ],
  },
  asignacion: {
    desc: "Asignar asesores",
    keywords: [
      "asignar",
      "asesor",
      "alumno",
      "residente",
      "designar",
      "vincular",
    ],
  },
  fuentes: {
    desc: "Validar fuentes",
    keywords: [
      "fuentes",
      "validar",
      "verificar",
      "referencias",
      "bibliografía",
    ],
  },
  seguimiento: {
    desc: "Monitoreo de avances",
    keywords: [
      "seguimiento",
      "avance",
      "progreso",
      "monitoreo",
      "status",
      "estado",
      "tracking",
    ],
  },
  notificaciones: {
    desc: "Alertas y avisos",
    keywords: ["notificaciones", "alertas", "avisos", "mensajes", "campana"],
  },
  calendario: {
    desc: "Agenda y citas",
    keywords: [
      "calendario",
      "cita",
      "agenda",
      "horario",
      "fecha",
      "reunión",
      "evento",
    ],
  },
  utilerias: {
    desc: "Perfil y configuración",
    keywords: [
      "utilería",
      "perfil",
      "configuración",
      "ajustes",
      "cuenta",
      "foto",
      "usuario",
      "contraseña",
    ],
  },
  "reporte-preliminar": {
    desc: "Primer entrega formal",
    keywords: [
      "reporte preliminar",
      "informe inicial",
      "documento",
      "primer entrega",
      "anteproyecto",
    ],
  },
  "reportes-parciales": {
    desc: "Entregas parciales",
    keywords: [
      "reporte parcial",
      "avance",
      "entrega parcial",
      "bimestral",
      "mensual",
    ],
  },
  "reporte-final": {
    desc: "Informe de cierre",
    keywords: [
      "reporte final",
      "informe final",
      "egreso",
      "conclusión",
      "cierre",
      "titulación",
    ],
  },
  "reporte-grupo": {
    desc: "Todos los reportes",
    keywords: ["reportes", "informes", "documentos", "entregables"],
  },
};

export default function TopBar({ activeNav, navItems = [], setActiveNav }) {
  const { isDark, colors: C } = useTheme();
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const { unreadCount } = useNotificaciones() || { unreadCount: 0 };

  const findNavItem = (items, id) => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.group && item.children) {
        const child = item.children.find((c) => c.id === id);
        if (child) return child;
      }
    }
    return null;
  };

  const currentItem = findNavItem(navItems, activeNav);
  const pageTitle = currentItem ? currentItem.label : "Dashboard";
  const hasNotif = navItems.some((item) => item.id === "notificaciones");

  // Aplana todos los ítems de navegación (incluyendo hijos de grupos)
  const getAllItems = () => {
    const flat = [];
    for (const item of navItems) {
      if (!item.group) {
        flat.push(item);
      } else {
        if (SECTION_META[item.id]) flat.push({ ...item, _isGroup: true });
        if (item.children) flat.push(...item.children);
      }
    }
    return flat;
  };

  const handleSearch = (text) => {
    setQuery(text);
    if (!text.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const q = text.trim().toLowerCase();
    const allItems = getAllItems();
    const matched = allItems.filter((item) => {
      const meta = SECTION_META[item.id] || {};
      const label = item.label.toLowerCase();
      const desc = (meta.desc || "").toLowerCase();
      const kwMatch = (meta.keywords || []).some((kw) =>
        kw.toLowerCase().includes(q),
      );
      return label.includes(q) || desc.includes(q) || kwMatch;
    });
    setResults(matched);
    setShowResults(true);
  };

  const handleSelectResult = (id) => {
    if (setActiveNav) setActiveNav(id);
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowResults(false);
      setQuery("");
      setResults([]);
    }, 180);
  };

  return (
    <View
      style={{
        backgroundColor: isDark ? "#161B22" : C.card,
        borderBottomWidth: 1,
        borderBottomColor: C.border,
        paddingHorizontal: 24,
        paddingVertical: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 100,
      }}
    >
      {/* Breadcrumb + título */}
      <View>
        <Row style={{ alignItems: "center", gap: 5 }}>
          <Text style={{ fontSize: 11, color: C.textLight }}>VinculaTec</Text>
          <Feather name="chevron-right" size={11} color={C.textLight} />
          <Text style={{ fontSize: 11, color: C.textMuted }}>{pageTitle}</Text>
        </Row>
        <Text
          style={{
            fontSize: 17,
            fontWeight: "800",
            color: C.text,
            marginTop: 1,
          }}
        >
          {pageTitle}
        </Text>
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}>
          Departamento de Sistemas
        </Text>
      </View>

      <Row style={{ alignItems: "center", gap: 12 }}>
        {/* ── Buscador con dropdown ── */}
        <View style={{ position: "relative", zIndex: 200 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              backgroundColor: isDark ? "#0D1117" : C.bg,
              borderRadius: 9,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderWidth: 1,
              borderColor: showResults ? C.teal : C.border,
            }}
          >
            <Feather
              name="search"
              size={13}
              color={showResults ? C.teal : C.textLight}
            />
            <TextInput
              value={query}
              onChangeText={handleSearch}
              onBlur={handleBlur}
              placeholder="Buscar sección..."
              style={{
                fontSize: 13,
                color: C.text,
                width: 160,
                outlineStyle: "none",
              }}
              placeholderTextColor={C.textLight}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                }}
              >
                <Feather name="x" size={13} color={C.textLight} />
              </TouchableOpacity>
            )}
          </View>

          {/* Dropdown de resultados */}
          {showResults && (
            <View
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                marginTop: 6,
                backgroundColor: isDark ? "#161B22" : C.card,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                minWidth: 260,
                maxHeight: 320,
                overflow: "hidden",
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 6 },
                elevation: 10,
              }}
            >
              <View
                style={{
                  paddingHorizontal: 14,
                  paddingTop: 11,
                  paddingBottom: 7,
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderLight,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    color: C.textLight,
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {results.length === 0
                    ? "Sin resultados"
                    : `${results.length} resultado${results.length !== 1 ? "s" : ""}`}
                </Text>
                <Text
                  style={{ fontSize: 10, color: C.teal, fontWeight: "600" }}
                >
                  "{query}"
                </Text>
              </View>

              {results.length === 0 ? (
                <View style={{ padding: 20, alignItems: "center", gap: 8 }}>
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: C.bg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="search" size={18} color={C.textLight} />
                  </View>
                  <Text
                    style={{
                      color: C.textMuted,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Nada encontrado
                  </Text>
                  <Text
                    style={{
                      color: C.textLight,
                      fontSize: 11,
                      textAlign: "center",
                    }}
                  >
                    Intenta con otro término o navega desde el menú lateral
                  </Text>
                </View>
              ) : (
                results.map((item) => {
                  const meta = SECTION_META[item.id] || {};
                  const active = activeNav === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => handleSelectResult(item.id)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        backgroundColor: active ? C.tealLighter : "transparent",
                        borderBottomWidth: 1,
                        borderBottomColor: C.borderLight,
                      }}
                    >
                      <View
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          backgroundColor: active ? C.tealLight : C.bg,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <Feather
                          name={item.icon}
                          size={13}
                          color={active ? C.teal : C.textMuted}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "600",
                            color: active ? C.teal : C.text,
                          }}
                        >
                          {item.label}
                        </Text>
                        {meta.desc && (
                          <Text
                            style={{ fontSize: 11, color: C.textLight }}
                            numberOfLines={1}
                          >
                            {meta.desc}
                          </Text>
                        )}
                      </View>
                      {active ? (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: C.teal,
                          }}
                        />
                      ) : (
                        <Feather
                          name="corner-down-right"
                          size={11}
                          color={C.textLight}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}
        </View>

        {/* ── Campana de notificaciones ── */}
        <TouchableOpacity
          onPress={() =>
            hasNotif && setActiveNav && setActiveNav("notificaciones")
          }
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: C.bg,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name="bell" size={15} color={C.textMuted} />
          {unreadCount > 0 && (
            <View
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                minWidth: 16,
                height: 16,
                backgroundColor: C.red,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 3,
                borderWidth: 1.5,
                borderColor: "white",
              }}
            >
              <Text style={{ color: "white", fontSize: 8, fontWeight: "800" }}>
                {unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Row>
    </View>
  );
}
