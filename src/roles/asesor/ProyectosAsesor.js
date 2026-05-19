import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import C from "../../constants/colors";
import { Row, Card, Badge, ProgressBar } from "../../components";
import { useProyectos } from "../../context/ProyectosContext";

const PHASE_LABELS = {
  propuesto: "Propuesto",
  desarrollo: "En Desarrollo",
  revision: "En Revisión",
  concluido: "Concluido",
};
const PHASE_COLORS = {
  propuesto: C.blue,
  desarrollo: C.amber,
  revision: C.purple,
  concluido: C.green,
};
const PRIORITY_OPTS = [
  { label: "Alta", color: C.red, bg: C.redLight },
  { label: "Media", color: C.amber, bg: C.amberLight },
  { label: "Baja", color: C.green, bg: C.greenLight },
];

export default function ProyectosAsesor() {
  const { proyectos, solicitarAvanceFase } = useProyectos() || {
    proyectos: [],
  };
  const [sortBy, setSortBy] = useState("proyecto");
  const [showSort, setShowSort] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const sortedProyectos = useMemo(() => {
    const arr = [...proyectos];
    if (sortBy === "proyecto")
      arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "id")
      arr.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    else if (sortBy === "empresa")
      arr.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
    else if (sortBy === "residente")
      arr.sort((a, b) =>
        (a.residentes[0]?.nombre || "").localeCompare(
          b.residentes[0]?.nombre || "",
        ),
      );
    else if (sortBy === "fase") {
      const order = ["propuesto", "desarrollo", "revision", "concluido"];
      arr.sort((a, b) => order.indexOf(a.phase) - order.indexOf(b.phase));
    }
    return arr;
  }, [proyectos, sortBy]);

  const handleSolicitarAvance = async (proyectoId) => {
    if (solicitarAvanceFase) {
      const result = await solicitarAvanceFase(proyectoId);
      if (result.ok) {
        Alert.alert(
          "Solicitud enviada",
          result.mensaje ||
            "Se ha notificado al Jefe de Vinculación para aprobar el avance de fase.",
        );
      } else {
        Alert.alert(
          "Error",
          result.mensaje || "No se pudo enviar la solicitud de avance.",
        );
      }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, overflow: "visible" }}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 80,
        }}
        style={{
          overflow: "visible",
        }}
      >
        {/* Header */}
        <Row
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
            zIndex: 99999,
            elevation: 99999,
          }}
        >
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
              Mis Proyectos
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
              {proyectos.length} proyectos asignados
            </Text>
          </View>
          {/* Sort */}
          <View
            style={{
              position: "relative",
              zIndex: 999,
              elevation: 999,
            }}
          >
            {/* Botón */}
            <TouchableOpacity
              onPress={() => setShowSort(!showSort)}
              activeOpacity={0.8}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                paddingVertical: 9,
                borderRadius: 9,
                backgroundColor: C.card,
              }}
            >
              <Feather name="bar-chart-2" size={13} color={C.textMuted} />

              <Text
                style={{
                  fontSize: 12,
                  color: C.textMuted,
                  fontWeight: "600",
                }}
              >
                Ordenar
              </Text>
            </TouchableOpacity>

            {/* Dropdown */}
            {showSort && (
              <View
                style={{
                  position: "absolute",
                  top: 45,
                  right: 0,
                  width: 220,
                  backgroundColor: C.card,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingVertical: 8,
                  zIndex: 9999,
                  elevation: 20,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 6,
                }}
              >
                {[
                  {
                    id: "proyecto",
                    label: "Nombre del proyecto",
                  },
                  {
                    id: "id",
                    label: "Código del proyecto",
                  },
                  {
                    id: "empresa",
                    label: "Empresa asociada",
                  },
                  {
                    id: "residente",
                    label: "Nombre del residente",
                  },
                  {
                    id: "fase",
                    label: "Fase del proyecto",
                  },
                ].map((opt) => (
                  <TouchableOpacity
                    key={opt.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setSortBy(opt.id);
                      setShowSort(false);
                    }}
                    style={{
                      paddingVertical: 10,
                      paddingHorizontal: 14,
                      backgroundColor:
                        sortBy === opt.id ? C.tealLight : "transparent",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: sortBy === opt.id ? C.teal : C.text,
                        fontWeight: sortBy === opt.id ? "800" : "500",
                      }}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Row>

        {/* Project Cards */}
        <View style={{ gap: 16, zIndex: 1 }}>
          {sortedProyectos.map((p) => {
            const isExpanded = expanded === p.id;
            const phaseColor = PHASE_COLORS[p.phase] || C.textMuted;
            const aceptados = (p.reportes ?? []).filter(
              (r) => r.status === "Aceptado",
            ).length;
            const totalReps = (p.reportes ?? []).length;
            const pct =
              totalReps > 0 ? Math.round((aceptados / totalReps) * 100) : 0;
            // Normalizar habilidades: puede venir como array o como string CSV del backend
            const habilidades = Array.isArray(p.habilidades)
              ? p.habilidades
              : (p.habilidades || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean);

            return (
              <Card
                key={p.id}
                style={{
                  padding: 0,
                  overflow: "visible",
                  zIndex: 1,
                }}
              >
                <TouchableOpacity
                  onPress={() => setExpanded(isExpanded ? null : p.id)}
                  activeOpacity={0.9}
                  style={{ padding: 18 }}
                >
                  <Row
                    style={{
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Row
                        style={{
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <Badge
                          text={PHASE_LABELS[p.phase]}
                          color={phaseColor}
                          bg={phaseColor + "22"}
                        />
                        <Badge
                          text={p.priority}
                          color={
                            PRIORITY_OPTS.find((o) => o.label === p.priority)
                              ?.color || C.amber
                          }
                          bg={
                            PRIORITY_OPTS.find((o) => o.label === p.priority)
                              ?.bg || C.amberLight
                          }
                        />
                      </Row>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "700",
                          color: C.text,
                        }}
                      >
                        {p.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: C.textMuted,
                          marginTop: 2,
                        }}
                      >
                        {p.company}
                      </Text>
                    </View>
                    <Feather
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={C.textMuted}
                    />
                  </Row>

                  {/* Progress bar: reportes */}
                  <View style={{ marginTop: 14 }}>
                    <Row
                      style={{
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <Text style={{ fontSize: 11, color: C.textMuted }}>
                        Reportes aceptados: {aceptados}/{totalReps}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: C.teal,
                        }}
                      >
                        {pct}%
                      </Text>
                    </Row>
                    <ProgressBar pct={pct} color={C.teal} />
                  </View>

                  {/* Residentes pills */}
                  <Row style={{ marginTop: 12, gap: 8, flexWrap: "wrap" }}>
                    {p.residentes.map((r, ri) => (
                      <Row
                        key={ri}
                        style={{
                          alignItems: "center",
                          gap: 5,
                          backgroundColor: C.tealLight,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: C.teal,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 8,
                              color: "white",
                              fontWeight: "800",
                            }}
                          >
                            {r.iniciales}
                          </Text>
                        </View>
                        <Text
                          style={{
                            fontSize: 11,
                            color: C.teal,
                            fontWeight: "600",
                          }}
                        >
                          {r.nombre}
                        </Text>
                      </Row>
                    ))}
                    {p.residentes.length < p.residentesRequeridos && (
                      <Row
                        style={{
                          alignItems: "center",
                          gap: 4,
                          backgroundColor: C.amberLight,
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 12,
                        }}
                      >
                        <Feather name="user-plus" size={10} color={C.amber} />
                        <Text
                          style={{
                            fontSize: 11,
                            color: C.amber,
                            fontWeight: "600",
                          }}
                        >
                          Faltan {p.residentesRequeridos - p.residentes.length}
                        </Text>
                      </Row>
                    )}
                  </Row>
                </TouchableOpacity>

                {/* Expanded details */}
                {isExpanded && (
                  <View
                    style={{
                      paddingHorizontal: 18,
                      paddingBottom: 18,
                      borderTopWidth: 1,
                      borderTopColor: C.border,
                      paddingTop: 14,
                    }}
                  >
                    <Row style={{ gap: 16, marginBottom: 14 }}>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: C.bg,
                          borderRadius: 8,
                          padding: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "800",
                            color: C.teal,
                          }}
                        >
                          {aceptados}/{totalReps}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.textMuted }}>
                          Reportes aceptados
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: C.bg,
                          borderRadius: 8,
                          padding: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "800",
                            color: C.blue,
                          }}
                        >
                          {habilidades.length}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.textMuted }}>
                          Tecnologías
                        </Text>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          backgroundColor: C.bg,
                          borderRadius: 8,
                          padding: 10,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "800",
                            color: C.purple,
                          }}
                        >
                          {(p.reuniones ?? []).length}
                        </Text>
                        <Text style={{ fontSize: 10, color: C.textMuted }}>
                          Reuniones
                        </Text>
                      </View>
                    </Row>

                    {/* Tech tags */}
                    <Row style={{ flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                      {habilidades.map((h, hi) => (
                        <View
                          key={hi}
                          style={{
                            backgroundColor: C.bg,
                            borderRadius: 6,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
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
                            {h}
                          </Text>
                        </View>
                      ))}
                    </Row>

                    {/* Actions */}
                    <Row style={{ gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleSolicitarAvance(p.id)}
                        disabled={p.phase === "concluido" || p.solicitudAvance}
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          paddingVertical: 10,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: p.solicitudAvance ? C.textLight : C.teal,
                          opacity: p.phase === "concluido" ? 0.5 : 1,
                        }}
                      >
                        <Feather
                          name="arrow-right-circle"
                          size={14}
                          color={p.solicitudAvance ? C.textLight : C.teal}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: p.solicitudAvance ? C.textLight : C.teal,
                          }}
                        >
                          {p.solicitudAvance
                            ? "Solicitud enviada"
                            : "Solicitar avance de fase"}
                        </Text>
                      </TouchableOpacity>
                    </Row>
                    {p.phase !== "concluido" && (
                      <Text
                        style={{
                          fontSize: 10,
                          color: C.textMuted,
                          marginTop: 8,
                          fontStyle: "italic",
                          textAlign: "center",
                        }}
                      >
                        El avance de fase requiere aprobación del Jefe de
                        Vinculación
                      </Text>
                    )}
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
