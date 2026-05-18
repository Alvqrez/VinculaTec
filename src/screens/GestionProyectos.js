import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../constants/colors";
import { Row, Badge } from "../components";

// Solo proyectos ya aprobados: En Desarrollo, En Revisión, Concluido
const INITIAL_COLUMNS = [
  {
    id: "desarrollo", label: "En Desarrollo", color: C.amber, bg: C.amberLight,
    cards: [
      { id: "c1", title: "Sistema ERP Módulo RRHH",    company: "Grupo Industrial MX",   companyIcon: "tool",      student: "A.L", studentBg: "#059669", priority: "Alta",  priorityColor: C.red,   priorityBg: C.redLight,   tags: ["Python", "Django", "PostgreSQL"], asesor: "Dr. Martínez" },
      { id: "c2", title: "Portal de Clientes Web",     company: "Tecnológica del Norte",  companyIcon: "cpu",       student: "J.P", studentBg: "#DC2626", priority: "Media", priorityColor: C.amber, priorityBg: C.amberLight, tags: ["React", "GraphQL"],               asesor: "Dr. Herrera"  },
      { id: "c3", title: "Automatización de Reportes", company: "BioFarma México",        companyIcon: "activity",  student: "L.V", studentBg: "#7C3AED", priority: "Baja",  priorityColor: C.green, priorityBg: C.greenLight, tags: ["Python", "Excel API"],            asesor: "Dra. López"   },
      { id: "c4", title: "App de Logística Interna",   company: "AutoParts Globales",     companyIcon: "truck",     student: "C.R", studentBg: "#7C3AED", priority: "Alta",  priorityColor: C.red,   priorityBg: C.redLight,   tags: ["React Native", "Node.js"],        asesor: "Dr. Martínez" },
      { id: "c5", title: "Plataforma de E-learning",   company: "EduTech Innovación",     companyIcon: "book-open", student: "M.G", studentBg: "#0891B2", priority: "Media", priorityColor: C.amber, priorityBg: C.amberLight, tags: ["Vue.js", "Firebase"],             asesor: "Dra. López"   },
    ],
  },
  {
    id: "revision", label: "En Revisión", color: C.purple, bg: C.purpleLight,
    cards: [
      { id: "c6", title: "App Inventarios Móvil",      company: "Constructora Peña",      companyIcon: "home",      student: "R.M", studentBg: "#0891B2", priority: "Alta",  priorityColor: C.red,   priorityBg: C.redLight,   tags: ["Flutter", "SQLite"],              asesor: "Dr. Martínez" },
      { id: "c7", title: "Dashboard BI Financiero",    company: "SoftSolutions SA",       companyIcon: "code",      student: "K.F", studentBg: "#D97706", priority: "Media", priorityColor: C.amber, priorityBg: C.amberLight, tags: ["Power BI", "SQL Server"],         asesor: "Dr. Herrera"  },
    ],
  },
  {
    id: "concluido", label: "Concluido", color: C.green, bg: C.greenLight,
    cards: [
      { id: "c8", title: "Rediseño UI/UX Tienda",      company: "Tecnológica del Norte",  companyIcon: "cpu",       student: "S.H", studentBg: "#059669", priority: "Baja",  priorityColor: C.green, priorityBg: C.greenLight, tags: ["Figma", "React"],                asesor: "Dra. López"   },
      { id: "c9", title: "Integración API Pagos",      company: "AutoParts Globales",     companyIcon: "truck",     student: "N.T", studentBg: "#DC2626", priority: "Alta",  priorityColor: C.red,   priorityBg: C.redLight,   tags: ["Stripe", "Node.js"],             asesor: "Dr. Martínez" },
    ],
  },
];

const ASESORES = ["Dr. Martínez", "Dra. López", "Dr. Herrera", "Dra. Sánchez", "Dr. Ramírez"];

