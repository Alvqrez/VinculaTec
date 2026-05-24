import { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import { Row, Card, Badge } from "../components";
import apiClient from "../utils/apiClient";

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

const EMPTY_FORM = {
  nombre: "",
  apellidos: "",
  correo: "",
  password: "",
  confirmPassword: "",
  // Residente
  numControl: "",
  carrera: "",
  semestre: "",
  // Asesor
  departamento: "",
  numEmpleado: "",
};

export default function RegistrarUsuario() {
  const { colors: C } = useTheme();
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
  const [rol, setRol] = useState("residente");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  useEffect(() => {
    // Cargar lista de empresas para el selector de residente
    apiClient.get("/api/jefe/empresas").then((res) => {
      if (res.ok && res.body?.ok) setEmpresas(res.body.empresas || []);
    });
    // Cargar registros recientes
    apiClient.get("/api/jefe/usuarios-registrados").then((res) => {
      if (res.ok && res.body?.ok) setRegistros(res.body.usuarios || []);
    });
  }, []);

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
    if (form.password.length < 6) {
      Alert.alert(
        "Contraseña inválida",
        "La contraseña debe tener al menos 6 caracteres.",
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
      // Residente
      numControl: form.numControl.trim() || null,
      carrera: form.carrera || null,
      semestre: form.semestre ? Number(form.semestre) : null,
      // Asesor
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

    // Agregar al historial local
    setRegistros((prev) => [
      {
        id: res.body.id,
        nombre: `${form.nombre} ${form.apellidos}`,
        correo: form.correo,
        rol,
        fecha: new Date().toLocaleDateString("es-MX"),
      },
      ...prev,
    ]);

    setForm(EMPTY_FORM);
    Alert.alert(
      "¡Registrado!",
      `${form.nombre} ${form.apellidos} fue creado como ${rol}.`,
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
          Registrar Usuario
        </Text>
        <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>
          Crea cuentas de residentes y asesores
        </Text>
      </View>

      {/* Selector de rol */}
      <Card style={{ marginBottom: 20, padding: 18 }}>
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
          Tipo de usuario
        </Text>
        <Row style={{ gap: 12 }}>
          {ROL_OPTS.map((opt) => {
            const active = rol === opt.id;
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => setRol(opt.id)}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  padding: 14,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: active ? opt.color : C.border,
                  backgroundColor: active ? opt.bg : C.card,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: active ? opt.color : C.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={opt.icon}
                    size={17}
                    color={active ? "white" : C.textMuted}
                  />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: active ? opt.color : C.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    {opt.id === "residente"
                      ? "Alumno en residencia"
                      : "Docente supervisor"}
                  </Text>
                </View>
                {active && (
                  <View
                    style={{
                      marginLeft: "auto",
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: opt.color,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Feather name="check" size={12} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </Row>
      </Card>

      {/* Datos generales */}
      <Card style={{ marginBottom: 20, padding: 18 }}>
        <Row style={{ alignItems: "center", gap: 8, marginBottom: 16 }}>
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
            <Feather name="user" size={15} color={C.blue} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>
            Datos personales
          </Text>
        </Row>
        <Row style={{ gap: 12, marginBottom: 0 }}>
          <Field
            C={C}
            label="Nombre(s)"
            value={form.nombre}
            onChangeText={(v) => set("nombre", v)}
            placeholder="Ej. Carlos"
            style={{ flex: 1 }}
          />
          <Field
            C={C}
            label="Apellidos"
            value={form.apellidos}
            onChangeText={(v) => set("apellidos", v)}
            placeholder="Ej. Ramírez López"
            style={{ flex: 1 }}
          />
        </Row>
        <Field
          C={C}
          label="Correo electrónico"
          value={form.correo}
          onChangeText={(v) => set("correo", v)}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
        />
        <Row style={{ gap: 12 }}>
          <Field
            C={C}
            label="Contraseña"
            value={form.password}
            onChangeText={(v) => set("password", v)}
            placeholder="Mínimo 6 caracteres"
            secureTextEntry
            style={{ flex: 1 }}
          />
          <Field
            C={C}
            label="Confirmar contraseña"
            value={form.confirmPassword}
            onChangeText={(v) => set("confirmPassword", v)}
            placeholder="Repite la contraseña"
            secureTextEntry
            style={{ flex: 1 }}
          />
        </Row>
      </Card>

      {/* Datos específicos por rol */}
      {rol === "residente" && (
        <Card style={{ marginBottom: 20, padding: 18 }}>
          <Row style={{ alignItems: "center", gap: 8, marginBottom: 16 }}>
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
              <Feather name="book-open" size={15} color={C.blue} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>
              Datos académicos
            </Text>
          </Row>
          <Row style={{ gap: 12 }}>
            <Field
              C={C}
              label="Número de control"
              value={form.numControl}
              onChangeText={(v) => set("numControl", v)}
              placeholder="Ej. 20XXXXXX"
              style={{ flex: 1 }}
            />
            <Field
              C={C}
              label="Semestre"
              value={form.semestre}
              onChangeText={(v) => set("semestre", v)}
              placeholder="Ej. 9"
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
          </Row>
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
              Carrera
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {CARRERAS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => set("carrera", c)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: form.carrera === c ? C.blue : C.border,
                    backgroundColor: form.carrera === c ? C.blueLight : C.card,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: form.carrera === c ? C.blue : C.textMuted,
                    }}
                  >
                    {c}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
      )}

      {rol === "asesor" && (
        <Card style={{ marginBottom: 20, padding: 18 }}>
          <Row style={{ alignItems: "center", gap: 8, marginBottom: 16 }}>
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
              <Feather name="briefcase" size={15} color={C.teal} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "800", color: C.text }}>
              Datos laborales
            </Text>
          </Row>
          <Field
            C={C}
            label="Número de empleado"
            value={form.numEmpleado}
            onChangeText={(v) => set("numEmpleado", v)}
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {DEPARTAMENTOS.map((d) => (
                <TouchableOpacity
                  key={d}
                  onPress={() => set("departamento", d)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: form.departamento === d ? C.teal : C.border,
                    backgroundColor:
                      form.departamento === d ? C.tealLight : C.card,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: form.departamento === d ? C.teal : C.textMuted,
                    }}
                  >
                    {d}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Card>
      )}

      {/* Botón guardar */}
      <TouchableOpacity
        onPress={guardar}
        disabled={saving}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 15,
          borderRadius: 12,
          backgroundColor: saving ? C.textLight : C.teal,
          marginBottom: 28,
        }}
      >
        {saving ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Feather name="user-plus" size={16} color="white" />
            <Text style={{ fontSize: 15, fontWeight: "700", color: "white" }}>
              Registrar {rol === "residente" ? "Residente" : "Asesor"}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Historial */}
      {registros.length > 0 && (
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
            Registros recientes
          </Text>
          <View style={{ gap: 10, marginBottom: 24 }}>
            {registros.map((r) => (
              <Card
                key={r.id}
                style={{
                  padding: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor:
                      r.rol === "asesor" ? C.tealLight : C.blueLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={r.rol === "asesor" ? "user-check" : "user"}
                    size={18}
                    color={r.rol === "asesor" ? C.teal : C.blue}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{ fontSize: 13, fontWeight: "700", color: C.text }}
                  >
                    {r.nombre}
                  </Text>
                  <Text style={{ fontSize: 11, color: C.textMuted }}>
                    {r.correo}
                  </Text>
                </View>
                <View>
                  <Badge
                    text={r.rol}
                    color={r.rol === "asesor" ? C.teal : C.blue}
                    bg={r.rol === "asesor" ? C.tealLight : C.blueLight}
                  />
                  <Text
                    style={{
                      fontSize: 10,
                      color: C.textLight,
                      marginTop: 4,
                      textAlign: "right",
                    }}
                  >
                    {r.fecha}
                  </Text>
                </View>
              </Card>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Field({
  C,
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  multiline,
  style,
}) {
  return (
    <View style={[{ marginBottom: 14 }, style]}>
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
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType || "default"}
        multiline={multiline}
        style={{
          padding: 11,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: C.border,
          fontSize: 13,
          color: C.text,
          backgroundColor: "#FAFAFA",
          ...(multiline ? { minHeight: 80, textAlignVertical: "top" } : {}),
        }}
      />
    </View>
  );
}
