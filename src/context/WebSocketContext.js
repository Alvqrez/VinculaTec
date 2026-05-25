import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { Platform } from "react-native";
import { WS_BASE } from "../config/api";

const WebSocketCtx = createContext(null);

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // En móvil nativo, socket.io-client no está disponible por defecto,
    // solo habilitamos WS en web para la demo.
    if (Platform.OS !== "web") return;
    if (!WS_BASE) return;

    let socket;
    try {
      const { io } = require("socket.io-client");
      socket = io(WS_BASE, {
        autoConnect: true,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 2000,
      });
      socketRef.current = socket;
    } catch (e) {
      console.warn(
        "[WebSocket] No se pudo inicializar socket.io-client:",
        e.message,
      );
      return;
    }

    socket.on("connect", () => {
      console.log("[WebSocket] ✅ Conectado:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] ⚠️ Desconectado:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.warn("[WebSocket] Error de conexión:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * Suscribirse a un evento de WebSocket.
   * Devuelve una función de limpieza para usar en useEffect.
   *
   * Ejemplo:
   *   useEffect(() => subscribe("reporte_revisado", handler), [subscribe]);
   */
  const subscribe = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  /** Emitir un evento al servidor (para uso futuro). */
  const emit = useCallback((event, data) => {
    socketRef.current?.emit(event, data);
  }, []);

  return (
    <WebSocketCtx.Provider
      value={{ socket: socketRef.current, connected, subscribe, emit }}
    >
      {children}
    </WebSocketCtx.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketCtx);
}
