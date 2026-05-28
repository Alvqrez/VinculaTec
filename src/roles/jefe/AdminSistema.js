import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { Row, Card, Badge } from "../../components";
import apiClient from "../../utils/apiClient";

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function LabelInput({
  C,
  label,
  value,
  onChange,
  placeholder,
  keyboardType,
  secure,
  multiline,
}) {
  return (
    <View style={{ marginBottom: 14 }}>
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
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={C.textLight}
        keyboardType={keyboardType || "default"}
        secureTextEntry={secure}
        multiline={multiline}
        style={{
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          fontSize: 13,
          color: C.text,
          backgroundColor: C.bg,
          ...(multiline ? { minHeight: 72, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}

function SectionHeader({ C, title, subtitle, action }) {
  return (
    <Row
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
      }}
    >
      <View>
        <Text style={{ fontSize: 18, fontWeight: "800", color: C.text }}>
          {title}
        </Text>
        {subtitle && (
          <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
            {subtitle}
          </Text>
        )}
      </View>
      {action}
    </Row>
  );
}

// ─── Constantes reutilizadas desde RegistrarUsuario ───────────────────────────
const CARRERAS = [
  "Ingeniería en Sistemas Computacionales",
  "Ingeniería Industrial",
  "Ingeniería Electrónica",
  "Ingeniería Mecatrónica",
  "Ingeniería Civil",
  "Licenciatura en Administración",
  "Otra",
];

const DEPARTAMENTOS = [
  "Ciencias Básicas",
  "Sistemas y Computación",
  "Industrial",
  "Eléctrica y Electrónica",
  "Mecatrónica",
  "Económico-Administrativa",
  "Otro",
];

const EMPTY_USUARIO_FORM = {
  nombre: "",
  apellidos: "",
  correo: "",
  password: "",
  confirmPassword: "",
  numControl: "",
  semestre: "",
  carrera: "Ingeniería en Sistemas Computacionales",
  departamento: "",
  numEmpleado: "",
};

// ─── Modal: Registrar Usuario (Residente o Asesor) ────────────────────────────
function RegistrarUsuarioModal({
  visible,
  onClose,
  onSuccess,
  rolDefault = "residente",
}) {
  const { colors: C } = useTheme();
  const [rol, setRol] = useState(rolDefault);
  const [form, setForm] = useState(EMPTY_USUARIO_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setRol(rolDefault);
      setForm(EMPTY_USUARIO_FORM);
    }
  }, [visible, rolDefault]);

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  const validar = () => {
    if (!form.nombre.trim()) {
      Alert.alert("Falta información", "Ingresa el nombre.");
      return false;
    }
    if (!form.apellidos.trim()) {
      Alert.alert("Falta información", "Ingresa los apellidos.");
      return false;
    }
    if (!form.correo.trim() || !form.correo.includes("@")) {
      Alert.alert("Falta información", "Ingresa un correo válido.");
      return false;
    }
    if (form.password.length < 8) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return false;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert(
        "Contraseñas no coinciden",
        "Verifica la contraseña de confirmación.",
      );
      return false;
    }
    if (rol === "residente" && !form.numControl.trim()) {
      Alert.alert("Falta información", "Ingresa el número de control.");
      return false;
    }
    if (rol === "asesor" && !form.departamento) {
      Alert.alert("Falta información", "Selecciona el departamento.");
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!validar()) return;
    setSaving(true);
    const payload = {
      rol,
      nombre: form.nombre.trim(),
      apellidos: form.apellidos.trim(),
      correo: form.correo.trim().toLowerCase(),
      password: form.password,
      numControl: form.numControl.trim() || null,
      carrera: form.carrera || null,
      semestre: form.semestre ? Number(form.semestre) : null,
      departamento: form.departamento || null,
      numEmpleado: form.numEmpleado.trim() || null,
    };
    const res = await apiClient.post("/api/jefe/registrar-usuario", payload);
    setSaving(false);
    if (!res.ok) {
      Alert.alert(
        "Error al registrar",
        res.body?.mensaje || "No se pudo crear el usuario.",
      );
      return;
    }
    onSuccess?.(`${form.nombre} ${form.apellidos}`, rol);
    onClose();
  };

  const ROL_OPTS = [
    {
      id: "residente",
      label: "Residente",
      icon: "user",
      color: C.blue,
      bg: C.blueLight,
    },
    {
      id: "asesor",
      label: "Asesor",
      icon: "user-check",
      color: C.teal,
      bg: C.tealLight,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.45)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={onClose}
      >
        <Pressable
          style={{
            width: 520,
            maxHeight: "85%",
            backgroundColor: C.card,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: C.border,
            overflow: "hidden",
          }}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View
            style={{
              padding: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Row
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Row style={{ alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: C.blueLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="user-plus" size={18} color={C.blue} />
                </View>
                <Text
                  style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                >
                  Registrar {rolDefault === "asesor" ? "Asesor" : "Residente"}
                </Text>
              </Row>
              <TouchableOpacity onPress={onClose}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
          </View>

          <ScrollView
            style={{ padding: 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Datos personales */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: C.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 12,
              }}
            >
              Datos personales
            </Text>
            <Row style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Nombre(s)"
                  value={form.nombre}
                  onChange={(v) => set("nombre", v)}
                  placeholder="Ej. Carlos"
                />
              </View>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Apellidos"
                  value={form.apellidos}
                  onChange={(v) => set("apellidos", v)}
                  placeholder="Ej. Ramírez López"
                />
              </View>
            </Row>
            <LabelInput
              C={C}
              label="Correo electrónico"
              value={form.correo}
              onChange={(v) => set("correo", v)}
              placeholder="correo@ejemplo.com"
              keyboardType="email-address"
            />
            <Row style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Contraseña"
                  value={form.password}
                  onChange={(v) => set("password", v)}
                  placeholder="Mínimo 8 caracteres"
                  secure
                />
              </View>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Confirmar contraseña"
                  value={form.confirmPassword}
                  onChange={(v) => set("confirmPassword", v)}
                  placeholder="Repite la contraseña"
                  secure
                />
              </View>
            </Row>

            {/* Datos según rol */}
            {rol === "residente" && (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                    marginTop: 4,
                  }}
                >
                  Datos académicos
                </Text>
                <Row style={{ gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <LabelInput
                      C={C}
                      label="Número de control"
                      value={form.numControl}
                      onChange={(v) => set("numControl", v)}
                      placeholder="Ej. 20XXXXXX"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <LabelInput
                      C={C}
                      label="Semestre"
                      value={form.semestre}
                      onChange={(v) => set("semestre", v)}
                      placeholder="Ej. 9"
                      keyboardType="numeric"
                    />
                  </View>
                </Row>
              </>
            )}

            {rol === "asesor" && (
              <>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: C.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                    marginTop: 4,
                  }}
                >
                  Datos laborales
                </Text>
                <LabelInput
                  C={C}
                  label="Número de empleado"
                  value={form.numEmpleado}
                  onChange={(v) => set("numEmpleado", v)}
                  placeholder="Ej. EMP-001"
                />
                <View style={{ marginBottom: 14 }}>
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
                    Departamento
                  </Text>
                  <View
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                  >
                    {DEPARTAMENTOS.map((d) => (
                      <TouchableOpacity
                        key={d}
                        onPress={() => set("departamento", d)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor:
                            form.departamento === d ? C.teal : C.border,
                          backgroundColor:
                            form.departamento === d ? C.tealLight : C.card,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "600",
                            color:
                              form.departamento === d ? C.teal : C.textMuted,
                          }}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}

            {/* Botones */}
            <Row style={{ gap: 10, marginBottom: 8 }}>
              <TouchableOpacity
                onPress={onClose}
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
                onPress={guardar}
                disabled={saving}
                style={{
                  flex: 2,
                  paddingVertical: 11,
                  borderRadius: 9,
                  backgroundColor: saving
                    ? C.textLight
                    : rol === "asesor"
                      ? C.teal
                      : C.blue,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Feather name="user-plus" size={15} color="white" />
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: "white",
                      }}
                    >
                      Registrar {rol === "asesor" ? "Asesor" : "Residente"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </Row>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Tab: Residentes ──────────────────────────────────────────────────────────
function ResidentesTab() {
  const { colors: C } = useTheme();
  const [residentes, setResidentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRegistrar, setShowRegistrar] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/jefe/admin/residentes").then((res) => {
      if (res.ok && res.body?.ok) setResidentes(res.body.residentes);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = residentes.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch =
      r.nombre.toLowerCase().includes(q) ||
      (r.num_control || "").toLowerCase().includes(q) ||
      (r.carrera || "").toLowerCase().includes(q);
    const matchStatus = statusFilter === "todos" || r.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const openEdit = (r) => {
    setEditTarget(r);
    setEditForm({
      carrera: r.carrera || "",
      semestre: String(r.semestre || ""),
      estado: r.estado || "activo",
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await apiClient.put(
      `/api/jefe/admin/residentes/${editTarget.id}`,
      {
        carrera: editForm.carrera,
        semestre: editForm.semestre ? Number(editForm.semestre) : null,
        estado: editForm.estado,
      },
    );
    if (res.ok) {
      showToast("Residente actualizado");
      load();
      setEditTarget(null);
    } else showToast(res.body?.mensaje || "Error al guardar", "error");
    setSaving(false);
  };

  const ESTADO_STYLE = {
    activo: { color: C.green, bg: C.greenLight },
    completado: { color: C.blue, bg: C.blueLight },
    baja: { color: C.red, bg: C.redLight },
  };

  return (
    <View>
      <SectionHeader
        C={C}
        title="Residentes"
        subtitle={`${residentes.length} registros`}
        action={
          <TouchableOpacity
            onPress={() => setShowRegistrar(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: C.teal,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 9,
            }}
          >
            <Feather name="user-plus" size={14} color="white" />
            <Text style={{ fontSize: 13, color: "white", fontWeight: "700" }}>
              Agregar Residente
            </Text>
          </TouchableOpacity>
        }
      />

      {/* Filtros */}
      <Row style={{ gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <Row
          style={{
            alignItems: "center",
            backgroundColor: C.bg,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: C.border,
            paddingHorizontal: 10,
            gap: 6,
            flex: 1,
            minWidth: 180,
          }}
        >
          <Feather name="search" size={13} color={C.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar nombre, matrícula o carrera…"
            placeholderTextColor={C.textLight}
            style={{ flex: 1, paddingVertical: 8, fontSize: 13, color: C.text }}
          />
        </Row>
        {["todos", "activo", "completado", "baja"].map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setStatusFilter(s)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: statusFilter === s ? C.teal : C.border,
              backgroundColor: statusFilter === s ? C.tealLight : C.bg,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: statusFilter === s ? C.teal : C.textMuted,
                textTransform: "capitalize",
              }}
            >
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </Row>

      {loading ? (
        <ActivityIndicator color={C.teal} style={{ marginTop: 40 }} />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Row>
              {[
                ["Nombre", 2.5],
                ["Matrícula", 1.2],
                ["Carrera", 2],
                ["Sem.", 0.6, "center"],
                ["Asesor", 1.5],
                ["Estado", 1, "center"],
                ["", 0.6],
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
          {filtered.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Feather name="inbox" size={28} color={C.textLight} />
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>
                Sin resultados
              </Text>
            </View>
          ) : (
            filtered.map((r) => {
              const est = ESTADO_STYLE[r.estado] || ESTADO_STYLE.activo;
              return (
                <View
                  key={r.id}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderTopWidth: 1,
                    borderTopColor: C.borderLight,
                  }}
                >
                  <Row style={{ alignItems: "center" }}>
                    <View style={{ flex: 2.5 }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: "700",
                          color: C.text,
                        }}
                        numberOfLines={1}
                      >
                        {r.nombre}
                      </Text>
                      <Text
                        style={{
                          fontSize: 11,
                          color: C.textMuted,
                          marginTop: 1,
                        }}
                      >
                        {r.correo}
                      </Text>
                    </View>
                    <Text style={{ flex: 1.2, fontSize: 12, color: C.textSub }}>
                      {r.num_control || "—"}
                    </Text>
                    <Text
                      style={{ flex: 2, fontSize: 12, color: C.textSub }}
                      numberOfLines={1}
                    >
                      {r.carrera || "—"}
                    </Text>
                    <Text
                      style={{
                        flex: 0.6,
                        fontSize: 12,
                        color: C.textSub,
                        textAlign: "center",
                      }}
                    >
                      {r.semestre || "—"}
                    </Text>
                    <Text
                      style={{ flex: 1.5, fontSize: 12, color: C.textSub }}
                      numberOfLines={1}
                    >
                      {r.asesor_nombre || "Sin asignar"}
                    </Text>
                    <View style={{ flex: 1, alignItems: "center" }}>
                      <Badge text={r.estado} color={est.color} bg={est.bg} />
                    </View>
                    <TouchableOpacity
                      style={{ flex: 0.6, alignItems: "center" }}
                      onPress={() => openEdit(r)}
                    >
                      <Feather name="edit-2" size={14} color={C.textMuted} />
                    </TouchableOpacity>
                  </Row>
                </View>
              );
            })
          )}
          <View
            style={{ padding: 12, borderTopWidth: 1, borderTopColor: C.border }}
          >
            <Text
              style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}
            >
              Mostrando {filtered.length} de {residentes.length}
            </Text>
          </View>
        </Card>
      )}

      {/* Toast */}
      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: toast.type === "error" ? C.red : C.green,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Feather
              name={toast.type === "error" ? "x-circle" : "check-circle"}
              size={15}
              color="white"
            />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              {toast.msg}
            </Text>
          </View>
        </View>
      )}

      {/* Modal registrar residente */}
      <RegistrarUsuarioModal
        visible={showRegistrar}
        rolDefault="residente"
        onClose={() => setShowRegistrar(false)}
        onSuccess={(nombre) => {
          showToast(`${nombre} registrado`);
          load();
        }}
      />

      {/* Modal editar residente */}
      <Modal visible={!!editTarget} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setEditTarget(null)}
        >
          <Pressable
            style={{
              width: 440,
              backgroundColor: C.card,
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                Editar Residente
              </Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Feather name="x" size={18} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: C.text,
                marginBottom: 16,
              }}
            >
              {editTarget?.nombre}
            </Text>
            <LabelInput
              C={C}
              label="Carrera"
              value={editForm.carrera}
              onChange={(v) => setEditForm({ ...editForm, carrera: v })}
              placeholder="Ej: ISC"
            />
            <LabelInput
              C={C}
              label="Semestre"
              value={editForm.semestre}
              onChange={(v) => setEditForm({ ...editForm, semestre: v })}
              placeholder="Ej: 9"
              keyboardType="numeric"
            />
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
              Estado
            </Text>
            <Row style={{ gap: 8, marginBottom: 20 }}>
              {["activo", "completado", "baja"].map((s) => {
                const est = ESTADO_STYLE[s];
                const sel = editForm.estado === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setEditForm({ ...editForm, estado: s })}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: sel ? est.color : C.border,
                      backgroundColor: sel ? est.bg : C.bg,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: sel ? est.color : C.textMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Row>
            <Row style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditTarget(null)}
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
                    Guardar
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

// ─── Tab: Asesores ────────────────────────────────────────────────────────────
function AsesoresTab() {
  const { colors: C } = useTheme();
  const [asesores, setAsesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [showRegistrar, setShowRegistrar] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/jefe/admin/asesores").then((res) => {
      if (res.ok && res.body?.ok) setAsesores(res.body.asesores);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = asesores.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.nombre.toLowerCase().includes(q) ||
      (a.departamento || "").toLowerCase().includes(q) ||
      (a.num_empleado || "").toLowerCase().includes(q)
    );
  });

  const openEdit = (a) => {
    setEditTarget(a);
    setEditForm({
      departamento: a.departamento || "",
      num_empleado: a.num_empleado || "",
      max_residentes: String(a.max_residentes || 10),
    });
  };

  const saveEdit = async () => {
    setSaving(true);
    const res = await apiClient.put(
      `/api/jefe/admin/asesores/${editTarget.id}`,
      {
        departamento: editForm.departamento,
        num_empleado: editForm.num_empleado,
        max_residentes: editForm.max_residentes
          ? Number(editForm.max_residentes)
          : 10,
      },
    );
    if (res.ok) {
      showToast("Asesor actualizado");
      load();
      setEditTarget(null);
    } else showToast(res.body?.mensaje || "Error", "error");
    setSaving(false);
  };

  const toggleActivo = async (a) => {
    const res = await apiClient.put(`/api/jefe/admin/asesores/${a.id}/toggle`);
    if (res.ok) {
      showToast(`Asesor ${a.activo ? "desactivado" : "activado"}`);
      load();
    } else showToast("Error al cambiar estado", "error");
  };

  return (
    <View>
      <SectionHeader
        C={C}
        title="Asesores"
        subtitle={`${asesores.length} registros`}
        action={
          <TouchableOpacity
            onPress={() => setShowRegistrar(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: C.teal,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 9,
            }}
          >
            <Feather name="user-plus" size={14} color="white" />
            <Text style={{ fontSize: 13, color: "white", fontWeight: "700" }}>
              Agregar Asesor
            </Text>
          </TouchableOpacity>
        }
      />

      <Row
        style={{
          alignItems: "center",
          backgroundColor: C.bg,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 10,
          gap: 6,
          marginBottom: 16,
        }}
      >
        <Feather name="search" size={13} color={C.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar nombre, departamento o núm. empleado…"
          placeholderTextColor={C.textLight}
          style={{ flex: 1, paddingVertical: 8, fontSize: 13, color: C.text }}
        />
      </Row>

      {loading ? (
        <ActivityIndicator color={C.teal} style={{ marginTop: 40 }} />
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: C.bg,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Row>
              {[
                ["Nombre", 2.5],
                ["Núm. Empleado", 1.2],
                ["Departamento", 2],
                ["Activos", 0.8, "center"],
                ["Máx.", 0.7, "center"],
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
          {filtered.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Feather name="inbox" size={28} color={C.textLight} />
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>
                Sin resultados
              </Text>
            </View>
          ) : (
            filtered.map((a) => (
              <View
                key={a.id}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: C.borderLight,
                }}
              >
                <Row style={{ alignItems: "center" }}>
                  <View style={{ flex: 2.5 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.text }}
                      numberOfLines={1}
                    >
                      {a.nombre}
                    </Text>
                    <Text
                      style={{ fontSize: 11, color: C.textMuted, marginTop: 1 }}
                    >
                      {a.correo}
                    </Text>
                  </View>
                  <Text style={{ flex: 1.2, fontSize: 12, color: C.textSub }}>
                    {a.num_empleado || "—"}
                  </Text>
                  <Text
                    style={{ flex: 2, fontSize: 12, color: C.textSub }}
                    numberOfLines={1}
                  >
                    {a.departamento || "—"}
                  </Text>
                  <Text
                    style={{
                      flex: 0.8,
                      fontSize: 12,
                      color: C.textSub,
                      textAlign: "center",
                    }}
                  >
                    {a.proyectos_activos}
                  </Text>
                  <Text
                    style={{
                      flex: 0.7,
                      fontSize: 12,
                      color: C.textSub,
                      textAlign: "center",
                    }}
                  >
                    {a.max_residentes}
                  </Text>
                  <View style={{ flex: 1, alignItems: "center" }}>
                    <TouchableOpacity onPress={() => toggleActivo(a)}>
                      <Badge
                        text={a.activo ? "Activo" : "Inactivo"}
                        color={a.activo ? C.green : C.red}
                        bg={a.activo ? C.greenLight : C.redLight}
                      />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={{ flex: 0.8, alignItems: "center" }}
                    onPress={() => openEdit(a)}
                  >
                    <Feather name="edit-2" size={14} color={C.textMuted} />
                  </TouchableOpacity>
                </Row>
              </View>
            ))
          )}
          <View
            style={{ padding: 12, borderTopWidth: 1, borderTopColor: C.border }}
          >
            <Text
              style={{ fontSize: 12, color: C.textMuted, textAlign: "center" }}
            >
              Mostrando {filtered.length} de {asesores.length}
            </Text>
          </View>
        </Card>
      )}

      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: toast.type === "error" ? C.red : C.green,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Feather
              name={toast.type === "error" ? "x-circle" : "check-circle"}
              size={15}
              color="white"
            />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              {toast.msg}
            </Text>
          </View>
        </View>
      )}

      {/* Modal registrar asesor */}
      <RegistrarUsuarioModal
        visible={showRegistrar}
        rolDefault="asesor"
        onClose={() => setShowRegistrar(false)}
        onSuccess={(nombre) => {
          showToast(`${nombre} registrado`);
          load();
        }}
      />

      {/* Modal editar asesor */}
      <Modal visible={!!editTarget} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setEditTarget(null)}
        >
          <Pressable
            style={{
              width: 400,
              backgroundColor: C.card,
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                Editar Asesor
              </Text>
              <TouchableOpacity onPress={() => setEditTarget(null)}>
                <Feather name="x" size={18} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: C.text,
                marginBottom: 16,
              }}
            >
              {editTarget?.nombre}
            </Text>
            <LabelInput
              C={C}
              label="Departamento"
              value={editForm.departamento}
              onChange={(v) => setEditForm({ ...editForm, departamento: v })}
              placeholder="Ej: Sistemas y Computación"
            />
            <LabelInput
              C={C}
              label="Núm. Empleado"
              value={editForm.num_empleado}
              onChange={(v) => setEditForm({ ...editForm, num_empleado: v })}
              placeholder="Ej: EMP-001"
            />
            <LabelInput
              C={C}
              label="Máx. Residentes"
              value={editForm.max_residentes}
              onChange={(v) => setEditForm({ ...editForm, max_residentes: v })}
              placeholder="10"
              keyboardType="numeric"
            />
            <Row style={{ gap: 10, marginTop: 6 }}>
              <TouchableOpacity
                onPress={() => setEditTarget(null)}
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
                    Guardar
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

// ─── Tab: Períodos ────────────────────────────────────────────────────────────
const ESTADO_PERIODO_STYLE = {
  planificado: { color: "#8B5CF6", bg: "#EDE9FE" },
  activo: { color: "#0D9488", bg: "#CCFBF1" },
  cerrado: { color: "#64748B", bg: "#F1F5F9" },
};
const EMPTY_PERIODO = {
  nombre: "",
  fecha_inicio: "",
  fecha_fin: "",
  descripcion: "",
  estado: "planificado",
};

function PeriodosTab({ onPeriodoChange }) {
  const { colors: C } = useTheme();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_PERIODO);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(() => {
    setLoading(true);
    apiClient.get("/api/jefe/periodos").then((res) => {
      if (res.ok && res.body?.ok) {
        setPeriodos(res.body.periodos);
        onPeriodoChange?.(res.body.periodos);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openNew = () => {
    setForm(EMPTY_PERIODO);
    setEditId(null);
    setShowForm(true);
  };
  const openEdit = (p) => {
    setForm({
      nombre: p.nombre,
      fecha_inicio: p.fecha_inicio?.slice(0, 10) || "",
      fecha_fin: p.fecha_fin?.slice(0, 10) || "",
      descripcion: p.descripcion || "",
      estado: p.estado,
    });
    setEditId(p.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.nombre.trim() || !form.fecha_inicio || !form.fecha_fin) {
      showToast("Nombre y fechas son requeridos", "error");
      return;
    }
    setSaving(true);
    const res = editId
      ? await apiClient.put(`/api/jefe/periodos/${editId}`, form)
      : await apiClient.post("/api/jefe/periodos", form);
    if (res.ok) {
      showToast(editId ? "Período actualizado" : "Período creado");
      load();
      setShowForm(false);
    } else showToast(res.body?.mensaje || "Error", "error");
    setSaving(false);
  };

  const deletePeriodo = async (id) => {
    const res = await apiClient.delete(`/api/jefe/periodos/${id}`);
    if (res.ok) {
      showToast("Período eliminado");
      load();
    } else
      showToast(
        res.body?.mensaje ||
          "No se puede eliminar (tiene empresas o proyectos asociados)",
        "error",
      );
  };

  return (
    <View>
      <SectionHeader
        C={C}
        title="Períodos"
        subtitle="Ciclos escolares del programa"
        action={
          <TouchableOpacity
            onPress={openNew}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: C.teal,
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 9,
            }}
          >
            <Feather name="plus" size={14} color="white" />
            <Text style={{ fontSize: 13, color: "white", fontWeight: "700" }}>
              Nuevo período
            </Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <ActivityIndicator color={C.teal} style={{ marginTop: 40 }} />
      ) : periodos.length === 0 ? (
        <View style={{ alignItems: "center", paddingVertical: 48 }}>
          <Feather name="calendar" size={36} color={C.textLight} />
          <Text style={{ fontSize: 14, color: C.textMuted, marginTop: 12 }}>
            Sin períodos registrados
          </Text>
          <TouchableOpacity
            onPress={openNew}
            style={{
              marginTop: 16,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 9,
              backgroundColor: C.tealLight,
              borderWidth: 1,
              borderColor: C.teal,
            }}
          >
            <Text style={{ color: C.teal, fontWeight: "700" }}>
              Crear primer período
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {periodos.map((p) => {
            const est =
              ESTADO_PERIODO_STYLE[p.estado] ||
              ESTADO_PERIODO_STYLE.planificado;
            return (
              <Card key={p.id} style={{ padding: 16 }}>
                <Row
                  style={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Row
                      style={{ alignItems: "center", gap: 10, marginBottom: 6 }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 9,
                          backgroundColor: est.bg,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Feather name="calendar" size={16} color={est.color} />
                      </View>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "800",
                          color: C.text,
                        }}
                      >
                        {p.nombre}
                      </Text>
                      <Badge text={p.estado} color={est.color} bg={est.bg} />
                    </Row>
                    {p.descripcion ? (
                      <Text
                        style={{
                          fontSize: 12,
                          color: C.textMuted,
                          marginBottom: 8,
                          marginLeft: 46,
                        }}
                      >
                        {p.descripcion}
                      </Text>
                    ) : null}
                    <Row style={{ gap: 20, marginLeft: 46 }}>
                      <Row style={{ alignItems: "center", gap: 5 }}>
                        <Feather name="play" size={11} color={C.textMuted} />
                        <Text style={{ fontSize: 12, color: C.textSub }}>
                          {p.fecha_inicio?.slice(0, 10) || "—"}
                        </Text>
                      </Row>
                      <Row style={{ alignItems: "center", gap: 5 }}>
                        <Feather
                          name="stop-circle"
                          size={11}
                          color={C.textMuted}
                        />
                        <Text style={{ fontSize: 12, color: C.textSub }}>
                          {p.fecha_fin?.slice(0, 10) || "—"}
                        </Text>
                      </Row>
                      <Row style={{ alignItems: "center", gap: 5 }}>
                        <Feather
                          name="briefcase"
                          size={11}
                          color={C.textMuted}
                        />
                        <Text style={{ fontSize: 12, color: C.textSub }}>
                          {p.num_empresas || 0} empresas
                        </Text>
                      </Row>
                    </Row>
                  </View>
                  <Row style={{ gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => openEdit(p)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: C.bg,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      <Feather name="edit-2" size={14} color={C.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deletePeriodo(p.id)}
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        backgroundColor: C.redLight,
                        borderWidth: 1,
                        borderColor: C.red,
                      }}
                    >
                      <Feather name="trash-2" size={14} color={C.red} />
                    </TouchableOpacity>
                  </Row>
                </Row>
              </Card>
            );
          })}
        </View>
      )}

      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: toast.type === "error" ? C.red : C.green,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Feather
              name={toast.type === "error" ? "x-circle" : "check-circle"}
              size={15}
              color="white"
            />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              {toast.msg}
            </Text>
          </View>
        </View>
      )}

      <Modal visible={showForm} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowForm(false)}
        >
          <Pressable
            style={{
              width: 460,
              backgroundColor: C.card,
              borderRadius: 16,
              padding: 24,
              borderWidth: 1,
              borderColor: C.border,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.text }}>
                {editId ? "Editar Período" : "Nuevo Período"}
              </Text>
              <TouchableOpacity onPress={() => setShowForm(false)}>
                <Feather name="x" size={18} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <LabelInput
              C={C}
              label="Nombre *"
              value={form.nombre}
              onChange={(v) => setForm({ ...form, nombre: v })}
              placeholder="Ej: Ene-Jun 2026"
            />
            <Row style={{ gap: 12 }}>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Fecha Inicio *"
                  value={form.fecha_inicio}
                  onChange={(v) => setForm({ ...form, fecha_inicio: v })}
                  placeholder="AAAA-MM-DD"
                />
              </View>
              <View style={{ flex: 1 }}>
                <LabelInput
                  C={C}
                  label="Fecha Fin *"
                  value={form.fecha_fin}
                  onChange={(v) => setForm({ ...form, fecha_fin: v })}
                  placeholder="AAAA-MM-DD"
                />
              </View>
            </Row>
            <LabelInput
              C={C}
              label="Descripción"
              value={form.descripcion}
              onChange={(v) => setForm({ ...form, descripcion: v })}
              placeholder="Notas opcionales…"
              multiline
            />
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
              Estado
            </Text>
            <Row style={{ gap: 8, marginBottom: 20 }}>
              {["planificado", "activo", "cerrado"].map((s) => {
                const st = ESTADO_PERIODO_STYLE[s];
                const sel = form.estado === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setForm({ ...form, estado: s })}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1.5,
                      borderColor: sel ? st.color : C.border,
                      backgroundColor: sel ? st.bg : C.bg,
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "700",
                        color: sel ? st.color : C.textMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </Row>
            <Row style={{ gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowForm(false)}
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
                onPress={save}
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
                    {editId ? "Guardar Cambios" : "Crear Período"}
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

// ─── Constantes para empresas ──────────────────────────────────────────────────
const SECTOR_OPTS = [
  "Tecnología",
  "Manufactura",
  "Software",
  "Construcción",
  "Farmacéutica",
  "Automotriz",
  "Educación",
];
const ESTADO_EMP_OPTS = ["Nueva", "Activa", "Por Vencer", "Inactiva"];
const EMPTY_EMPRESA_FORM = {
  name: "",
  sector: "Tecnología",
  ciudad: "",
  contactoNombre: "",
  contactoTel: "",
  status: "Nueva",
};

const STATUS_COLOR = {
  Activa: { color: "#16A34A", bg: "#DCFCE7" },
  "Por Vencer": { color: "#D97706", bg: "#FEF3C7" },
  Nueva: { color: "#2563EB", bg: "#DBEAFE" },
  Inactiva: { color: "#DC2626", bg: "#FEE2E2" },
};

// ─── Tab: Empresas por Período ─────────────────────────────────────────────────
function EmpresasPeriodoTab() {
  const { colors: C } = useTheme();
  const [periodos, setPeriodos] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);
  const [periodoEmpresas, setPeriodoEmpresas] = useState([]);
  const [loadingPeriodo, setLoadingPeriodo] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [searchAdd, setSearchAdd] = useState("");
  const [adding, setAdding] = useState(null);
  const [toast, setToast] = useState(null);
  const [empresaForm, setEmpresaForm] = useState(EMPTY_EMPRESA_FORM);
  const [savingEmpresa, setSavingEmpresa] = useState(false);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const reloadEmpresas = useCallback(() => {
    apiClient.get("/api/jefe/empresas").then((res) => {
      if (res.ok && res.body?.ok) setEmpresas(res.body.empresas);
    });
  }, []);

  useEffect(() => {
    apiClient.get("/api/jefe/periodos").then((res) => {
      if (res.ok && res.body?.ok) setPeriodos(res.body.periodos);
    });
    reloadEmpresas();
  }, []);

  const loadPeriodoEmpresas = useCallback((periodoId) => {
    if (!periodoId) return;
    setLoadingPeriodo(true);
    apiClient.get(`/api/jefe/periodos/${periodoId}/empresas`).then((res) => {
      if (res.ok && res.body?.ok) setPeriodoEmpresas(res.body.empresas);
      setLoadingPeriodo(false);
    });
  }, []);

  const selectPeriodo = (p) => {
    setSelectedPeriodo(p);
    loadPeriodoEmpresas(p.id);
  };

  const addEmpresa = async (empresaId) => {
    if (!selectedPeriodo) return;
    setAdding(empresaId);
    const res = await apiClient.post(
      `/api/jefe/periodos/${selectedPeriodo.id}/empresas`,
      { empresa_id: empresaId },
    );
    if (res.ok) {
      showToast("Empresa agregada al período");
      loadPeriodoEmpresas(selectedPeriodo.id);
    } else showToast(res.body?.mensaje || "Error al agregar", "error");
    setAdding(null);
  };

  const removeEmpresa = async (empresaId) => {
    const res = await apiClient.delete(
      `/api/jefe/periodos/${selectedPeriodo.id}/empresas/${empresaId}`,
    );
    if (res.ok) {
      showToast("Empresa removida del período");
      loadPeriodoEmpresas(selectedPeriodo.id);
    } else showToast("Error al remover", "error");
  };

  // Crear nueva empresa y opcionalmente agregarla al período actual
  const crearEmpresa = async () => {
    if (!empresaForm.name.trim()) {
      showToast("El nombre de la empresa es requerido", "error");
      return;
    }
    if (
      empresaForm.contactoTel &&
      empresaForm.contactoTel.replace(/\D/g, "").length !== 10
    ) {
      showToast("El teléfono debe tener exactamente 10 dígitos", "error");
      return;
    }
    setSavingEmpresa(true);
    const payload = {
      name: empresaForm.name.trim(),
      sector: empresaForm.sector,
      ciudad: empresaForm.ciudad.trim() || null,
      contactoNombre: empresaForm.contactoNombre.trim() || null,
      contactoTel: empresaForm.contactoTel.replace(/\D/g, "") || null,
      status: empresaForm.status,
    };
    const res = await apiClient.post("/api/jefe/empresas", payload);
    if (res.ok) {
      const nuevaId = res.body?.empresa?.id || res.body?.id;
      showToast("Empresa creada exitosamente");
      reloadEmpresas();
      setShowCrearModal(false);
      setEmpresaForm(EMPTY_EMPRESA_FORM);
      if (selectedPeriodo && nuevaId) {
        await apiClient.post(
          `/api/jefe/periodos/${selectedPeriodo.id}/empresas`,
          { empresa_id: nuevaId },
        );
        loadPeriodoEmpresas(selectedPeriodo.id);
        showToast(`Empresa creada y agregada a ${selectedPeriodo.nombre}`);
      }
    } else {
      showToast(res.body?.mensaje || "Error al crear empresa", "error");
    }
    setSavingEmpresa(false);
  };

  const assignedIds = new Set(periodoEmpresas.map((e) => e.id));
  const availableToAdd = empresas.filter(
    (e) =>
      !assignedIds.has(e.id) &&
      (searchAdd === "" ||
        e.name.toLowerCase().includes(searchAdd.toLowerCase()) ||
        (e.sector || "").toLowerCase().includes(searchAdd.toLowerCase())),
  );

  return (
    <View>
      <SectionHeader
        C={C}
        title="Empresas por Período"
        subtitle="Asocia empresas a cada ciclo escolar"
      />

      {/* Selector de período */}
      <Text
        style={{
          fontSize: 11,
          fontWeight: "700",
          color: C.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          marginBottom: 10,
        }}
      >
        Selecciona un período
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 20 }}
      >
        <Row style={{ gap: 8 }}>
          {periodos.length === 0 ? (
            <Text
              style={{ fontSize: 13, color: C.textMuted, fontStyle: "italic" }}
            >
              Sin períodos. Créalos primero en la pestaña Períodos.
            </Text>
          ) : (
            periodos.map((p) => {
              const est =
                ESTADO_PERIODO_STYLE[p.estado] ||
                ESTADO_PERIODO_STYLE.planificado;
              const sel = selectedPeriodo?.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => selectPeriodo(p)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: sel ? C.teal : C.border,
                    backgroundColor: sel ? C.tealLight : C.card,
                    minWidth: 130,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: sel ? C.teal : C.text,
                    }}
                  >
                    {p.nombre}
                  </Text>
                  <Row style={{ alignItems: "center", gap: 4, marginTop: 3 }}>
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: est.color,
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        color: C.textMuted,
                        textTransform: "capitalize",
                      }}
                    >
                      {p.estado}
                    </Text>
                  </Row>
                </TouchableOpacity>
              );
            })
          )}
        </Row>
      </ScrollView>

      {!selectedPeriodo ? (
        <View
          style={{
            alignItems: "center",
            paddingVertical: 48,
            backgroundColor: C.card,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          <Feather name="arrow-up" size={28} color={C.textLight} />
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>
            Selecciona un período para ver sus empresas
          </Text>
        </View>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <View
            style={{
              padding: 16,
              borderBottomWidth: 1,
              borderBottomColor: C.border,
            }}
          >
            <Row
              style={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <View>
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: C.text }}
                >
                  {selectedPeriodo.nombre}
                </Text>
                <Text
                  style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}
                >
                  {periodoEmpresas.length} empresa
                  {periodoEmpresas.length !== 1 ? "s" : ""} asignada
                  {periodoEmpresas.length !== 1 ? "s" : ""}
                </Text>
              </View>
              {/* Botones de acción */}
              <Row style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setSearchAdd("");
                    setShowAddModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    borderWidth: 1,
                    borderColor: C.teal,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    backgroundColor: C.tealLight,
                  }}
                >
                  <Feather name="link" size={13} color={C.teal} />
                  <Text
                    style={{ fontSize: 12, color: C.teal, fontWeight: "700" }}
                  >
                    Vincular existente
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setEmpresaForm(EMPTY_EMPRESA_FORM);
                    setShowCrearModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    backgroundColor: C.teal,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                  }}
                >
                  <Feather name="plus" size={13} color="white" />
                  <Text
                    style={{ fontSize: 12, color: "white", fontWeight: "700" }}
                  >
                    Crear empresa
                  </Text>
                </TouchableOpacity>
              </Row>
            </Row>
          </View>

          {loadingPeriodo ? (
            <ActivityIndicator color={C.teal} style={{ margin: 32 }} />
          ) : periodoEmpresas.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Feather name="briefcase" size={28} color={C.textLight} />
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}>
                Sin empresas para este período
              </Text>
            </View>
          ) : (
            periodoEmpresas.map((emp) => (
              <View
                key={emp.id}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 13,
                  borderTopWidth: 1,
                  borderTopColor: C.borderLight,
                }}
              >
                <Row style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      backgroundColor: C.tealLight,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Feather name="briefcase" size={15} color={C.teal} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{ fontSize: 13, fontWeight: "700", color: C.text }}
                    >
                      {emp.nombre}
                    </Text>
                    <Text style={{ fontSize: 11, color: C.textMuted }}>
                      {emp.sector} · {emp.ciudad}
                    </Text>
                  </View>
                  <Badge
                    text={emp.estado}
                    color={emp.estado === "Activa" ? C.green : C.amber}
                    bg={emp.estado === "Activa" ? C.greenLight : C.amberLight}
                  />
                  <TouchableOpacity
                    onPress={() => removeEmpresa(emp.id)}
                    style={{
                      marginLeft: 14,
                      padding: 6,
                      borderRadius: 7,
                      backgroundColor: C.redLight,
                    }}
                  >
                    <Feather name="x" size={14} color={C.red} />
                  </TouchableOpacity>
                </Row>
              </View>
            ))
          )}
        </Card>
      )}

      {toast && (
        <View
          style={{
            position: "absolute",
            bottom: 16,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: toast.type === "error" ? C.red : C.green,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              flexDirection: "row",
              gap: 8,
              alignItems: "center",
            }}
          >
            <Feather
              name={toast.type === "error" ? "x-circle" : "check-circle"}
              size={15}
              color="white"
            />
            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>
              {toast.msg}
            </Text>
          </View>
        </View>
      )}

      {/* Modal: Vincular empresa existente al período */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.4)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={{
              width: 500,
              maxHeight: "75%",
              backgroundColor: C.card,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: C.border,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ fontSize: 16, fontWeight: "800", color: C.text }}
                >
                  Vincular empresa — {selectedPeriodo?.nombre}
                </Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <Feather name="x" size={18} color={C.textMuted} />
                </TouchableOpacity>
              </Row>
              <Row
                style={{
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: C.bg,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: C.border,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  marginTop: 12,
                }}
              >
                <Feather name="search" size={13} color={C.textMuted} />
                <TextInput
                  value={searchAdd}
                  onChangeText={setSearchAdd}
                  placeholder="Buscar empresa…"
                  placeholderTextColor={C.textLight}
                  style={{ flex: 1, fontSize: 13, color: C.text }}
                />
              </Row>
            </View>
            <ScrollView style={{ maxHeight: 380 }}>
              {availableToAdd.length === 0 ? (
                <View style={{ padding: 32, alignItems: "center" }}>
                  <Feather name="check-circle" size={28} color={C.green} />
                  <Text
                    style={{ fontSize: 13, color: C.textMuted, marginTop: 10 }}
                  >
                    Todas las empresas ya están en este período
                  </Text>
                </View>
              ) : (
                availableToAdd.map((emp) => (
                  <View
                    key={emp.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 13,
                      borderBottomWidth: 1,
                      borderBottomColor: C.borderLight,
                    }}
                  >
                    <Row style={{ alignItems: "center" }}>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: C.text,
                          }}
                        >
                          {emp.name}
                        </Text>
                        <Text style={{ fontSize: 11, color: C.textMuted }}>
                          {emp.sector} · {emp.ciudad}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => addEmpresa(emp.id)}
                        disabled={adding === emp.id}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 7,
                          borderRadius: 8,
                          backgroundColor:
                            adding === emp.id ? C.textLight : C.tealLight,
                          borderWidth: 1,
                          borderColor: C.teal,
                        }}
                      >
                        {adding === emp.id ? (
                          <ActivityIndicator size="small" color={C.teal} />
                        ) : (
                          <Row style={{ alignItems: "center", gap: 5 }}>
                            <Feather name="plus" size={13} color={C.teal} />
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: "700",
                                color: C.teal,
                              }}
                            >
                              Agregar
                            </Text>
                          </Row>
                        )}
                      </TouchableOpacity>
                    </Row>
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal: Crear nueva empresa */}
      <Modal visible={showCrearModal} transparent animationType="fade">
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setShowCrearModal(false)}
        >
          <Pressable
            style={{
              width: 520,
              backgroundColor: C.card,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: C.border,
              overflow: "hidden",
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View
              style={{
                padding: 24,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: C.border,
              }}
            >
              <Row
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
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
                  <View>
                    <Text
                      style={{ fontSize: 18, fontWeight: "800", color: C.text }}
                    >
                      Nueva Empresa
                    </Text>
                    {selectedPeriodo && (
                      <Text
                        style={{ fontSize: 11, color: C.teal, marginTop: 2 }}
                      >
                        Se agregará al período: {selectedPeriodo.nombre}
                      </Text>
                    )}
                  </View>
                </Row>
                <TouchableOpacity onPress={() => setShowCrearModal(false)}>
                  <Feather name="x" size={20} color={C.textMuted} />
                </TouchableOpacity>
              </Row>
            </View>

            <ScrollView
              style={{ padding: 24, maxHeight: 460 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Nombre */}
              <LabelInput
                C={C}
                label="Nombre *"
                value={empresaForm.name}
                onChange={(v) => setEmpresaForm({ ...empresaForm, name: v })}
                placeholder="Ej: Telmex S.A. de C.V."
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
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {SECTOR_OPTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() =>
                      setEmpresaForm({ ...empresaForm, sector: s })
                    }
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: empresaForm.sector === s ? C.teal : C.border,
                      backgroundColor:
                        empresaForm.sector === s ? C.tealLight : C.card,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "600",
                        color: empresaForm.sector === s ? C.teal : C.textMuted,
                      }}
                    >
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

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
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                {ESTADO_EMP_OPTS.map((s) => {
                  const st = STATUS_COLOR[s] || STATUS_COLOR.Nueva;
                  const sel = empresaForm.status === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() =>
                        setEmpresaForm({ ...empresaForm, status: s })
                      }
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        borderWidth: 1,
                        borderColor: sel ? st.color : C.border,
                        backgroundColor: C.card,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "600",
                          color: sel ? st.color : C.textMuted,
                        }}
                      >
                        {s}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Ciudad */}
              <LabelInput
                C={C}
                label="Ciudad"
                value={empresaForm.ciudad}
                onChange={(v) => setEmpresaForm({ ...empresaForm, ciudad: v })}
                placeholder="Ej: Minatitlán"
              />

              {/* Contacto */}
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: C.text,
                  marginBottom: 12,
                }}
              >
                Contacto principal
              </Text>
              <Row style={{ gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <LabelInput
                    C={C}
                    label="Nombre"
                    value={empresaForm.contactoNombre}
                    onChange={(v) =>
                      setEmpresaForm({ ...empresaForm, contactoNombre: v })
                    }
                    placeholder="Ing. Juan Pérez"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <LabelInput
                    C={C}
                    label="Teléfono (10 dígitos)"
                    value={empresaForm.contactoTel}
                    onChange={(v) =>
                      setEmpresaForm({
                        ...empresaForm,
                        contactoTel: v.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="8121234567"
                    keyboardType="numeric"
                  />
                  {empresaForm.contactoTel.length > 0 &&
                    empresaForm.contactoTel.length !== 10 && (
                      <Text
                        style={{
                          fontSize: 11,
                          color: "#DC2626",
                          marginTop: -10,
                          marginBottom: 12,
                        }}
                      >
                        {empresaForm.contactoTel.length}/10 dígitos
                      </Text>
                    )}
                </View>
              </Row>

              {/* Botones */}
              <Row style={{ gap: 10, marginBottom: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowCrearModal(false)}
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
                  onPress={crearEmpresa}
                  disabled={savingEmpresa}
                  style={{
                    flex: 2,
                    paddingVertical: 11,
                    borderRadius: 9,
                    backgroundColor: savingEmpresa ? C.textLight : C.teal,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  {savingEmpresa ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Feather name="plus-circle" size={15} color="white" />
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "white",
                        }}
                      >
                        {selectedPeriodo
                          ? "Crear y agregar al período"
                          : "Crear Empresa"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Row>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
const TABS = [
  { id: "residentes", label: "Residentes", icon: "users" },
  { id: "asesores", label: "Asesores", icon: "user-check" },
  { id: "periodos", label: "Períodos", icon: "calendar" },
  { id: "empresas_periodo", label: "Empresas / Período", icon: "briefcase" },
];

export default function AdminSistema() {
  const { colors: C } = useTheme();
  const [activeTab, setActiveTab] = useState("residentes");

  return (
    <View style={{ backgroundColor: C.bg }}>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Row style={{ alignItems: "center", marginBottom: 4 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: C.tealLight,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Feather name="settings" size={19} color={C.teal} />
          </View>
          <View>
            <Text style={{ fontSize: 22, fontWeight: "800", color: C.text }}>
              Administración del Sistema
            </Text>
            <Text style={{ fontSize: 13, color: C.textMuted }}>
              Gestión centralizada de datos
            </Text>
          </View>
        </Row>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 24 }}
      >
        <View
          style={{
            flexDirection: "row",
            backgroundColor: C.card,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: C.border,
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 9,
                  borderRadius: 9,
                  backgroundColor: active ? C.teal : "transparent",
                  marginRight: 6,
                }}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={active ? "white" : C.textMuted}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? "700" : "500",
                    color: active ? "white" : C.textMuted,
                    marginLeft: 7,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Contenido */}
      <View>
        {activeTab === "residentes" && <ResidentesTab />}
        {activeTab === "asesores" && <AsesoresTab />}
        {activeTab === "periodos" && <PeriodosTab />}
        {activeTab === "empresas_periodo" && <EmpresasPeriodoTab />}
      </View>
    </View>
  );
}
