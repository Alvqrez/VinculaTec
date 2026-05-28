import { useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Text,
  TextInput,
  Platform,
  View,
  ActivityIndicator,
} from "react-native";
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from "@expo-google-fonts/sora";

import LoginScreen from "./src/shared/LoginScreen";
import ResidenteApp from "./src/roles/residente/ResidenteApp";
import AsesorApp from "./src/roles/asesor/AsesorApp";
import JefeApp from "./src/roles/jefe/JefeApp";

import { setAuthToken } from "./src/context/AuthContext";
import { API_BASE } from "./src/config/api";
import { ReportesProvider } from "./src/context/ReportesContext";
import { NotificacionesProvider } from "./src/context/NotificacionesContext";
import { ProyectosProvider } from "./src/context/ProyectosContext";
import { FotosProvider } from "./src/context/FotosContext";
import { ThemeProvider } from "./src/context/ThemeContext";
import { WebSocketProvider } from "./src/context/WebSocketContext";

export default function App() {
  // ── 1. Cargar fuentes Sora ────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  // ── Aplicar Sora globalmente ──────────────────────────────────────────────
  if (fontsLoaded) {
    if (!Text.defaultProps?._soraApplied) {
      const fontFamily = Platform.OS === "web" ? "Sora" : "Sora_400Regular";
      Text.defaultProps = {
        ...(Text.defaultProps || {}),
        style: [{ fontFamily }],
        _soraApplied: true,
      };
      TextInput.defaultProps = {
        ...(TextInput.defaultProps || {}),
        style: [{ fontFamily }],
      };
    }
  }

  // ── 2. Estado de sesión ───────────────────────────────────────────────────
  const [screen, setScreen] = useState("login");
  const [usuario, setUsuario] = useState(null);
  const [loginError, setLoginError] = useState("");

  const rolNormalizado = usuario?.rol?.toLowerCase();

  const handleLogin = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoginError(
          data.mensaje || "Credenciales incorrectas. Intenta de nuevo.",
        );
        return;
      }
      setLoginError("");
      setAuthToken(data.token);
      setUsuario(data.usuario);
      try {
        localStorage.setItem(
          "vt_last_user_info",
          JSON.stringify({
            id: data.usuario.id,
            nombre: data.usuario.nombre,
            rol: data.usuario.rol,
          }),
        );
      } catch {
        /* sin localStorage */
      }
      setScreen("app");
    } catch (err) {
      setLoginError("Error de conexión. ¿El backend está corriendo?");
      console.error(err);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUsuario(null);
    setLoginError("");
    setScreen("login");
  };

  // ── 3. Pantalla de carga mientras las fuentes no están listas ─────────────
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  // ── 4. Árbol de providers ─────────────────────────────────────────────────
  // ProyectosProvider solo se monta para el Asesor (ver AsesorApp).
  // Aquí se mantiene en el árbol global para que el contexto esté disponible,
  // pero el fetch real solo ocurre cuando AsesorApp llama reload().
  return (
    <SafeAreaProvider>
      <WebSocketProvider usuario={usuario}>
        <ThemeProvider>
          <FotosProvider>
            <ProyectosProvider>
              <ReportesProvider>
                <NotificacionesProvider initialUnread={0}>
                  {screen === "login" || !usuario ? (
                    <LoginScreen
                      onLogin={handleLogin}
                      loginError={loginError}
                      onClearError={() => setLoginError("")}
                    />
                  ) : rolNormalizado === "residente" ? (
                    <ResidenteApp usuario={usuario} onLogout={handleLogout} />
                  ) : rolNormalizado === "asesor" ? (
                    <AsesorApp usuario={usuario} onLogout={handleLogout} />
                  ) : rolNormalizado === "jefe" ? (
                    <JefeApp usuario={usuario} onLogout={handleLogout} />
                  ) : (
                    <LoginScreen
                      onLogin={handleLogin}
                      loginError={loginError}
                      onClearError={() => setLoginError("")}
                    />
                  )}
                </NotificacionesProvider>
              </ReportesProvider>
            </ProyectosProvider>
          </FotosProvider>
        </ThemeProvider>
      </WebSocketProvider>
    </SafeAreaProvider>
  );
}
