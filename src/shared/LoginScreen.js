import { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  Platform,
  Animated,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";
import Row from "../components/Row";

const titleCase = (str) =>
  str ? str.replace(/\b\w/g, (l) => l.toUpperCase()) : "";


export default function LoginScreen({ onLogin, loginError = "", onClearError }) {
  const { colors: C } = useTheme();
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [focusField, setFocus]    = useState(null);
  const [hoverBtn, setHoverBtn]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [showSupport, setSupport] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [lastUser, setLastUser] = useState(null);
  const [lastUserFoto, setLastUserFoto] = useState(null);

  useEffect(() => {
    try {
      const info = globalThis?.localStorage?.getItem("vt_last_user_info");
      if (info) {
        const parsed = JSON.parse(info);
        setLastUser(parsed);
      }
      // Lee la foto cacheada por FotosContext al cerrar sesión
      const foto = globalThis?.localStorage?.getItem("vt_last_user_foto");
      if (foto) setLastUserFoto(foto);
    } catch {
      /* sin storage */
    }
  }, []);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const displayError = loginError || error;

  const handleLogin = () => {
    if (!email.trim()) {
      setError("Ingresa tu correo institucional.");
      return;
    }
    if (!password.trim()) {
      setError("Ingresa tu contraseña.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin(email.trim(), password);
    }, 900);
  };

  const handleEmailChange = (v) => {
    setEmail(v);
    setError("");
    if (onClearError) onClearError();
  };
  const handlePasswordChange = (v) => {
    setPassword(v);
    setError("");
    if (onClearError) onClearError();
  };

  // FIXED: cada campo solo se marca en rojo si ese campo específico está vacío
  const inputStyle = (field) => {
    let borderColor = C.border;
    if (focusField === field) borderColor = C.teal;
    else if (displayError) {
      if (field === "email" && !email.trim()) borderColor = C.red;
      if (field === "password" && !password.trim()) borderColor = C.red;
    }
    return {
      padding: 11,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor,
      fontSize: 13,
      color: C.text,
      backgroundColor: focusField === field ? "#FAFFFE" : "#FAFAFA",
      outlineStyle: "none",
      transitionDuration: "150ms",
    };
  };

  const lastUserInitials = lastUser?.nombre
    ? lastUser.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        height: Platform.OS === "web" ? "100vh" : "100%",
      }}
    >
      {/* ── Panel izquierdo ── */}
      <View
        style={{
          width: "40%",
          backgroundColor: C.navy,
          padding: 48,
          justifyContent: "center",
        }}
      >
        <Row style={{ alignItems: "center", gap: 10, marginBottom: 28 }}>
          <View
            style={{
              width: 42,
              height: 42,
              backgroundColor: C.teal,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
              VT
            </Text>
          </View>
          <Text style={{ color: "white", fontSize: 22, fontWeight: "800" }}>
            VinculaTec
          </Text>
        </Row>
        <Text
          style={{
            color: "white",
            fontSize: 28,
            fontWeight: "800",
            lineHeight: 36,
            marginBottom: 12,
          }}
        >
          Sistema de Seguimiento de{"\n"}Residencias Profesionales
        </Text>
        <Text
          style={{
            color: C.textLight,
            fontSize: 14,
            lineHeight: 22,
            marginBottom: 32,
          }}
        >
          Plataforma institucional para la gestión y monitoreo integral del
          proceso de residencias.
        </Text>
        {[
          ["check-circle", "Seguimiento en tiempo real de residentes"],
          ["file-text", "Reportes parciales y final digitalizados"],
          ["briefcase", "Gestión de empresas colaboradoras"],
          ["users", "Comunicación directa asesor-residente"],
        ].map(([icon, text], i) => (
          <Row
            key={i}
            style={{ alignItems: "center", gap: 10, marginBottom: 14 }}
          >
            <View
              style={{
                width: 28,
                height: 28,
                backgroundColor: "rgba(13,148,136,0.2)",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name={icon} size={13} color={C.teal} />
            </View>
            <Text style={{ color: "#CBD5E1", fontSize: 13 }}>{text}</Text>
          </Row>
        ))}
      </View>

      {/* ── Panel derecho — centrado ── */}
      <View
        style={{
          flex: 1,
          height: Platform.OS === "web" ? "100vh" : "100%",
          backgroundColor: C.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            maxWidth: 420,
            alignSelf: "center",
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 32,
              borderWidth: 1,
              borderColor: C.border,
              shadowColor: "#000",
              shadowOpacity: 0.07,
              shadowRadius: 20,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            {/* ── Sección superior: perfil o ícono ── */}
            {lastUser ? (
              /**
               * Orden solicitado:
               * 1. Foto de perfil
               * 2. Nombre completo
               * 3. Rol (primera letra mayúscula)
               * 4. "¡Bienvenido de vuelta!" (centrado)
               */
              <View style={{ alignItems: "center", marginBottom: 24 }}>
                {/* 1. Foto de perfil — muestra la foto si existe, sino las iniciales */}
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    overflow: "hidden",
                    backgroundColor: C.teal,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {lastUserFoto ? (
                    <img
                      src={lastUserFoto}
                      alt="perfil"
                      style={{
                        width: 76,
                        height: 76,
                        objectFit: "cover",
                        borderRadius: 38,
                      }}
                    />
                  ) : (
                    <Text
                      style={{
                        color: "white",
                        fontWeight: "800",
                        fontSize: 26,
                      }}
                    >
                      {lastUserInitials}
                    </Text>
                  )}
                </View>

                {/* 2. Nombre completo */}
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: C.text,
                    marginTop: 12,
                    textAlign: "center",
                  }}
                >
                  {lastUser.nombre}
                </Text>

                {/* 3. Rol — primera letra de cada palabra en mayúscula */}
                <View
                  style={{
                    backgroundColor: C.tealLighter,
                    borderRadius: 20,
                    paddingVertical: 4,
                    paddingHorizontal: 14,
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{ fontSize: 11, color: C.teal, fontWeight: "700" }}
                  >
                    {titleCase(lastUser.rol || "Usuario")}
                  </Text>
                </View>

                {/* 4. Bienvenida centrada */}
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "800",
                    color: C.text,
                    marginTop: 16,
                    textAlign: "center",
                  }}
                >
                  ¡Bienvenido de vuelta!
                </Text>
                <Text
                  style={{
                    color: C.textMuted,
                    fontSize: 12,
                    marginTop: 3,
                    textAlign: "center",
                  }}
                >
                  Ingresa tus credenciales para continuar
                </Text>
              </View>
            ) : (
              <View style={{ marginBottom: 20 }}>
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 14,
                    backgroundColor: C.tealLight,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <Feather name="lock" size={22} color={C.teal} />
                </View>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: "800",
                    color: C.text,
                    marginBottom: 4,
                  }}
                >
                  Iniciar Sesión
                </Text>
                <Text
                  style={{ color: C.textMuted, fontSize: 13, marginBottom: 8 }}
                >
                  Ingresa tu correo institucional para continuar
                </Text>
              </View>
            )}

            {/* ── Correo ── */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: C.textSub,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Correo Institucional
            </Text>
            <View style={{ position: "relative", marginBottom: 14 }}>
              <Feather
                name="mail"
                size={14}
                color={focusField === "email" ? C.teal : C.textLight}
                style={{ position: "absolute", left: 12, top: 13, zIndex: 1 }}
              />
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="usuario@itm.edu.mx"
                placeholderTextColor={C.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocus("email")}
                onBlur={() => setFocus(null)}
                style={[inputStyle("email"), { paddingLeft: 36 }]}
              />
            </View>

            {/* ── Contraseña ── */}
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: C.textSub,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Contraseña
            </Text>
            <View
              style={{
                position: "relative",
                marginBottom: displayError ? 10 : 20,
              }}
            >
              <Feather
                name="key"
                size={14}
                color={focusField === "password" ? C.teal : C.textLight}
                style={{ position: "absolute", left: 12, top: 13, zIndex: 1 }}
              />
              <TextInput
                value={password}
                onChangeText={handlePasswordChange}
                placeholder="••••••••"
                placeholderTextColor={C.textLight}
                secureTextEntry={!showPass}
                onFocus={() => setFocus("password")}
                onBlur={() => setFocus(null)}
                returnKeyType="send"
                onSubmitEditing={handleLogin}
                style={[
                  inputStyle("password"),
                  { paddingLeft: 36, paddingRight: 40 },
                ]}
              />
              <TouchableOpacity
                onPress={() => setShowPass(!showPass)}
                style={{ position: "absolute", right: 12, top: 12 }}
              >
                <Feather
                  name={showPass ? "eye-off" : "eye"}
                  size={15}
                  color={C.textLight}
                />
              </TouchableOpacity>
            </View>

            {/* ── Error ── */}
            {!!displayError && (
              <Row
                style={{
                  alignItems: "center",
                  gap: 6,
                  backgroundColor: C.redLight,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 14,
                }}
              >
                <Feather name="alert-circle" size={13} color={C.red} />
                <Text
                  style={{
                    fontSize: 12,
                    color: C.red,
                    fontWeight: "600",
                    flex: 1,
                  }}
                >
                  {displayError}
                </Text>
              </Row>
            )}

            {/* ── Botón ── */}
            <TouchableOpacity
              onPress={handleLogin}
              onMouseEnter={() => setHoverBtn(true)}
              onMouseLeave={() => setHoverBtn(false)}
              activeOpacity={0.88}
              style={{
                backgroundColor: hoverBtn ? "#0B8074" : C.teal,
                padding: 14,
                borderRadius: 11,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                transform: [{ scale: hoverBtn ? 1.01 : 1 }],
                shadowColor: C.teal,
                shadowOpacity: hoverBtn ? 0.35 : 0.15,
                shadowRadius: 12,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text
                    style={{ color: "white", fontWeight: "800", fontSize: 15 }}
                  >
                    Acceder a VinculaTec
                  </Text>
                  <Feather name="arrow-right" size={16} color="white" />
                </>
              )}
            </TouchableOpacity>

            {/* ── Soporte ── */}
            <Row style={{ justifyContent: "center", marginTop: 18, gap: 4 }}>
              <Text style={{ color: C.textLight, fontSize: 12 }}>
                ¿Problemas para ingresar?
              </Text>
              <TouchableOpacity onPress={() => setSupport(true)}>
                <Text
                  style={{ color: C.teal, fontSize: 12, fontWeight: "700" }}
                >
                  Contactar soporte
                </Text>
              </TouchableOpacity>
            </Row>
          </View>
        </Animated.View>
      </View>

      {/* ── Modal Soporte ── */}
      <Modal visible={showSupport} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <View
            style={{
              width: 380,
              backgroundColor: C.card,
              borderRadius: 18,
              padding: 28,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Row
              style={{
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Row style={{ alignItems: "center", gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    backgroundColor: C.tealLight,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="headphones" size={18} color={C.teal} />
                </View>
                <Text
                  style={{ fontSize: 17, fontWeight: "800", color: C.text }}
                >
                  Soporte Técnico
                </Text>
              </Row>
              <TouchableOpacity onPress={() => setSupport(false)}>
                <Feather name="x" size={20} color={C.textMuted} />
              </TouchableOpacity>
            </Row>
            <Text
              style={{
                fontSize: 13,
                color: C.textMuted,
                marginBottom: 22,
                lineHeight: 20,
              }}
            >
              Si tienes problemas para acceder, comunícate con el equipo de
              soporte del Instituto:
            </Text>
            {[
              ["phone", "Teléfono", "+52 (229) 000-0000   Ext. 100"],
              ["mail", "Correo", "soporte@itm.edu.mx"],
              ["clock", "Horario", "Lun–Vie · 8:00 – 18:00 hrs"],
            ].map(([icon, label, value]) => (
              <Row
                key={label}
                style={{
                  gap: 14,
                  alignItems: "center",
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: C.borderLight,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    backgroundColor: C.bg,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name={icon} size={16} color={C.teal} />
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: C.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    {label}
                  </Text>
                  <Text
                    style={{ fontSize: 13, fontWeight: "600", color: C.text }}
                  >
                    {value}
                  </Text>
                </View>
              </Row>
            ))}
            <TouchableOpacity
              onPress={() => setSupport(false)}
              style={{
                marginTop: 20,
                backgroundColor: C.teal,
                borderRadius: 10,
                paddingVertical: 11,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                Entendido
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
