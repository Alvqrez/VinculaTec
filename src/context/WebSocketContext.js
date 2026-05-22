import { createContext, useContext, useEffect, useState, useRef } from "react";
import { Platform } from "react-native";

const WebSocketCtx = createContext(null);

export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    // No inicializar WebSocket en móvil por ahora
    if (Platform.OS !== "web") {
      return;
    }

    // Solo importar socket.io-client en web
    const { io } = require("socket.io-client");

    // Crear socket solo si no existe
    if (!socketRef.current) {
      socketRef.current = io("https://flock-gratuity-dancing.ngrok-free.dev", {
        autoConnect: false,
        withCredentials: true,
      });
    }

    const socket = socketRef.current;

    // Conectar al servidor WebSocket
    socket.connect();

    socket.on("connect", () => {
      console.log("[WebSocket] Conectado al servidor");
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("[WebSocket] Desconectado del servidor");
      setConnected(false);
    });

    // Escuchar evento de reporte actualizado
    socket.on("reporte_actualizado", (data) => {
      console.log("[WebSocket] Reporte actualizado:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <WebSocketCtx.Provider value={{ socket: socketRef.current, connected }}>
      {children}
    </WebSocketCtx.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketCtx);
}
