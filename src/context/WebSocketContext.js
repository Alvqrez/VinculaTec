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

// FIX #4: WebSocketProvider acepta `usuario` como prop.
// Cuando el usuario inicia sesión (o el socket se reconecta), se emite
// "join_room" para que el socket entre en las salas "user_<id>" y
// "role_<rol>". Así el servidor puede emitir eventos solo al Jefe de
// vinculación sin hacer broadcast a todos los clientes.
export function WebSocketProvider({ children, usuario }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  // Ref para acceder siempre al valor más reciente de usuario dentro de callbacks
  const usuarioRef = useRef(usuario);

  useEffect(() => {
    usuarioRef.current = usuario;
  }, [usuario]);

  // Función helper para unirse a las salas del usuario
  const joinRooms = useCallback((socket, user) => {
    if (!socket || !user?.id) return;
    socket.emit("join_room", { userId: user.id, rol: user.rol });
  }, []);

  useEffect(() => {
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
      // Si ya hay sesión activa al momento de conectar (p. ej. reconexión),
      // unirse a las salas de inmediato.
      joinRooms(socket, usuarioRef.current);
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

  // Unirse a las salas cada vez que el usuario cambia (login / logout)
  useEffect(() => {
    if (socketRef.current?.connected && usuario?.id) {
      joinRooms(socketRef.current, usuario);
    }
  }, [usuario, joinRooms]);

  /**
   * Suscribirse a un evento de WebSocket.
   * Devuelve una función de limpieza para usar en useEffect.
   */
  const subscribe = useCallback((event, handler) => {
    const socket = socketRef.current;
    if (!socket) return () => {};
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  /** Emitir un evento al servidor. */
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
