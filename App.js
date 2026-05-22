import { useState } from "react";
import { Text, TextInput } from "react-native";
import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from "@expo-google-fonts/sora";

import LoginScreen    from "./src/shared/LoginScreen";
import ResidenteApp   from "./src/roles/residente/ResidenteApp";
import AsesorApp      from "./src/roles/asesor/AsesorApp";
import JefeApp        from "./src/roles/jefe/JefeApp";

import { setAuthToken }          from "./src/context/AuthContext";
import { API_BASE }              from "./src/config/api";
import { ReportesProvider }      from "./src/context/ReportesContext";
import { NotificacionesProvider } from "./src/context/NotificacionesContext";
import { ProyectosProvider }     from "./src/context/ProyectosContext";
import { FotosProvider }         from "./src/context/FotosContext";
import { ThemeProvider }         from "./src/context/ThemeContext";
import { WebSocketProvider }     from "./src/context/WebSocketContext";

export default function App() {
  // ── 1. Cargar Sora ────────────────────────────────────────────────────────
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  // Aplicar Sora globalmente a todos los componentes Text y TextInput
  // (se hace una sola vez, en cuanto cargan las fuentes)
  if (fontsLoaded) {
    if (!Text.defaultProps?._soraApplied) {
      Text.defaultProps = { ...(Text.defaultProps || {}), style: [{ fontFamily: "Sora_400Regular" }], _soraApplied: true };
      TextInput.defaultProps = { ...(TextInput.defaultProps || {}), style: [{ fontFamily: "Sora_400Regular" }] };
    }
  }

  // ── 2. Estado de sesión ───────────────────────────────────────────────────
  const [screen, setScreen]         = useState("login");
  const [usuario, setUsuario]       = useState(null);
  const [loginError, setLoginError] = useState("");

  const rolNormalizado = usuario?.rol?.toLowerCase();

  const handleLogin = async (email, password) => {
    try {
      const res  = await fetch(`${API_BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ correo: email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoginError(data.mensaje || "Credenciales incorrectas. Intenta de nuevo.");
        return;
      }
      setLoginError("");
      setAuthToken(data.token);
      setUsuario(data.usuario);
      try {
        localStorage.setItem(
          "vt_last_user_info",
          JSON.stringify({ id: data.usuario.id, nombre: data.usuario.nombre, rol: data.usuario.rol }),
        );
      } catch { /* sin localStorage */ }
      setScreen("app");
    } catch (err) {
      setLoginError("Error de conexión. ¿El backend está corriendo en :3001?");
      console.error(err);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUsuario(null);
    setLoginError("");
    setScreen("login");
  };

  // Mostrar nada mientras cargan las fuentes (evita flash de fuente fea)
  if (!fontsLoaded) return null;

  // ── 3. Árbol de providers ─────────────────────────────────────────────────
  return (
    <WebSocketProvider>
      <ThemeProvider>
        <FotosProvider>
          <ProyectosProvider>
            <ReportesProvider>
              <NotificacionesProvider initialUnread={4}>
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
  );
}
