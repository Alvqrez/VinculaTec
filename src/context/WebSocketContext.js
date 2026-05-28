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

/**
 * WebSocketProvider
 *
 * FIX: Se agregó un guard para no intentar conectar si WS_BASE es null
 * (ocurre cuando un compañero no tiene .env.local configurado).
 * En ese caso el contexto funciona en modo "sin conexión" y no genera
 * errores en consola en bucle.
 */
export function WebSocketProvider({ children, usuario }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const usuarioRef = useRef(usuario);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  const joinRooms = useCallback((socket, user) => {
    if (!socket || !user?.id) return;
    socket.emit("join_room", { userId: user.id, rol: user.rol });
  }, []);

  useEffect(() => {
    // Solo en web
    if (Platform.OS !== "web") return;

    // Guard: si no hay URL configurada, no intentar conectar
    if (!WS_BASE) {
      console.warn(
        "[WebSocket] ⚠️ WS_BASE no configurado. " +
          "Crea .env.local con REACT_APP_API_URL para habilitar tiempo real.",
      );
      return;
    }

    let socket;
    try {
      const { io } = require("socket.io-client");
      socket = io(WS_BASE, {
        autoConnect: true,
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5, // reducido de 10 a 5
        reconnectionDelay: 3000, // aumentado de 2000 a 3000 ms
        reconnectionDelayMax: 10000, // tope de 10 s entre reintentos
        timeout: 10000,
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
      joinRooms(socket, usuarioRef.current);
    });

    socket.on("disconnect", (reason) => {
      console.log("[WebSocket] ⚠️ Desconectado:", reason);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      // Solo loguear una vez, no en cada reintento
      console.warn("[WebSocket] Error de conexión:", err.message);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Unirse a las salas cuando el usuario cambia (login / logout)
  useEffect(() => {
    if (socketRef.current?.connected && usuario?.id) {
      joinRooms(socketRef.current, usuario);
    }
  }, [usuario, joinRooms]);

  const subscribe = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

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
