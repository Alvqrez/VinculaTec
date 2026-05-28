import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, Badge } from "../components";
import apiClient from "../utils/apiClient";

const PASO_LABELS = ["Proyecto", "Asesor", "Residente", "Confirmar"];

export default function AsignacionJefe() {
  const { colors: C } = useTheme();

  const [paso, setPaso] = useState(0);

  // Proyecto seleccionado de la lista existente
  const [proyecto, setProyecto] = useState({
    id: "",
    nombre: "",
    empresaId: "",
    empresaNombre: "",
    periodo: "",
  });

  const [asesorIds, setAsesorIds] = useState([]);
  const [residentesIds, setResidentesIds] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);

  const [asesores, setAsesores] = useState([]);
  const [residentes, setResidentes] = useState([]);
  const [proyectosList, setProyectosList] = useState([]);

  useEffect(() => {
    apiClient.get("/api/jefe/asignacion/datos").then((res) => {
      if (res.ok && res.body?.ok) {
        setAsesores(res.body.asesores || []);
        setResidentes(res.body.residentes || []);
        setProyectosList(res.body.proyectos || []);
      }
    });
  }, []);

  const toggleAsesor = (id) => {
    setAsesorIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    );
  };

  const toggleResidente = (id) => {
    setResidentesIds((prev) => {
      if (prev.includes(id)) return prev.filter((r) => r !== id);
      if (prev.length >= 2) {
        Alert.alert(
          "Límite alcanzado",
          "Un proyecto puede tener máximo 2 residentes.",
        );
        return prev;
      }
      return [...prev, id];
    });
  };

  const validarPaso = () => {
    if (paso === 0) {
      if (!proyecto.id) {
        Alert.alert("Falta información", "Selecciona un proyecto de la lista.");
        return;
      }
    }

    if (paso === 1 && asesorIds.length === 0) {
      Alert.alert("Falta información", "Selecciona al menos un asesor.");
      return;
    }

    if (paso === 2 && residentesIds.length === 0) {
      Alert.alert("Falta información", "Selecciona al menos un residente.");
      return;
    }

    setPaso((p) => p + 1);
  };

  const guardarAsignacion = async () => {
    const res = await apiClient.post("/api/jefe/asignacion", {
      proyectoId: proyecto.id, // usamos el proyecto existente
      proyectoNombre: proyecto.nombre, // el backend lo necesita si no existe
      empresaId: proyecto.empresaId,
      periodo: proyecto.periodo,
      asesorIds,
      residentesIds,
    });

    if (!res.ok) {
      Alert.alert("Error", res.body?.mensaje || "No se pudo guardar.");
      return;
    }

    const asesoresNombres = asesorIds
      .map((id) => asesores.find((a) => a.id === id)?.nombre)
      .filter(Boolean);

    const nuevaAsignacion = {
      id: res.body.id,
      proyecto: proyecto.nombre,
      empresa: proyecto.empresaNombre,
      asesores: asesoresNombres,
      residentes: residentesIds.map(
        (id) => residentes.find((r) => r.id === id)?.nombre,
      ),
      fecha: new Date().toLocaleDateString("es-MX"),
    };

    setAsignaciones((prev) => [nuevaAsignacion, ...prev]);

    setProyecto({
      id: "",
      nombre: "",
      empresaId: "",
      empresaNombre: "",
      periodo: "",
    });
    setAsesorIds([]);
    setResidentesIds([]);
    setPaso(0);

    Alert.alert(
      "Asignación guardada",
      `El proyecto "${nuevaAsignacion.proyecto}" ha sido asignado correctamente.`,
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 24 }}
    >
      {/* Header */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
          Asignación de Proyectos
        </Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          Selecciona un proyecto y asigna asesor y residente(s)
        </Text>
      </View>

      {/* Stepper */}
      <Card style={{ marginBottom: 24, padding: 20 }}>
        <Row style={{ justifyContent: "center", alignItems: "center", gap: 0 }}>
          {PASO_LABELS.map((label, i) => (
            <Row
              key={i}
              style={{
                alignItems: "center",
                flex: i < PASO_LABELS.length - 1 ? 1 : undefined,
              }}
            >
              <View style={{ alignItems: "center" }}>
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor:
                      i < paso ? C.teal : i === paso ? C.navy : C.bg,
                    borderWidth: i === paso ? 3 : 0,
                    borderColor: C.teal,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {i < paso ? (
                    <Feather name="check" size={16} color="white" />
                  ) : (
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "800",
                        color: i === paso ? C.teal : C.textMuted,
                      }}
                    >
                      {i + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: i === paso ? "700" : "500",
                    color:
                      i === paso ? C.teal : i < paso ? C.green : C.textMuted,
                    marginTop: 6,
                    textAlign: "center",
                  }}
                >
                  {label}
                </Text>
              </View>

              {i < PASO_LABELS.length - 1 && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: i < paso ? C.teal : C.border,
                    marginHorizontal: 8,
                    marginBottom: 20,
                  }}
                />
              )}
            </Row>
          ))}
        </Row>
      </Card>

      {/* ── Paso 0: Elegir proyecto existente ── */}
      {paso === 0 && (
        <Card style={{ marginBottom: 20 }}>
          <Row style={{ alignItems: "center", gap: 10, marginBottom: 6 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.blueLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="folder" size={18} color={C.blue} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                Seleccionar Proyecto
              </Text>
              <Text style={{ fontSize: 12, color: C.textMuted }}>
                Proyectos registrados en la página de Proyectos
              </Text>
            </View>
          </Row>

          {proyectosList.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 28 }}>
              <Feather name="inbox" size={28} color={C.textLight} />
              <Text
                style={{
                  fontSize: 13,
                  color: C.textMuted,
                  marginTop: 10,
                  textAlign: "center",
                }}
              >
                No hay proyectos disponibles.{"\n"}Regístralos primero en la
                página de Proyectos.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10, marginTop: 14 }}>
              {proyectosList.map((p) => {
                const sel = proyecto.id === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() =>
                      setProyecto({
                        id: p.id,
                        nombre: p.nombre,
                        empresaId: p.empresa_id || "",
                        empresaNombre: p.empresa_nombre || "",
                        periodo: p.periodo || "",
                      })
                    }
                    style={{
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: sel ? C.teal : C.border,
                      backgroundColor: sel ? C.tealLighter : C.card,
                      padding: 14,
                    }}
                  >
                    <Row style={{ alignItems: "center", gap: 12 }}>
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 10,
                          backgroundColor: sel ? C.teal : C.blueLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather
                          name="folder"
                          size={16}
                          color={sel ? "white" : C.blue}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: C.text,
                          }}
                        >
                          {p.nombre}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: C.textMuted,
                            marginTop: 2,
                          }}
                        >
                          {p.empresa_nombre
                            ? `${p.empresa_nombre}`
                            : "Sin empresa"}
                          {p.periodo ? ` · ${p.periodo}` : ""}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          backgroundColor: sel ? C.teal : C.bg,
                          borderWidth: sel ? 0 : 1.5,
                          borderColor: C.border,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {sel && (
                          <Feather name="check" size={13} color="white" />
                        )}
                      </View>
                    </Row>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </Card>
      )}

      {/* ── Paso 1: Asesores ── */}
      {paso === 1 && (
        <Card style={{ marginBottom: 20 }}>
          <Row style={{ alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.purpleLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="user-check" size={18} color={C.purple} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                Asignar Asesor(es)
              </Text>
              <Text style={{ fontSize: 12, color: C.textMuted }}>
                Proyecto: {proyecto.nombre}
              </Text>
            </View>
          </Row>
          <Text
            style={{
              fontSize: 12,
              color: C.textMuted,
              marginBottom: 16,
              lineHeight: 17,
            }}
          >
            Puedes seleccionar varios asesores. El primero seleccionado será el
            asesor principal y quedará asignado a los residentes.
          </Text>

          {asesorIds.length > 0 && (
            <View
              style={{
                backgroundColor: C.tealLighter,
                borderRadius: 8,
                padding: 10,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}>
                {asesorIds.length} asesor(es) seleccionado(s) — Principal:{" "}
                {asesores.find((a) => a.id === asesorIds[0])?.nombre}
              </Text>
            </View>
          )}

          <View style={{ gap: 10 }}>
            {asesores.map((a) => {
              const sel = asesorIds.includes(a.id);
              const isPrimario = asesorIds[0] === a.id;
              return (
                <TouchableOpacity
                  key={a.id}
                  onPress={() => toggleAsesor(a.id)}
                  style={{
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: sel ? C.teal : C.border,
                    backgroundColor: sel ? C.tealLighter : C.card,
                    padding: 16,
                  }}
                >
                  <Row style={{ alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: sel ? C.teal : C.tealLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "800",
                          color: sel ? "white" : C.teal,
                        }}
                      >
                        {a.nombre
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Row style={{ alignItems: "center", gap: 6 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: C.text,
                          }}
                        >
                          {a.nombre}
                        </Text>
                        {isPrimario && (
                          <View
                            style={{
                              backgroundColor: C.teal,
                              borderRadius: 4,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 9,
                                color: "white",
                                fontWeight: "700",
                              }}
                            >
                              PRINCIPAL
                            </Text>
                          </View>
                        )}
                      </Row>
                      <Text style={{ fontSize: 12, color: C.textMuted }}>
                        {a.departamento}
                      </Text>
                    </View>
                    <Badge
                      text={`${a.activos} activos`}
                      color={a.activos >= 4 ? C.amber : C.green}
                      bg={a.activos >= 4 ? C.amberLight : C.greenLight}
                    />
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: sel ? C.teal : C.bg,
                        borderWidth: sel ? 0 : 1.5,
                        borderColor: C.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {sel && <Feather name="check" size={13} color="white" />}
                    </View>
                  </Row>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      )}

      {/* ── Paso 2: Residentes ── */}
      {paso === 2 && (
        <Card style={{ marginBottom: 20 }}>
          <Row style={{ alignItems: "center", gap: 10, marginBottom: 20 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.greenLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="users" size={18} color={C.green} />
            </View>
            <View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                Asignar Residente(s)
              </Text>
              <Text style={{ fontSize: 12, color: C.textMuted }}>
                Residentes sin proyecto asignado
              </Text>
            </View>
          </Row>

          {residentesIds.length > 0 && (
            <View
              style={{
                backgroundColor: C.tealLighter,
                borderRadius: 8,
                padding: 10,
                marginBottom: 14,
              }}
            >
              <Text style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}>
                {residentesIds.length} residente(s) seleccionado(s)
              </Text>
            </View>
          )}

          <View style={{ gap: 10 }}>
            {residentes.map((r) => {
              const sel = residentesIds.includes(r.id);
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => toggleResidente(r.id)}
                  style={{
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: sel ? C.teal : C.border,
                    backgroundColor: sel ? C.tealLighter : C.card,
                    padding: 14,
                  }}
                >
                  <Row style={{ alignItems: "center", gap: 12 }}>
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: sel ? C.teal : C.tealLight,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "800",
                          color: sel ? "white" : C.teal,
                        }}
                      >
                        {r.nombre
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: C.text,
                        }}
                      >
                        {r.nombre}
                      </Text>
                      <Text style={{ fontSize: 11, color: C.textMuted }}>
                        {r.matricula} · {r.carrera}
                      </Text>
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: sel ? C.teal : C.bg,
                        borderWidth: sel ? 0 : 1.5,
                        borderColor: C.border,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {sel && <Feather name="check" size={12} color="white" />}
                    </View>
                  </Row>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>
      )}

      {/* ── Paso 3: Confirmación ── */}
      {paso === 3 && (
        <Card style={{ marginBottom: 20, borderWidth: 2, borderColor: C.teal }}>
          <Row style={{ alignItems: "center", gap: 10, marginBottom: 20 }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: C.tealLight,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="check-circle" size={18} color={C.teal} />
            </View>
            <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
              Confirmar Asignación
            </Text>
          </Row>

          {[
            { label: "Proyecto", value: proyecto.nombre, icon: "folder" },
            {
              label: "Empresa",
              value: proyecto.empresaNombre,
              icon: "briefcase",
            },
            {
              label: "Asesor(es)",
              value: asesorIds
                .map((id) => asesores.find((a) => a.id === id)?.nombre)
                .filter(Boolean)
                .join(", "),
              icon: "user-check",
            },
            {
              label: "Residentes",
              value: residentesIds
                .map((id) => residentes.find((r) => r.id === id)?.nombre)
                .join(", "),
              icon: "users",
            },
          ].map((item, i) => (
            <Row
              key={i}
              style={{
                alignItems: "flex-start",
                gap: 12,
                paddingVertical: 12,
                borderBottomWidth: i < 3 ? 1 : 0,
                borderBottomColor: C.border,
              }}
            >
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
                <Feather name={item.icon} size={15} color={C.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                  }}
                >
                  {item.label}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: C.text,
                    marginTop: 2,
                  }}
                >
                  {item.value || "—"}
                </Text>
              </View>
            </Row>
          ))}
        </Card>
      )}

      {/* Navegación */}
      <Row style={{ gap: 12, marginBottom: 24 }}>
        {paso > 0 && (
          <TouchableOpacity
            onPress={() => setPaso((p) => p - 1)}
            style={{
              flex: 1,
              paddingVertical: 13,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: C.border,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Feather name="arrow-left" size={15} color={C.textMuted} />
            <Text
              style={{ fontSize: 14, fontWeight: "600", color: C.textMuted }}
            >
              Anterior
            </Text>
          </TouchableOpacity>
        )}
        {paso < 3 ? (
          <TouchableOpacity
            onPress={validarPaso}
            style={{
              flex: 2,
              paddingVertical: 13,
              borderRadius: 10,
              backgroundColor: C.teal,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
              Siguiente
            </Text>
            <Feather name="arrow-right" size={15} color="white" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={guardarAsignacion}
            style={{
              flex: 2,
              paddingVertical: 13,
              borderRadius: 10,
              backgroundColor: C.teal,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <Feather name="check" size={16} color="white" />
            <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
              Guardar Asignación
            </Text>
          </TouchableOpacity>
        )}
      </Row>

      {/* Historial */}
      {asignaciones.length > 0 && (
        <>
          <Text
            style={{
              fontSize: 13,
              fontWeight: "800",
              color: C.textMuted,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 12,
            }}
          >
            Asignaciones Recientes
          </Text>
          <View style={{ gap: 10 }}>
            {asignaciones.map((a) => (
              <Card
                key={a.id}
                style={{
                  padding: 14,
                  borderLeftWidth: 4,
                  borderLeftColor: C.teal,
                }}
              >
                <Row
                  style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: C.text,
                      flex: 1,
                    }}
                  >
                    {a.proyecto}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    {a.fecha}
                  </Text>
                </Row>
                <Text
                  style={{ fontSize: 12, color: C.textMuted, marginBottom: 4 }}
                >
                  {a.empresa} · Asesor(es): {(a.asesores || []).join(", ")}
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.teal, fontWeight: "600" }}
                >
                  Residentes: {a.residentes.join(", ")}
                </Text>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
