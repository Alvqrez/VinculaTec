/**
 * FotosContext
 * Almacén centralizado de fotos de perfil de todos los usuarios.
 * Las fotos se persisten en la base de datos a través de la API.
 */
import { createContext, useContext, useState, useCallback } from "react";
import { API_BASE } from "../config/api";

const FotosCtx = createContext(null);

const getAuthToken = () => {
  try {
    return globalThis?.localStorage?.getItem("authToken") ?? null;
  } catch {
    return null;
  }
};

export function FotosProvider({ children }) {
  const [fotos, setFotos] = useState({});

  /**
   * Llamar desde cada *App.js al montar, pasando el id del usuario logueado.
   * Carga la foto desde la BD y la guarda en el estado local.
   */
  const initUser = useCallback(async (userId) => {
    if (!userId) return;
    const token = getAuthToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/fotos/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.foto) {
        setFotos((prev) => ({ ...prev, [String(userId)]: json.foto }));
      }
    } catch (err) {
      console.error("FotosContext initUser error:", err);
    }
  }, []);

  const getFoto = useCallback(
    (userId) => (userId ? fotos[String(userId)] || null : null),
    [fotos],
  );

  const setFoto = useCallback(async (userId, base64OrNull) => {
    if (!userId) return;
    const key = String(userId);
    const token = getAuthToken();
    if (!token) { console.error("setFoto: sin token"); return; }

    try {
      if (base64OrNull === null) {
        await fetch(`${API_BASE}/fotos`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setFotos((prev) => { const n = { ...prev }; delete n[key]; return n; });
      } else {
        const res = await fetch(`${API_BASE}/fotos`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ foto_base64: base64OrNull }),
        });
        const json = await res.json();
        if (json.ok) {
          setFotos((prev) => ({ ...prev, [key]: base64OrNull }));
        } else {
          console.error("setFoto error:", json.mensaje);
        }
      }
    } catch (err) {
      console.error("setFoto error:", err);
    }
  }, []);

  const loadFoto = useCallback(async (userId) => {
    if (!userId) return null;
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await fetch(`${API_BASE}/fotos/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.ok && json.foto) {
        setFotos((prev) => ({ ...prev, [String(userId)]: json.foto }));
        return json.foto;
      }
      return null;
    } catch (err) {
      console.error("loadFoto error:", err);
      return null;
    }
  }, []);

  return (
    <FotosCtx.Provider value={{ getFoto, setFoto, loadFoto, initUser }}>
      {children}
    </FotosCtx.Provider>
  );
}

export function useFotos() {
  return useContext(FotosCtx);
}
