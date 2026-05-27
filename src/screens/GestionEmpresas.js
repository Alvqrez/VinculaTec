import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, StatCard, Badge } from "../components";
import apiClient from "../utils/apiClient";

const SECTOR_ICON = {
  Tecnología: "cpu",
  Manufactura: "tool",
  Software: "code",
  Construcción: "home",
  Farmacéutica: "activity",
  Automotriz: "truck",
  Educación: "book-open",
};
const SECTORES = [
  "Todos",
  "Tecnología",
  "Manufactura",
  "Software",
  "Construcción",
  "Farmacéutica",
  "Automotriz",
  "Educación",
];
const ESTADOS = ["Todos", "Activa", "Por Vencer", "Nueva", "Inactiva"];

const EMPTY_FORM = {
  name: "",
  sector: "Tecnología",
  ciudad: "",
  convenio: "",
  contactoNombre: "",
  contactoEmail: "",
  contactoTel: "",
  status: "Nueva",
};

export default function GestionEmpresas() {
  const { colors: C } = useTheme();
  const STATUS_STYLE = {
    Activa: { color: C.green, bg: C.greenLight },
    "Por Vencer": { color: C.amber, bg: C.amberLight },
    Nueva: { color: C.blue, bg: C.blueLight },
    Inactiva: { color: C.red, bg: C.redLight },
  };
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setModal] = useState(false);
  const [showFilter, setFilter] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filters, setFilters] = useState({
    sector: "Todos",
    status: "Todos",
    ciudad: "Todas",
  });
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState(null); // { msg, type }

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reloadEmpresas = () =>
    apiClient.get("/api/jefe/empresas").then((res) => {
      if (res.ok && res.body?.ok) setCompanies(res.body.empresas);
    });

  useEffect(() => {
    apiClient.get("/api/jefe/empresas").then((res) => {
      if (res.ok && res.body?.ok) setCompanies(res.body.empresas);
      setLoading(false);
    });
  }, []);

  // Ciudades únicas derivadas de las empresas cargadas
  const CIUDADES = [
    "Todas",
    ...Array.from(
      new Set(companies.map((c) => c.ciudad).filter(Boolean)),
    ).sort(),
  ];

  // Aplicar filtros + búsqueda
  const filtered = companies.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name.toLowerCase().includes(q) ||
      c.sector.toLowerCase().includes(q) ||
      c.ciudad.toLowerCase().includes(q);
    const matchSector =
      filters.sector === "Todos" || c.sector === filters.sector;
    const matchStatus =
      filters.status === "Todos" || c.status === filters.status;
    const matchCiudad =
      filters.ciudad === "Todas" || c.ciudad === filters.ciudad;
    return matchSearch && matchSector && matchStatus && matchCiudad;
  });

  const activeFilterCount = [
    filters.sector !== "Todos",
    filters.status !== "Todos",
    filters.ciudad !== "Todas",
  ].filter(Boolean).length;

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal(true);
  };
  const openEdit = (co) => {
    setForm({
      name: co.name,
      sector: co.sector,
      ciudad: co.ciudad,
      convenio: co.convenio,
      contactoNombre: co.contactoNombre || "",
      contactoEmail: co.contactoEmail || "",
      contactoTel: co.contactoTel || "",
      status: co.status,
    });
    setEditId(co.id);
    setModal(true);
  };
  const saveCompany = async () => {
    if (!form.name.trim()) return;

    // Convertir fecha ISO a YYYY-MM-DD
    const payload = {
      ...form,
      convenio: form.convenio
        ? new Date(form.convenio).toISOString().split("T")[0]
        : null,
    };

    if (editId) {
      const res = await apiClient.put(`/api/jefe/empresas/${editId}`, payload);

      if (res.ok) {
        await reloadEmpresas();
        setModal(false);
        showToast("Empresa actualizada con éxito");
      } else {
        showToast(res.body?.mensaje || "Error al actualizar", "error");
      }
    } else {
      const res = await apiClient.post("/api/jefe/empresas", payload);

      if (res.ok) {
        await reloadEmpresas();
        setModal(false);
        showToast("Empresa guardada con éxito");
      } else {
        showToast(res.body?.mensaje || "Error al registrar", "error");
      }
    }
  };
  const deleteCompany = async (id) => {
    const res = await apiClient.delete(`/api/jefe/empresas/${id}`);
    if (res.ok) {
      await reloadEmpresas();
      showToast("Empresa eliminada");
    } else showToast("Error al eliminar", "error");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── FIX #1: El backdrop se renderiza ANTES del ScrollView para que quede
           debajo en el orden de apilamiento (z-order). Así el dropdown del filtro
           (zIndex:10000) siempre queda por encima, y en web no se produce el
           "stacking context trap" que bloqueaba los toques en las opciones.
           También se reemplaza "inset:0" (no soportado en todas las versiones de RN)
           por los cuatro valores explícitos: top/right/bottom/left. ── */}
      {showFilter && (
        <Pressable
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onPress={() => setFilter(false)}
        />
      )}

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
              Gestión de Empresas
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
              Directorio y convenios vigentes
            </Text>
          </View>
        </Row>

        {/* Stat Cards */}
        <Row style={{ gap: 12, marginBottom: 20 }}>
          <StatCard
            label="Total"
            value={String(companies.length)}
            icon="briefcase"
            iconBg={C.blueLight}
            iconColor={C.blue}
          />
          <StatCard
            label="Activas"
            value={String(
              companies.filter((c) => c.status === "Activa").length,
            )}
            icon="check-circle"
            iconBg={C.greenLight}
            iconColor={C.green}
          />
          <StatCard
            label="Por Vencer"
            value={String(
              companies.filter((c) => c.status === "Por Vencer").length,
            )}
            icon="alert-triangle"
            iconBg={C.amberLight}
            iconColor={C.amber}
          />
          <StatCard
            label="Nuevas"
            value={String(companies.filter((c) => c.status === "Nueva").length)}
            icon="star"
            iconBg={C.purpleLight}
            iconColor={C.purple}
          />
        </Row>

        {/* Directorio */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <View
            style={{
              padding: 18,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>
                Directorio de Empresas
              </Text>

              {/* Botón Filtrar */}
              <View style={{ position: "relative", zIndex: 1000 }}>
                <TouchableOpacity
                  onPress={() => setFilter(!showFilter)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                    borderWidth: 1,
                    borderColor: activeFilterCount > 0 ? C.teal : C.border,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 8,
                    backgroundColor: C.bg,
                  }}
                >
                  <Feather
                    name="filter"
                    size={13}
                    color={activeFilterCount > 0 ? C.teal : C.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      color: activeFilterCount > 0 ? C.teal : C.textMuted,
                      fontWeight: "600",
                    }}
                  >
                    Filtrar
                    {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </Text>
                </TouchableOpacity>

                {/* Menú flotante de filtros */}
                {showFilter && (
                  <View
                    style={{
                      position: "absolute",
                      top: 40,
                      right: 0,
                      width: 280,
                      backgroundColor: C.card,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: C.border,
                      shadowColor: "#000",
                      shadowOpacity: 0.12,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: 20,
                      zIndex: 10000,
                      padding: 16,
                    }}
                  >
                    <Row
                      style={{
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 14,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "800",
                          color: C.text,
                        }}
                      >
                        Filtros
                      </Text>
                      <Row style={{ gap: 8 }}>
                        <TouchableOpacity
                          onPress={() =>
                            setFilters({
                              sector: "Todos",
                              status: "Todos",
                              ciudad: "Todas",
                            })
                          }
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              color: C.teal,
                              fontWeight: "700",
                            }}
                          >
                            Limpiar
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setFilter(false)}>
                          <Feather name="x" size={16} color={C.textMuted} />
                        </TouchableOpacity>
                      </Row>
                    </Row>

                    {[
                      ["Sector", "sector", SECTORES],
                      ["Estado", "status", ESTADOS],
                      ["Ciudad", "ciudad", CIUDADES],
                    ].map(([label, key, opts]) => (
                      <View key={key} style={{ marginBottom: 14 }}>
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            color: C.textMuted,
                            textTransform: "uppercase",
                            letterSpacing: 0.5,
                            marginBottom: 8,
                          }}
                        >
                          {label}
                        </Text>
                        <Row style={{ flexWrap: "wrap", gap: 6 }}>
                          {opts.map((opt) => (
                            <TouchableOpacity
                              key={opt}
                              onPress={() =>
                                setFilters({ ...filters, [key]: opt })
                              }
                              style={{
                                paddingHorizontal: 10,
                                paddingVertical: 5,
                                borderRadius: 20,
                                borderWidth: 1,
                                borderColor:
                                  filters[key] === opt ? C.teal : C.border,
                                backgroundColor:
                                  filters[key] === opt ? C.tealLight : "white",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 11,
                                  fontWeight: "600",
                                  color:
                                    filters[key] === opt ? C.teal : C.textMuted,
                                }}
                              >
                                {opt}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </Row>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </Row>

            {/* Buscador */}
            <Row
              style={{
                alignItems: "center",
                backgroundColor: C.bg,
                borderRadius: 9,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                gap: 8,
              }}
            >
              <Feather name="search" size={14} color={C.textMuted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar empresa, sector o ciudad..."
                placeholderTextColor={C.textLight}
                style={{
                  flex: 1,
                  paddingVertical: 9,
                  fontSize: 13,
                  color: C.text,
                }}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch("")}>
                  <Feather name="x" size={14} color={C.textMuted} />
                </TouchableOpacity>
              )}
            </Row>
          </View>

          {/* Cabecera tabla */}
          <View
            style={{
              paddingHorizontal: 18,
              paddingVertical: 10,
              backgroundColor: C.bg,
            }}
          >
            <Row>
              {[
                ["Empresa", 2.5],
                ["Sector", 1.5],
                ["Ciudad", 1.2],
                ["Resid.", 0.8, "center"],
                ["Convenio", 1.5, "center"],
                ["Estado", 1, "center"],
                ["", 0.8],
              ].map(([h, f, ta]) => (
                <Text
                  key={h}
                  style={{
                    flex: f,
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    textAlign: ta || "left",
                  }}
                >
                  {h}
                </Text>
              ))}
            </Row>
          </View>

          {/* Filas */}
          {filtered.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Feather name="inbox" size={28} color={C.textLight} />
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>
                No se encontraron empresas
              </Text>
            </View>
          ) : (
            filtered.map((co, i) => {
              const st = STATUS_STYLE[co.status] || STATUS_STYLE.Activa;
              const ico = SECTOR_ICON[co.sector] || "briefcase";
              return (
                <View
                  key={co.id}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 13,
                    borderTopWidth: 1,
                    borderTopColor: C.borderLight,
                    backgroundColor: C.bg,
                  }}
                >
                  <Row style={{ alignItems: "center" }}>
                    <Row style={{ flex: 2.5, alignItems: "center", gap: 10 }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 9,
                          backgroundColor: C.tealLight,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name={ico} size={15} color={C.teal} />
                      </View>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: C.text,
                          flex: 1,
                        }}
                        numberOfLines={1}
                      >
                        {co.name}
                      </Text>
                    </Row>
                    <Text style={{ flex: 1.5, fontSize: 12, color: C.textSub }}>
                      {co.sector}
                    </Text>
                    <Text style={{ flex: 1.2, fontSize: 12, color: C.textSub }}>
                      {co.ciudad}
                    </Text>
                    <View style={{ flex: 0.8, alignItems: "center" }}>
                      <View
                        style={{
                          backgroundColor: C.blueLight,
                          borderRadius: 20,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          minWidth: 28,
                          alignItems: "center",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "700",
                            color: C.blue,
                          }}
                        >
                          {co.residentes}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={{
                        flex: 1.5,
                        fontSize: 12,
                        color: C.textSub,
                        textAlign: "center",
                      }}
                    >
                      {co.convenio}
                    </Text>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Badge text={co.status} color={st.color} bg={st.bg} />
                    </View>
                    <Row
                      style={{ flex: 0.8, justifyContent: "flex-end", gap: 8 }}
                    >
                      <TouchableOpacity onPress={() => openEdit(co)}>
                        <Feather name="edit-2" size={14} color={C.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteCompany(co.id)}>
                        <Feather name="trash-2" size={14} color={C.red} />
                      </TouchableOpacity>
                    </Row>
                  </Row>
                </View>
              );
            })
          )}

          <View
            style={{ padding: 14, borderTopWidth: 1, borderTopColor: C.border }}
          >
            <Text
              style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}
            >
              Mostrando {filtered.length} de {companies.length} empresas
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* Toast */}
      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 32,
            left: "50%",
            transform: [{ translateX: -160 }],
            width: 320,
            backgroundColor: toast.type === "error" ? C.red : C.green,
            borderRadius: 12,
            paddingVertical: 14,
            paddingHorizontal: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            shadowColor: "#000",
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Feather
            name={toast.type === "error" ? "x-circle" : "check-circle"}
            size={18}
            color="white"
          />
          <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
            {toast.msg}
          </Text>
        </View>
      )}

      {/* ── Modal Nueva / Editar Empresa ── */}
      <Modal visible={showModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setModal(false)}
        >
          <Pressable
            style={{
              width: 520,
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 28,
              borderWidth: 1,
              borderColor: C.border,
              shadowColor: "#000",
              shadowOpacity: 0.15,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
            }}
            onPress={() => {}}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 22,
              }}
            >
              <Row style={{ alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: C.tealLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="briefcase" size={18} color={C.teal} />
                </View>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                >
                  {editId ? "Editar Empresa" : "Nueva Empresa"}
                </Text>
              </Row>
              <TouchableOpacity onPress={() => setModal(false)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>

            <ScrollView
              style={{ maxHeight: 440 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Nombre */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 6,
                }}
              >
                Nombre de la empresa *
              </Text>
              <TextInput
                value={form.name}
                onChangeText={(v) => setForm({ ...form, name: v })}
                placeholder="Ej: Telmex S.A. de C.V."
                placeholderTextColor={C.textLight}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border,
                  fontSize: 13,
                  color: C.text,
                  backgroundColor: C.bg,
                  marginBottom: 14,
                }}
              />

              {/* Sector */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Sector
              </Text>
              <Row style={{ flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
                {SECTORES.filter((s) => s !== "Todos").map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm({ ...form, sector: s })}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: form.sector === s ? C.teal : C.border,
                      backgroundColor: C.bg,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: form.sector === s ? C.teal : C.textMuted,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Row>

              {/* Estado */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "700",
                  color: C.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  marginBottom: 8,
                }}
              >
                Estado del convenio
              </Text>
              <Row style={{ gap: 8, marginBottom: 14 }}>
                {ESTADOS.filter((s) => s !== "Todos").map((s) => {
                  const st = STATUS_STYLE[s] || STATUS_STYLE.Activa;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setForm({ ...form, status: s })}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: form.status === s ? st.color : C.border,
                        backgroundColor: C.bg,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "600",
                          color: form.status === s ? st.color : C.textMuted,
                        }}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </Row>

              {/* Ciudad + Convenio */}
              <Row style={{ gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Ciudad
                  </Text>
                  <TextInput
                    value={form.ciudad}
                    onChangeText={(v) => setForm({ ...form, ciudad: v })}
                    placeholder="Ej: Monterrey"
                    placeholderTextColor={C.textLight}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: C.border,
                      fontSize: 13,
                      color: C.text,
                      backgroundColor: "#FAFAFA",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Vencimiento convenio
                  </Text>
                  <TextInput
                    value={form.convenio}
                    onChangeText={(v) => setForm({ ...form, convenio: v })}
                    placeholder="AAAA-MM-DD"
                    placeholderTextColor={C.textLight}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: C.border,
                      fontSize: 13,
                      color: C.text,
                      backgroundColor: "#FAFAFA",
                    }}
                  />
                </View>
              </Row>

              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: C.text,
                  marginTop: 18,
                  marginBottom: 12,
                }}
              >
                Contacto principal
              </Text>
              <Row style={{ gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Nombre
                  </Text>
                  <TextInput
                    value={form.contactoNombre}
                    onChangeText={(v) =>
                      setForm({ ...form, contactoNombre: v })
                    }
                    placeholder="Ing. Juan Pérez"
                    placeholderTextColor={C.textLight}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: C.border,
                      fontSize: 13,
                      color: C.text,
                      backgroundColor: "#FAFAFA",
                    }}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 6,
                    }}
                  >
                    Teléfono
                  </Text>
                  <TextInput
                    value={form.contactoTel}
                    onChangeText={(v) => setForm({ ...form, contactoTel: v })}
                    placeholder="+52 (81) 0000-0000"
                    placeholderTextColor={C.textLight}
                    style={{
                      padding: 10,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: C.border,
                      fontSize: 13,
                      color: C.text,
                      backgroundColor: "#FAFAFA",
                    }}
                  />
                </View>
              </Row>
              <View style={{ marginTop: 12 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Correo de contacto
                </Text>
                <TextInput
                  value={form.contactoEmail}
                  onChangeText={(v) => setForm({ ...form, contactoEmail: v })}
                  placeholder="contacto@empresa.com"
                  placeholderTextColor={C.textLight}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: C.border,
                    fontSize: 13,
                    color: C.text,
                    backgroundColor: "#FAFAFA",
                  }}
                />
              </View>
            </ScrollView>

            <Row style={{ gap: 10, marginTop: 22 }}>
              <TouchableOpacity
                onPress={() => setModal(false)}
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
                onPress={saveCompany}
                style={{
                  flex: 2,
                  paddingVertical: 11,
                  borderRadius: 9,
                  backgroundColor: C.teal,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 14, fontWeight: "700", color: "white" }}
                >
                  {editId ? "Guardar Cambios" : "Registrar Empresa"}
                </Text>
              </TouchableOpacity>
            </Row>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
