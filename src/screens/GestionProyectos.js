import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Badge } from "../components";
import apiClient from "../utils/apiClient";

const PHASE_COLUMNS = [
  { id: "desarrollo", label: "En Desarrollo", color: C.amber,  bg: C.amberLight  },
  { id: "revision",   label: "En Revisión",   color: C.purple, bg: C.purpleLight },
  { id: "concluido",  label: "Concluido",      color: C.green,  bg: C.greenLight  },
];

const PRIORITY_STYLE = {
  Alta:  { color: C.red,   bg: C.redLight   },
  Media: { color: C.amber, bg: C.amberLight },
  Baja:  { color: C.green, bg: C.greenLight },
};

export default function GestionProyectos() {
  const [proyectos,        setProyectos]        = useState([]);
  const [active,           setActive]           = useState(null);
  const [showFilter,       setShowFilter]       = useState(false);
  const [priorityFilter,   setPriorityFilter]   = useState("Todas");
  const [editingCard,      setEditingCard]      = useState(null);
  const [editForm,         setEditForm]         = useState({ title: "" });

  useEffect(() => {
    apiClient.get("/api/jefe/proyectos").then((res) => {
      if (res.ok && res.body?.ok) setProyectos(res.body.proyectos);
    });
  }, []);

  const columns = PHASE_COLUMNS.map((col) => ({
    ...col,
    cards: proyectos.filter((p) =>
      p.phase === col.id &&
      (priorityFilter === "Todas" || p.priority === priorityFilter)
    ),
  }));

  const openEdit = (card) => {
    setEditingCard(card);
    setEditForm({ title: card.title });
  };

  const saveEdit = async () => {
    if (!editForm.title.trim()) return;
    const res = await apiClient.put(`/api/jefe/proyectos/${editingCard.id}`, { title: editForm.title.trim() });
    if (res.ok) setProyectos((prev) => prev.map((p) => p.id === editingCard.id ? { ...p, title: editForm.title.trim() } : p));
    setEditingCard(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        {/* Header */}
        <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>Gestión de Proyectos</Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
              Tablero Kanban · {proyectos.length} proyectos activos
            </Text>
          </View>
          <View style={{ position: "relative" }}>
            <TouchableOpacity onPress={() => setShowFilter(!showFilter)} style={{ flexDirection: "row", alignItems: "center", gap: 5, borderWidth: 1, borderColor: priorityFilter !== "Todas" ? C.teal : C.border, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 9, backgroundColor: priorityFilter !== "Todas" ? C.tealLighter : C.card }}>
              <Feather name="filter" size={13} color={C.textMuted} />
              <Text style={{ fontSize: 12, color: priorityFilter !== "Todas" ? C.teal : C.textMuted, fontWeight: "600" }}>Filtrar</Text>
            </TouchableOpacity>
            {showFilter && (
              <View style={{ position: "absolute", top: 42, right: 0, width: 190, backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, zIndex: 50 }}>
                <Text style={{ fontSize: 11, color: C.textMuted, fontWeight: "700", marginBottom: 8 }}>Prioridad</Text>
                {["Todas", "Alta", "Media", "Baja"].map((option) => (
                  <TouchableOpacity key={option} onPress={() => { setPriorityFilter(option); setShowFilter(false); }} style={{ paddingVertical: 7 }}>
                    <Text style={{ fontSize: 12, color: priorityFilter === option ? C.teal : C.textSub, fontWeight: priorityFilter === option ? "800" : "600" }}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Row>

        {/* Kanban */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row style={{ gap: 14, alignItems: "flex-start" }}>
            {filteredColumns.map((col) => (
              <View key={col.id} style={{ width: 270, backgroundColor: "#F8FAFC", borderRadius: 14, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
                <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.card }}>
                  <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
                    <Row style={{ alignItems: "center", gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: col.color }} />
                      <Text style={{ fontSize: 13, fontWeight: "800", color: C.text }}>{col.label}</Text>
                    </Row>
                    <View style={{ backgroundColor: col.bg, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: col.color }}>{col.cards.length}</Text>
                    </View>
                  </Row>
                </View>

                <View style={{ padding: 10, gap: 10 }}>
                  {col.cards.map((card, i) => {
                    const ps = PRIORITY_STYLE[card.priority] || PRIORITY_STYLE.Media;
                    const tags = card.tags ? card.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
                    return (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => setActive(active === card.id ? null : card.id)}
                      activeOpacity={0.85}
                      style={{ backgroundColor: C.card, borderRadius: 11, borderWidth: 1, borderColor: active === card.id ? col.color : C.border, padding: 14 }}
                    >
                      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Badge text={card.priority || "Media"} color={ps.color} bg={ps.bg} />
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); openEdit(card); }} style={{ padding: 4 }}>
                          <Feather name="edit-2" size={13} color={C.textLight} />
                        </TouchableOpacity>
                      </Row>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 10, lineHeight: 18 }}>{card.title}</Text>
                      {tags.length > 0 && (
                        <Row style={{ flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                          {tags.map((tag, ti) => (
                            <View key={ti} style={{ backgroundColor: C.bg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.border }}>
                              <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: "600" }}>{tag}</Text>
                            </View>
                          ))}
                        </Row>
                      )}
                      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: "600" }} numberOfLines={1}>{card.company}</Text>
                        {card.residenteIniciales && (
                          <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.teal, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 9, color: "white", fontWeight: "800" }}>{card.residenteIniciales}</Text>
                          </View>
                        )}
                      </Row>
                      {card.asesor && (
                        <Row style={{ alignItems: "center", gap: 5, backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }}>
                          <Feather name="user-check" size={11} color={C.teal} />
                          <Text style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}>{card.asesor}</Text>
                        </Row>
                      )}
                    </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </Row>
        </ScrollView>
      </ScrollView>

      {/* Modal edición */}
      <Modal visible={!!editingCard} transparent animationType="fade">
        <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center" }} onPress={() => setEditingCard(null)}>
          <Pressable style={{ width: 420, backgroundColor: C.card, borderRadius: 16, padding: 28, borderWidth: 1, borderColor: C.border }} onPress={(e) => e.stopPropagation()}>
            <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>Editar Proyecto</Text>
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Nombre del proyecto</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingCard(null)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <View style={{ marginBottom: 22 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Nombre del Proyecto</Text>
              <TextInput
                value={editForm.title}
                onChangeText={(v) => setEditForm({ ...editForm, title: v })}
                placeholder="Nombre del proyecto"
                placeholderTextColor={C.textLight}
                style={{ padding: 11, borderRadius: 8, borderWidth: 1, borderColor: C.border, fontSize: 14, color: C.text, backgroundColor: "#FAFAFA" }}
              />
            </View>
            <Row style={{ gap: 10 }}>
              <TouchableOpacity onPress={() => setEditingCard(null)} style={{ flex: 1, paddingVertical: 11, borderRadius: 9, borderWidth: 1, borderColor: C.border, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.textMuted }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={saveEdit} style={{ flex: 2, paddingVertical: 11, borderRadius: 9, backgroundColor: C.teal, alignItems: "center" }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>Guardar Cambios</Text>
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
