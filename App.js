import { useState } from "react";
import LoginScreen from "./src/shared/LoginScreen";
import ResidenteApp from "./src/roles/residente/ResidenteApp";
import AsesorApp from "./src/roles/asesor/AsesorApp";
import JefeApp from "./src/roles/jefe/JefeApp";
import { setAuthToken } from "./src/context/AuthContext";
import { ReportesProvider } from "./src/context/ReportesContext";
import { NotificacionesProvider } from "./src/context/NotificacionesContext";
import { ProyectosProvider } from "./src/context/ProyectosContext";
import { FotosProvider } from "./src/context/FotosContext";
import { API_BASE } from "./src/config/api";

export default function App() {
  const [screen, setScreen] = useState("login");
  const [usuario, setUsuario] = useState(null);
  const [loginError, setLoginError] = useState("");

  const rolNormalizado = usuario?.rol?.toLowerCase();

  const handleLogin = async (email, _password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: email, password: _password }),
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
        globalThis?.localStorage?.setItem(
          "vt_last_user_info",
          JSON.stringify({
            id: data.usuario.id,
            nombre: data.usuario.nombre,
            rol: data.usuario.rol,
          }),
        );
      } catch {
        /* sin storage */
      }

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

  return (
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
  );
}