export default function GestionProyectos() {
  const [columns, setColumns]         = useState(INITIAL_COLUMNS);
  const [active, setActive]           = useState(null);
  const [showFilter, setShowFilter]   = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("Todas");
  const [editingCard, setEditingCard] = useState(null);
  const [editForm, setEditForm]       = useState({ title: "", asesor: "" });

  const filteredColumns = columns.map((col) => ({
    ...col,
    cards:
      priorityFilter === "Todas"
        ? col.cards
        : col.cards.filter((card) => card.priority === priorityFilter),
  }));

  const openEdit = (colId, card) => {
    setEditingCard({ colId, cardId: card.id });
    setEditForm({ title: card.title, asesor: card.asesor });
  };

  const saveEdit = () => {
    if (!editForm.title.trim()) return;
    setColumns((prev) =>
      prev.map((col) =>
        col.id === editingCard.colId
          ? { ...col, cards: col.cards.map((c) => c.id === editingCard.cardId ? { ...c, title: editForm.title.trim(), asesor: editForm.asesor } : c) }
          : col
      )
    );
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
              Tablero Kanban · {columns.reduce((acc, c) => acc + c.cards.length, 0)} proyectos activos
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
                  {col.cards.map((card, i) => (
                    <TouchableOpacity
                      key={card.id}
                      onPress={() => setActive(active === `${col.id}-${i}` ? null : `${col.id}-${i}`)}
                      activeOpacity={0.85}
                      style={{ backgroundColor: C.card, borderRadius: 11, borderWidth: 1, borderColor: active === `${col.id}-${i}` ? col.color : C.border, padding: 14 }}
                    >
                      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Badge text={card.priority} color={card.priorityColor} bg={card.priorityBg} />
                        <TouchableOpacity onPress={(e) => { e.stopPropagation(); openEdit(col.id, card); }} style={{ padding: 4 }}>
                          <Feather name="edit-2" size={13} color={C.textLight} />
                        </TouchableOpacity>
                      </Row>
                      <Text style={{ fontSize: 13, fontWeight: "700", color: C.text, marginBottom: 10, lineHeight: 18 }}>{card.title}</Text>
                      <Row style={{ flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                        {card.tags.map((tag, ti) => (
                          <View key={ti} style={{ backgroundColor: C.bg, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: C.border }}>
                            <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: "600" }}>{tag}</Text>
                          </View>
                        ))}
                      </Row>
                      <Row style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <Row style={{ alignItems: "center", gap: 6 }}>
                          <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: C.tealLight, alignItems: "center", justifyContent: "center" }}>
                            <Feather name={card.companyIcon} size={11} color={C.teal} />
                          </View>
                          <Text style={{ fontSize: 10, color: C.textMuted, fontWeight: "600" }} numberOfLines={1}>{card.company}</Text>
                        </Row>
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: card.studentBg, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ fontSize: 9, color: "white", fontWeight: "800" }}>{card.student}</Text>
                        </View>
                      </Row>
                      <Row style={{ alignItems: "center", gap: 5, backgroundColor: C.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }}>
                        <Feather name="user-check" size={11} color={C.teal} />
                        <Text style={{ fontSize: 11, color: C.teal, fontWeight: "600" }}>{card.asesor}</Text>
                      </Row>
                    </TouchableOpacity>
                  ))}
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
                <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>Nombre del proyecto y asesor asignado</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingCard(null)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <View style={{ marginBottom: 18 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Nombre del Proyecto</Text>
              <TextInput
                value={editForm.title}
                onChangeText={(v) => setEditForm({ ...editForm, title: v })}
                placeholder="Nombre del proyecto"
                placeholderTextColor={C.textLight}
                style={{ padding: 11, borderRadius: 8, borderWidth: 1, borderColor: C.border, fontSize: 14, color: C.text, backgroundColor: "#FAFAFA" }}
              />
            </View>
            <View style={{ marginBottom: 22 }}>
              <Text style={{ fontSize: 12, fontWeight: "700", color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Asesor Asignado</Text>
              <Row style={{ flexWrap: "wrap", gap: 8 }}>
                {ASESORES.map((a) => (
                  <TouchableOpacity key={a} onPress={() => setEditForm({ ...editForm, asesor: a })} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: editForm.asesor === a ? C.teal : C.border, backgroundColor: editForm.asesor === a ? C.tealLight : "transparent" }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: editForm.asesor === a ? C.teal : C.textMuted }}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </Row>
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
