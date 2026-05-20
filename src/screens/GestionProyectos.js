import { useState, useEffect, useRef } from "react";
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
import C from "../constants/colors";
import { Row, Badge } from "../components";
import apiClient from "../utils/apiClient";

const PHASE_COLUMNS = [
  {
    id: "desarrollo",
    label: "En Desarrollo",
    color: C.amber,
    bg: C.amberLight,
  },
  { id: "revision", label: "En Revisión", color: C.purple, bg: C.purpleLight },
  { id: "concluido", label: "Concluido", color: C.green, bg: C.greenLight },
];

const PRIORITY_STYLE = {
  Alta: { color: C.red, bg: C.redLight },
  Media: { color: C.amber, bg: C.amberLight },
  Baja: { color: C.green, bg: C.greenLight },
};

// Tarjeta individual con animación de entrada
function ProjectCard({
  card,
  index,
  col,
  active,
  onPress,
  onEdit,
  onAprobarAvance,
}) {
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

  const ps = PRIORITY_STYLE[card.priority] || PRIORITY_STYLE.Media;
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
          // Sombra sutil en tarjeta activa
          ...(active
            ? {
                shadowColor: col.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.18,
                shadowRadius: 6,
              }
            : {}),
        }}
      >
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
            {card.company}
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
              <Text style={{ fontSize: 9, color: "white", fontWeight: "800" }}>
                {card.residenteIniciales}
              </Text>
            </View>
          )}
        </Row>

        {card.asesor && (
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
        )}

        {/* Botón de aprobar avance si hay solicitud pendiente */}
        {card.solicitud_avance && (
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
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function GestionProyectos() {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm] = useState({ title: "" });
  const [saving, setSaving] = useState(false);

  const fetchProyectos = () => {
    setLoading(true);
    apiClient.get("/api/jefe/proyectos").then((res) => {
      if (res.ok && res.body?.ok) setProyectos(res.body.proyectos);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchProyectos();
  }, []);

  // "columns" contiene las columnas con sus tarjetas filtradas — era "filteredColumns" antes (bug)
  const columns = PHASE_COLUMNS.map((col) => ({
    ...col,
    cards: proyectos.filter(
      (p) =>
        p.phase === col.id &&
        (priorityFilter === "Todas" || p.priority === priorityFilter),
    ),
  }));

  const openEdit = (card) => {
    setEditingCard(card);
    setEditForm({ title: card.title });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    setSaving(true);
    const res = await apiClient.put(`/api/jefe/proyectos/${editingCard.id}`, {
      title: editForm.title.trim(),
    });
    if (res.ok)
      setProyectos((prev) =>
        prev.map((p) =>
          p.id === editingCard.id ? { ...p, title: editForm.title.trim() } : p,
        ),
      );
    setSaving(false);
    setEditingCard(null);
  };

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
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
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
              Tablero Kanban ·{" "}
              {loading ? "…" : `${proyectos.length} proyectos activos`}
            </Text>
          </View>
          <Row style={{ gap: 10 }}>
            {/* Filtro */}
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
                    color: priorityFilter !== "Todas" ? C.teal : C.textMuted,
                    fontWeight: "600",
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
                          color: priorityFilter === option ? C.teal : C.textSub,
                          fontWeight: priorityFilter === option ? "800" : "600",
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

        {/* Estado de carga */}
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
                    backgroundColor: "#F8FAFC",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: C.border,
                    overflow: "hidden",
                  }}
                >
                  {/* Header columna */}
                  <View
                    style={{
                      padding: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: C.border,
                      backgroundColor: C.card,
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

                  {/* Tarjetas */}
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

      {/* Modal edición */}
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
              <View>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                >
                  Editar Proyecto
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}
                >
                  Nombre del proyecto
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingCard(null)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <View style={{ marginBottom: 22 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Nombre del Proyecto
              </Text>
              <TextInput
                value={editForm.title}
                onChangeText={(v) => setEditForm({ ...editForm, title: v })}
                placeholder="Nombre del proyecto"
                placeholderTextColor={C.textLight}
                style={{
                  padding: 11,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border,
                  fontSize: 14,
                  color: C.text,
                  backgroundColor: "#FAFAFA",
                }}
              />
            </View>
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
                  backgroundColor: saving ? C.textLight : C.teal,
                  alignItems: "center",
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
    </View>
  );
}
