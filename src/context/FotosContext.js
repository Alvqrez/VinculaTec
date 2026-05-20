/**
 * FotosContext
 * Almacén centralizado de fotos de perfil.
 * Las fotos se guardan en la BD (base64) para que sean visibles
 * desde cualquier dispositivo (no solo el que las subió).
 * Usa apiClient para mantener la misma URL base que el resto de la app.
 */
import { createContext, useContext, useState, useCallback } from "react";
import apiClient from "../utils/apiClient";

const FotosCtx = createContext(null);

export function FotosProvider({ children }) {
  const [fotos, setFotos] = useState({});

  /**
   * Llamar desde cada *App.js al montar, pasando el id del usuario logueado.
   * Carga la foto desde la BD y la guarda en el estado local.
   */
  const initUser = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const res = await apiClient.get(`/api/fotos/${userId}`);
      if (res.ok && res.body?.ok && res.body.foto) {
        setFotos((prev) => ({ ...prev, [String(userId)]: res.body.foto }));
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

    try {
      if (base64OrNull === null) {
        const res = await apiClient.delete("/api/fotos");
        if (res.ok) {
          setFotos((prev) => {
            const n = { ...prev };
            delete n[key];
            return n;
          });
        } else {
          console.error("setFoto delete error:", res.body?.mensaje);
        }
      } else {
        const res = await apiClient.post("/api/fotos", {
          foto_base64: base64OrNull,
        });
        if (res.ok && res.body?.ok) {
          setFotos((prev) => ({ ...prev, [key]: base64OrNull }));
        } else {
          console.error("setFoto error:", res.body?.mensaje);
        }
      }
    } catch (err) {
      console.error("setFoto error:", err);
    }
  }, []);

  const loadFoto = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const res = await apiClient.get(`/api/fotos/${userId}`);
      if (res.ok && res.body?.ok && res.body.foto) {
        setFotos((prev) => ({ ...prev, [String(userId)]: res.body.foto }));
        return res.body.foto;
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
