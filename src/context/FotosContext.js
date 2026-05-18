/**
 * FotosContext
 * Almacén centralizado de fotos de perfil de todos los usuarios.
 * Las fotos se persisten en la base de datos a través de la API.
 * Al iniciar, carga TODAS las fotos del usuario actual desde la BD,
 * y permite cargar fotos de otros usuarios bajo demanda.
 */
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { API_BASE } from "../config/api";

const FotosCtx = createContext(null);

// Función auxiliar para obtener el token de autenticación
const getAuthToken = () => {
  try {
    return globalThis?.localStorage?.getItem("vt_token");
  } catch {
    return null;
  }
};

export function FotosProvider({ children }) {
  const [fotos, setFotos] = useState({});
  const [currentUserId, setCurrentUserId] = useState(null);

  // Cargar la foto del usuario actual al iniciar
  useEffect(() => {
    const loadCurrentUserId = () => {
      try {
        const token = getAuthToken();
        if (token) {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setCurrentUserId(payload.id);
        }
      } catch {
        // No hacer nada si no hay token
      }
    };

    loadCurrentUserId();
  }, []);

  // Cargar foto del usuario actual desde la BD
  useEffect(() => {
    if (!currentUserId) return;

    const loadCurrentFoto = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;

        const res = await fetch(`${API_BASE}/fotos/${currentUserId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const json = await res.json();
        if (json.ok && json.foto) {
          setFotos((prev) => ({ ...prev, [currentUserId]: json.foto }));
        }
      } catch (err) {
        console.error("Error al cargar foto del usuario:", err);
      }
    };

    loadCurrentFoto();
  }, [currentUserId]);

  const getFoto = useCallback(
    (userId) => {
      if (!userId) return null;
      return fotos[String(userId)] || null;
    },
    [fotos],
  );

  const setFoto = useCallback(async (userId, base64OrNull) => {
    if (!userId) return;
    const key = String(userId);

    try {
      const token = getAuthToken();
      if (!token) {
        console.error("No hay token de autenticación");
        return;
      }

      if (base64OrNull === null) {
        // Eliminar foto de la BD
        await fetch(`${API_BASE}/fotos`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        setFotos((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        // Guardar foto en la BD
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
          console.error("Error al guardar foto:", json.mensaje);
        }
      }
    } catch (err) {
      console.error("Error al guardar/eliminar foto:", err);
    }
  }, []);

  // Función para cargar la foto de un usuario específico (útil para ver fotos de otros usuarios)
  const loadFoto = useCallback(async (userId) => {
    if (!userId) return null;

    try {
      const token = getAuthToken();
      if (!token) return null;

      const res = await fetch(`${API_BASE}/fotos/${userId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (json.ok && json.foto) {
        setFotos((prev) => ({ ...prev, [userId]: json.foto }));
        return json.foto;
      }
      return null;
    } catch (err) {
      console.error("Error al cargar foto:", err);
      return null;
    }
  }, []);

  return (
    <FotosCtx.Provider value={{ getFoto, setFoto, loadFoto }}>
      {children}
    </FotosCtx.Provider>
  );
}

export function useFotos() {
  return useContext(FotosCtx);
}
